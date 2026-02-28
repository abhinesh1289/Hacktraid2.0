const axios = require('axios');

module.exports = async (req, res) => {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { text, language, detailLevel } = req.body;

    if (!text) {
        return res.status(400).json({ error: "No text provided" });
    }

    const prompt = `You are a medical report simplifier. A patient has uploaded their medical report. Your job is to explain it in simple, easy-to-understand ${language || 'English'}.

IMPORTANT RULES:
- Never make a diagnosis. Always add disclaimers.
- Use simple language a non-medical person can understand.
- Be compassionate and avoid causing unnecessary anxiety.

Medical Report Text:
"""
${text}
"""

Respond ONLY with valid JSON in this exact structure:
{
  "simple": "Plain explanation (2-3 paragraphs)",
  "bullets": ["bullet 1", "bullet 2", "bullet 3", "bullet 4", "bullet 5"],
  "short": "One paragraph short summary",
  "detailed": "Detailed explanation with all findings discussed",
  "keyFindings": ["finding 1", "finding 2", "finding 3"],
  "riskLevel": "low|medium|high",
  "riskReason": "Brief reason for risk level",
  "conditions": ["possible condition 1", "possible condition 2"],
  "terms": {"term1": "simple definition", "term2": "simple definition"},
  "doctorQuestions": ["question 1", "question 2", "question 3", "question 4", "question 5"]
}`;

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 2000
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const rawContent = response.data.choices[0].message.content.replace(/```json|```/g, '').trim();
        return res.status(200).json(JSON.parse(rawContent));

    } catch (error) {
        console.error("OpenAI Error:", error.response ? error.response.data : error.message);
        return res.status(500).json({ error: "Failed to analyze report." });
    }
};
