import { useState, useCallback, useRef } from 'react';
import { HeuristicBrain } from '../lib/ai/HeuristicBrain';
import { LlmBrain } from '../lib/ai/LlmBrain';

// The "Socket" that connects the UI to the Intelligence Provider
// Tries LlmBrain (Claude) first, falls back to HeuristicBrain on failure
export const useAiBrain = () => {
    const [messages, setMessages] = useState(() => [
        {
            id: 'init',
            role: 'assistant',
            text: "System Online. I am ready to assist with your experiments.",
            timestamp: Date.now()
        }
    ]);
    const [isThinking, setIsThinking] = useState(false);
    const [activeBrainName, setActiveBrainName] = useState(LlmBrain.name);
    const llmAvailable = useRef(true);

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
            let response;

            // Try LlmBrain if still available
            if (llmAvailable.current) {
                try {
                    response = await LlmBrain.process({ message: userText, context });
                    setActiveBrainName(LlmBrain.name);
                } catch (llmError) {
                    console.warn('LlmBrain failed, falling back to HeuristicBrain:', llmError.message);
                    llmAvailable.current = false;
                    setActiveBrainName(HeuristicBrain.name);
                    response = await HeuristicBrain.process({ message: userText, context });
                }
            } else {
                response = await HeuristicBrain.process({ message: userText, context });
            }

            // 2. Add Assistant Response
            const aiMsg = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: response.text,
                actions: response.actions,
                timestamp: Date.now()
            };

            // Simulate brief delay for heuristic responses (LLM already has natural latency)
            if (!llmAvailable.current) {
                setTimeout(() => {
                    setMessages(prev => [...prev, aiMsg]);
                    setIsThinking(false);
                }, 800);
            } else {
                setMessages(prev => [...prev, aiMsg]);
                setIsThinking(false);
            }

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
        brainName: activeBrainName
    };
};
