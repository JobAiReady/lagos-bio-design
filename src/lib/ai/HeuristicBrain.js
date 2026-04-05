// Tier 1: Heuristic Brain (Rule-based, Local, Fast)
// This brain uses pattern matching and context awareness to simulate intelligence.

export const HeuristicBrain = {
    id: 'heuristic-v1',
    name: 'Lab Assistant (Basic)',

    async process({ message, context }) {
        const lowerMsg = message.toLowerCase();
        const ctxType = context?.type || 'general';

        // --- Lesson context ---
        if (ctxType === 'lesson') {
            if (lowerMsg.includes('quiz') || lowerMsg.includes('test me')) {
                return {
                    text: `Great idea! Here's a quick check: Can you explain what **${context.moduleTitle?.split(':')[0] || 'this module'}** covers and why it matters for protein design? Think about it, then compare with the lesson summary above.`,
                    actions: []
                };
            }
            if (lowerMsg.includes('explain') || lowerMsg.includes('summary') || lowerMsg.includes('what')) {
                return {
                    text: `You're studying **${context.moduleTitle || 'a lesson'}**. The key concepts are covered in the Overview tab — read through the summary, then check the Key Terms tab to make sure you understand each definition. Ask me about any specific term!`,
                    actions: []
                };
            }
            return {
                text: `I'm here to help you study **${context.moduleTitle || 'this lesson'}**. Try asking me to explain a concept, define a key term, or quiz you on the material.`,
                actions: []
            };
        }

        // --- Lab context ---
        if (ctxType === 'lab') {
            if (lowerMsg.includes('step') || lowerMsg.includes('what do i do') || lowerMsg.includes('help')) {
                return {
                    text: `The objective of this lab is: **${context.objective || 'to complete the practical exercise'}**. Work through the steps in order — each one builds on the previous. Click on a step to mark it complete.`,
                    actions: []
                };
            }
            if (lowerMsg.includes('code') || lowerMsg.includes('command')) {
                return {
                    text: `The code in each step should be run in **Google Colab** (click "Open in Colab" in the sidebar). The browser workspace is for lightweight Python only — labs requiring GPU tools use Colab.`,
                    actions: []
                };
            }
            return {
                text: `You're in the lab for **${context.moduleTitle || 'this module'}**. I can help explain the steps, the code commands, or the expected output. What do you need?`,
                actions: []
            };
        }

        // --- Workspace context ---
        if (ctxType === 'workspace') {
            const { code, logs, activeFile } = context;

            // Error detection
            if (logs && logs.some(l => l.includes('Error') || l.includes('Exception'))) {
                const errorLog = logs.find(l => l.includes('Error') || l.includes('Exception'));
                if (errorLog.includes('SyntaxError')) {
                    return {
                        text: "I noticed a **SyntaxError** in your logs. Check for missing parentheses `()` or colons `:` at the end of your statements.",
                        actions: [{ label: "Highlight Error", type: "highlight_line" }]
                    };
                }
                if (errorLog.includes('ModuleNotFoundError')) {
                    return {
                        text: "It looks like you're missing a library. In the browser environment, only basic packages (numpy) are available. For bio-libraries like `esm` or `torch`, use **Google Colab**.",
                        actions: []
                    };
                }
                return {
                    text: `I see an error in the output: \`${errorLog}\`. Review the line mentioned in the traceback.`,
                    actions: []
                };
            }

            // Code explanations
            if (lowerMsg.includes('explain') || lowerMsg.includes('what does this do')) {
                if (code?.includes('esm.pretrained')) {
                    return {
                        text: "This code is loading the **ESM-2** protein language model — a transformer trained on millions of protein sequences to predict structure and function.",
                        actions: []
                    };
                }
                if (code?.includes('torch')) {
                    return {
                        text: "You are using **PyTorch**, a deep learning library. Here, it's likely being used to run the neural network for protein folding.",
                        actions: []
                    };
                }
                return {
                    text: `You're working on \`${activeFile}\`. I can help debug errors or explain specific libraries.`,
                    actions: []
                };
            }
        }

        // --- General / curriculum ---
        if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
            return {
                text: "Hello! I'm your **Lab Assistant** for the Lagos Bio-Design Bootcamp. I can help you study lessons, navigate labs, or debug code in the workspace. What are you working on?",
                actions: []
            };
        }

        if (lowerMsg.includes('alphafold') || lowerMsg.includes('protein')) {
            return {
                text: "**AlphaFold** predicts 3D protein structures from amino acid sequences. It's one of three core tools in this bootcamp, alongside **RFDiffusion** (generates new backbones) and **ProteinMPNN** (designs sequences for those backbones). Check Module 2 for the full pipeline!",
                actions: []
            };
        }

        return {
            text: "I'm your study companion for the Lagos Bio-Design Bootcamp. Ask me to **explain concepts**, help with **lab steps**, or **debug code** in the workspace. You can also open a lesson or lab for more targeted help!",
            actions: []
        };
    }
};
