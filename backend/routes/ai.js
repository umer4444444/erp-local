const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { GoogleGenAI } = require('@google/genai');
const { tools, toolDeclarations } = require('../services/aiTools');

// Initialize Gemini SDK
// Will fall back to a mock response if API key is not present
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

router.post('/query', auth, async (req, res) => {
  try {
    const { prompt, history = [] } = req.body;
    const companyId = req.user.companyId;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!companyId) {
      return res.status(403).json({ error: 'You must be associated with a company to use the AI Agent.' });
    }

    if (!ai) {
      // Mock mode for local testing without API key
      return res.json({
        response: "AI Agent is in mock mode. I heard: " + prompt + "\n\nPlease add GEMINI_API_KEY to your .env file to enable true intelligence."
      });
    }

    // Prepare system instructions context
    const systemInstruction = `You are the AI Business Assistant for an Enterprise ERP system.
    You have access to real-time business data via strict tools.
    DO NOT guess numbers. Always call a tool to get data if asked about sales, inventory, or customers.
    Answer concisely and professionally. If drafting a PO, inform the user it needs approval.`;

    // Map history to Gemini's format if provided
    // 'user' and 'model' are valid roles.
    const formattedHistory = history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Start a chat session with history
    const chat = ai.models.chat({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: toolDeclarations }],
        temperature: 0.1,
      }
    });
    
    // Inject history into the chat context manually or through the library if supported.
    // For @google/genai, history can be passed in initialization or we can send contents array.
    const contents = [...formattedHistory, { role: 'user', parts: [{ text: prompt }] }];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: toolDeclarations }],
        temperature: 0.1,
      }
    });

    // Handle tool calls if the model decides to use them
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      
      // We only execute tools if they exist in our allowed map
      if (tools[call.name]) {
        // Execute the backend tool with the companyId injected for security
        const toolResult = await tools[call.name](companyId, ...Object.values(call.args || {}));
        
        // Send the result back to Gemini to get a natural language response
        const secondResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            ...contents,
            { role: 'model', parts: [{ functionCall: call }] },
            { role: 'function', parts: [{ functionResponse: { name: call.name, response: toolResult } }] }
          ],
          config: { systemInstruction }
        });

        return res.json({ response: secondResponse.text });
      }
    }

    return res.json({ response: response.text });

  } catch (error) {
    console.error('AI Route Error:', error);
    res.status(500).json({ error: 'Failed to process AI query', details: error.message });
  }
});

module.exports = router;
