import { useState, useEffect, useCallback } from 'react';
import { loadPyodide, runPythonScript, resetPyodide, STAGES } from '../utils/pyodideManager';

export const usePyodide = () => {
    const [isPythonReady, setIsPythonReady] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [stage, setStage] = useState(null);
    const [error, setError] = useState(null);
    const [output, setOutput] = useState([]);

    const appendOutput = useCallback((...lines) => {
        setOutput(prev => [...prev, ...lines]);
    }, []);

    const initPython = useCallback(async () => {
        setError(null);
        setStage(STAGES.DOWNLOADING);
        appendOutput('> Initializing Python Runtime (Pyodide)...');
        try {
            await loadPyodide((s) => setStage(s));
            setIsPythonReady(true);
            setStage(null);
            appendOutput('> Python 3.11 Ready.', '> Bio-Design Libraries (Simulated) Loaded.');
        } catch (err) {
            setStage(null);
            setError(err.message);
            appendOutput(`> Error loading Python: ${err.message}`);
        }
    }, [appendOutput]);

    useEffect(() => {
        initPython();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const retry = useCallback(() => {
        resetPyodide();
        initPython();
    }, [initPython]);

    const runScript = useCallback(async (fileName, code) => {
        if (!isPythonReady) return;
        setIsRunning(true);
        appendOutput(`> Running ${fileName}...`);
        try {
            await runPythonScript(code, (msg) => {
                setOutput(prev => [...prev, msg]);
            });
        } catch (err) {
            appendOutput(`> Execution Error: ${err.message}`);
        }
        setIsRunning(false);
    }, [isPythonReady, appendOutput]);

    return { isPythonReady, isRunning, stage, error, output, appendOutput, retry, runScript };
};
