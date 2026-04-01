/**
 * LlmBrain.js
 * 
 * The "Tier 2" intelligence engine for the AI Assistant.
 * Supports dual-mode operation:
 * 1. Cloud Mode: Proxies requests to Supabase Edge Functions (Gemini/OpenAI)
 * 2. Local Mode: Connects directly to local Ollama instance (localhost:11434)
 */

import { supabase } from '../supabase';

export class LlmBrain {
    constructor(config = {}) {
        this.mode = config.mode || 'cloud'; // 'cloud' | 'local'
        this.localEndpoint = config.localEndpoint || 'http://localhost:11434/api/chat';
        this.localModel = config.localModel || 'mistral'; // or 'llama3', 'codellama'
    }

    /**
     * Main entry point for sending a message
     * @param {string} message - User's message
     * @param {object} context - { code, logs, activeFile }
     * @param {function} onStream - Callback for streaming tokens
     * @returns {Promise<string>} - Full response text
     */
    async sendMessage(message, context, onStream) {
        if (this.mode === 'local') {
            return this._sendToLocal(message, context, onStream);
        } else {
            return this._sendToCloud(message, context, onStream);
        }
    }

    /**
     * Connects to local Ollama instance
     */
    async _sendToLocal(message, context, onStream) {
        const systemPrompt = this._buildSystemPrompt(context);

        try {
            const response = await fetch(this.localEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.localModel,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: message }
                    ],
                    stream: true
                })
            });

            if (!response.ok) {
                throw new Error(`Ollama connection failed: ${response.statusText}`);
            }

            const reader = response.body.getReader();
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = new TextDecoder().decode(value);
                const lines = chunk.split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    try {
                        const json = JSON.parse(line);
                        if (json.message?.content) {
                            const token = json.message.content;
                            fullText += token;
                            if (onStream) onStream(token);
                        }
                        if (json.done) break;
                    } catch (e) {
                        console.warn('Error parsing Ollama chunk:', e);
                    }
                }
            }

            return fullText;

        } catch (error) {
            console.error('Local LLM Error:', error);
            // Fallback message if local server isn't running
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Could not connect to Ollama. Is it running on port 11434?');
            }
            throw error;
        }
    }

    /**
     * Connects to Cloud API via Supabase Edge Function
     */
    async _sendToCloud(message, context, onStream) {
        try {
            const { data, error } = await supabase.functions.invoke('ai-chat', {
                body: { message, context }
            });

            if (error) {
                throw new Error(error.message || 'Edge Function call failed');
            }

            const responseText = data?.response || 'No response from AI.';

            // Simulate streaming for smooth UX
            const words = responseText.split(' ');
            for (const word of words) {
                await new Promise(r => setTimeout(r, 30));
                if (onStream) onStream(word + ' ');
            }

            return responseText;
        } catch (error) {
            console.error('Cloud LLM Error:', error);
            if (error.message.includes('FunctionNotFound') || error.message.includes('404')) {
                throw new Error(
                    'Cloud AI is not deployed yet. Set GEMINI_API_KEY in Supabase secrets and deploy the ai-chat edge function. Switching to Heuristic mode.'
                );
            }
            throw error;
        }
    }

    _buildSystemPrompt(context) {
        return `You are the AI Lab Assistant for the Lagos Bio-Design Bootcamp.
        
        CONTEXT:
        Active File: ${context.activeFile}
        Code Content:
        \`\`\`
        ${context.code.slice(0, 2000)} 
        \`\`\`
        Terminal Logs:
        ${context.logs.slice(-5).join('\n')}
        
        INSTRUCTIONS:
        - Be concise and helpful.
        - Focus on protein design and Python.
        - Explain errors if present in logs.
        `;
    }

    /**
     * Tool: Fix Code
     * Analyzes code and error to suggest a fix.
     */
    async fixCode(code, error) {
        const prompt = `
        Fix the following Python code which produced this error: "${error}".
        Return ONLY the fixed code block. No markdown, no explanation.
        
        Code:
        ${code}
        `;

        // Reuse sendMessage logic but with a specific prompt
        // In a real agent, we'd use function calling API
        const response = await this.sendMessage(prompt, { code, logs: [], activeFile: 'fix_request' });

        // Clean up response (remove markdown code blocks if present)
        let fixedCode = response.replace(/```python/g, '').replace(/```/g, '').trim();
        return fixedCode;
    }

    /**
     * Tool: Explain Code
     * Explains the current code file.
     */
    async explainCode(code) {
        const prompt = `
        Explain what this biological Python code is doing in simple terms for a student.
        Focus on the biology (ESM, Protein Design) and the logic.
        
        Code:
        ${code}
        `;
        return await this.sendMessage(prompt, { code, logs: [], activeFile: 'explain_request' });
    }
}
