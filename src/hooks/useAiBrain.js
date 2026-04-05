import { useState, useCallback, useRef, useEffect } from 'react';
import { HeuristicBrain } from '../lib/ai/HeuristicBrain';
import { LlmBrain } from '../lib/ai/LlmBrain';

// The "Socket" that connects the UI to the Intelligence Provider
// Pro users get LlmBrain (Claude), free users get HeuristicBrain
// LlmBrain also falls back to HeuristicBrain on failure
export const useAiBrain = (userPlan = 'free') => {
    const isPro = userPlan === 'pro';
    const [messages, setMessages] = useState(() => [
        {
            id: 'init',
            role: 'assistant',
            text: "System Online. I am ready to assist with your experiments.",
            timestamp: Date.now()
        }
    ]);
    const [isThinking, setIsThinking] = useState(false);
    const [activeBrainName, setActiveBrainName] = useState(
        isPro ? LlmBrain.name : HeuristicBrain.name
    );
    const llmAvailable = useRef(isPro);

    // Sync when plan changes (e.g. upgrade mid-session)
    useEffect(() => {
        llmAvailable.current = isPro;
        setActiveBrainName(isPro ? LlmBrain.name : HeuristicBrain.name); // eslint-disable-line react-hooks/set-state-in-effect -- intentional sync on plan change
    }, [isPro]);

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

            // Try LlmBrain if still available (pro plan)
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
        brainName: activeBrainName,
        isPro
    };
};
