const axios = require('axios');

const GEMINI_API_KEY = 'AIzaSyCr71f2h4yB9VeGRJKiedUH_S0DAbBBtUo';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

async function getGeminiRecommendations(energyData) {
    try {
        const prompt = `Based on this smart home energy consumption data:
    
${JSON.stringify(energyData, null, 2)}

Please provide 5 specific, actionable energy-saving recommendations. For each recommendation:
1. Describe the action clearly
2. Estimate potential savings in kWh/month
3. Provide implementation steps

Format as JSON array with structure: [{"action": "...", "savings_kwh": number, "savings_usd": number, "priority": "high/medium/low", "steps": ["step1", "step2"]}]`;

        const response = await axios.post(
            GEMINI_API_URL,
            {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': GEMINI_API_KEY
                }
            }
        );

        console.log('Gemini API Response received:', response.status);
        console.log('Response structure:', JSON.stringify(response.data, null, 2).substring(0, 500));
        const generatedText = response.data.candidates[0].content.parts[0].text;

        // Try to extract JSON from the response
        let recommendations;
        try {
            // Remove markdown code blocks if present
            const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                recommendations = JSON.parse(jsonMatch[0]);
            } else {
                // Fallback: parse structured text
                recommendations = parseTextRecommendations(generatedText);
            }
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            recommendations = parseTextRecommendations(generatedText);
        }

        return recommendations;
    } catch (error) {
        console.error('Gemini API Error Details:');
        console.error('Error message:', error.message);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        throw new Error('Failed to generate recommendations');
    }
}

function parseTextRecommendations(text) {
    // Fallback parser if JSON parsing fails
    const recommendations = [];
    const lines = text.split('\n');

    let currentRec = null;
    for (const line of lines) {
        if (line.match(/^\d+\./)) {
            if (currentRec) recommendations.push(currentRec);
            currentRec = {
                action: line.replace(/^\d+\.\s*/, ''),
                savings_kwh: 10,
                savings_usd: 1.2,
                priority: 'medium',
                steps: []
            };
        } else if (currentRec && line.trim()) {
            currentRec.steps.push(line.trim());
        }
    }

    if (currentRec) recommendations.push(currentRec);

    return recommendations.slice(0, 5);
}

module.exports = { getGeminiRecommendations };
