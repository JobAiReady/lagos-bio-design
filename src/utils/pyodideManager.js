let pyodideReadyPromise = null;
let pyodideInstance = null;

const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";

// Mock heavy libraries so the scripts run without crashing
const MOCK_SHIMS = `
import sys
from unittest.mock import MagicMock

# Mock torch
torch = MagicMock()
torch.tensor = lambda x: x
sys.modules['torch'] = torch

# Mock esm
esm = MagicMock()
class MockModel:
    def eval(self): pass
    def __call__(self, *args, **kwargs): return "mock_output"

class MockAlphabet:
    def get_batch_converter(self):
        return lambda x: (["label"], ["seq"], ["tokens"])

esm.pretrained.esm2_t33_650M_UR50D.return_value = (MockModel(), MockAlphabet())
sys.modules['esm'] = esm

# Mock colabfold
colabfold = MagicMock()
sys.modules['colabfold'] = colabfold
sys.modules['colabfold.batch'] = colabfold

print("System: Bio-Design Libraries (Simulated) Loaded.")
`;

// Loading stages with progress percentages
const STAGES = {
    DOWNLOADING: { label: 'Downloading Pyodide runtime', progress: 10 },
    INITIALIZING: { label: 'Initializing Python 3.11', progress: 40 },
    PACKAGES: { label: 'Loading packages (numpy, micropip)', progress: 70 },
    SHIMS: { label: 'Configuring bio-design libraries', progress: 90 },
    READY: { label: 'Ready', progress: 100 },
};

export { STAGES };

export const resetPyodide = () => {
    pyodideReadyPromise = null;
    pyodideInstance = null;
};

export const loadPyodide = async (onProgress) => {
    if (pyodideReadyPromise) {
        return pyodideReadyPromise;
    }

    const report = (stage) => {
        if (onProgress) onProgress(stage);
    };

    pyodideReadyPromise = new Promise((resolve, reject) => {
        report(STAGES.DOWNLOADING);

        const script = document.createElement('script');
        script.src = PYODIDE_URL;
        script.onload = async () => {
            try {
                report(STAGES.INITIALIZING);
                pyodideInstance = await window.loadPyodide();

                report(STAGES.PACKAGES);
                await pyodideInstance.loadPackage(["micropip", "numpy"]);

                report(STAGES.SHIMS);
                await pyodideInstance.runPythonAsync(MOCK_SHIMS);

                report(STAGES.READY);
                resolve(pyodideInstance);
            } catch (err) {
                resetPyodide();
                reject(err);
            }
        };
        script.onerror = () => {
            resetPyodide();
            reject(new Error('Failed to download Pyodide. Check your internet connection.'));
        };
        document.body.appendChild(script);
    });

    return pyodideReadyPromise;
};

export const runPythonScript = async (code, onOutput) => {
    if (!pyodideInstance) {
        throw new Error("Pyodide not loaded");
    }

    // Capture stdout
    pyodideInstance.setStdout({ batched: (msg) => onOutput(msg) });
    pyodideInstance.setStderr({ batched: (msg) => onOutput(`Error: ${msg}`) });

    try {
        await pyodideInstance.runPythonAsync(code);
    } catch (err) {
        onOutput(`Runtime Error: ${err.message}`);
    }
};
