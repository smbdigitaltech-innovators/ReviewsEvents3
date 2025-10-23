const axios = require('axios');

const getHfApiKey = () => process.env.HUGGINGFACE_API_KEY || '';
const getHfSummaryModel = () => process.env.HF_SUMMARY_MODEL || 'sshleifer/distilbart-cnn-12-6';

exports.generateSummary = async (text) => {
    console.log(`Generating summary for text: "${text}" using HuggingFace`);
    const HF_API_KEY = getHfApiKey();
    const HF_SUMMARY_MODEL = getHfSummaryModel();
    if (!HF_API_KEY) {
        return text.substring(0, Math.min(text.length, 100)) + (text.length > 100 ? '...' : '');
    }
    try {
        const url = `https://api-inference.huggingface.co/models/${HF_SUMMARY_MODEL}`;
        const response = await axios.post(
            url,
            { inputs: text },
            { headers: { Authorization: `Bearer ${HF_API_KEY}` }, timeout: 20000 }
        );
        // Response: [{ summary_text: '...' }]
        const data = Array.isArray(response.data) ? response.data[0] : null;
        const summary = data?.summary_text || '';
        if (summary) return summary.trim();
        return text.substring(0, Math.min(text.length, 100)) + (text.length > 100 ? '...' : '');
    } catch (error) {
        console.error('Error calling HuggingFace summarization API:', error.message || error);
        return text.substring(0, Math.min(text.length, 100)) + (text.length > 100 ? '...' : '');
    }
};
