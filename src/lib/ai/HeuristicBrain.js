// Tier 1: Heuristic Brain (Rule-based, Local, Fast)
// This brain uses pattern matching and context awareness to simulate intelligence.

export const HeuristicBrain = {
    id: 'heuristic-v1',
    name: 'Lab Assistant (Basic)',

    async process({ message, context }) {
        const { code, logs, activeFile } = context;
        const lowerMsg = message.toLowerCase();

        // 1. Error Detection (High Priority)
        if (logs && logs.some(l => l.includes('Error') || l.includes('Exception'))) {
            const errorLog = logs.find(l => l.includes('Error') || l.includes('Exception'));

            if (errorLog.includes('SyntaxError')) {
                return {
                    text: "I noticed a Syntax Error in your logs. Check for missing parentheses `()` or colons `:` at the end of your statements.",
                    actions: [{ label: "Highlight Error", type: "highlight_line" }]
                };
            }
            if (errorLog.includes('ModuleNotFoundError')) {
                return {
                    text: "It looks like you're missing a library. In this environment, most bio-libraries (like `esm`, `torch`) are pre-loaded, but double-check your import spelling.",
                    actions: []
                };
            }
            return {
                text: `I see an error in the output: \`${errorLog}\`. Review the line mentioned in the traceback.`,
                actions: []
            };
        }

        // 2. Contextual Code Help
        if (lowerMsg.includes('explain') || lowerMsg.includes('what does this do')) {
            if (code.includes('esm.pretrained')) {
                return {
                    text: "This code is loading the **ESM-2** protein language model. It's a transformer model trained on millions of protein sequences to predict structure and function.",
                    actions: []
                };
            }
            if (code.includes('torch')) {
                return {
                    text: "You are using **PyTorch**, a deep learning library. Here, it's likely being used to run the neural network for protein folding.",
                    actions: []
                };
            }
            return {
                text: `You are currently working on \`${activeFile}\`. I can help you debug errors or explain specific libraries like ESM or PyTorch.`,
                actions: []
            };
        }

        // 3. General Greetings / Fallback
        if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
            return {
                text: "Hello! I'm your Lab Assistant. I'm monitoring your code and terminal for any issues. Run your script to see if I can help!",
                actions: []
            };
        }

        // Default
        return {
            text: "I'm listening. You can ask me to **explain** your code or help fix **errors** if your script fails.",
            actions: []
        };
    }
};
