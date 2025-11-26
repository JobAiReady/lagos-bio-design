import { useState, useCallback } from 'react';
import { HeuristicBrain } from '../lib/ai/HeuristicBrain';

// The "Socket" that connects the UI to the Intelligence Provider
export const useAiBrain = () => {
    const [messages, setMessages] = useState([
        {
            id: 'init',
            role: 'assistant',
            text: "System Online. I am ready to assist with your experiments.",
            timestamp: Date.now()
        }
    ]);
    const [isThinking, setIsThinking] = useState(false);

    // Current Brain (Can be swapped for LlmBrain later)
    const activeBrain = HeuristicBrain;

    const sendMessage = useCallback(async (userText, context) => {
        // 1. Add User Message
        const userMsg = {
            id: Date.now().toString(),
            role: 'user',
            text: userText,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, userMsg]);
        setIsThinking(true);

        try {
            // 2. Consult the Brain
            // We pass the entire context (code, logs, file) to the brain
            const response = await activeBrain.process({
                message: userText,
                context: context // { code, logs, activeFile }
            });

            // 3. Add Assistant Response
            const aiMsg = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: response.text,
                actions: response.actions,
                timestamp: Date.now()
            };

            // Simulate "Thinking" delay for realism (even if heuristic is instant)
            setTimeout(() => {
                setMessages(prev => [...prev, aiMsg]);
                setIsThinking(false);
            }, 800);

        } catch (error) {
            console.error("Brain Failure:", error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                text: "I encountered an internal error processing that request.",
                isError: true
            }]);
            setIsThinking(false);
        }
    }, []);

    return {
        messages,
        sendMessage,
        isThinking,
        brainName: activeBrain.name
    };
};
