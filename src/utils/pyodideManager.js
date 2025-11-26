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

export const loadPyodide = async () => {
    if (pyodideReadyPromise) {
        return pyodideReadyPromise;
    }

    pyodideReadyPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = PYODIDE_URL;
        script.onload = async () => {
            try {
                pyodideInstance = await window.loadPyodide();
                // Load micropri for package management if needed, but we are mocking mostly
                await pyodideInstance.loadPackage("micropip");

                // Apply shims
                await pyodideInstance.runPythonAsync(MOCK_SHIMS);

                resolve(pyodideInstance);
            } catch (err) {
                reject(err);
            }
        };
        script.onerror = (err) => reject(err);
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
