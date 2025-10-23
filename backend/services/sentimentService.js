const axios = require('axios');

const getHfApiKey = () => process.env.HUGGINGFACE_API_KEY || '';
const getHfSentimentModel = () => process.env.HF_SENTIMENT_MODEL || 'distilbert-base-uncased-finetuned-sst-2-english';

exports.analyzeSentiment = async (text) => {
    console.log(`Analyzing sentiment for text: "${text}" using HuggingFace`);
    const HF_API_KEY = getHfApiKey();
    const HF_SENTIMENT_MODEL = getHfSentimentModel();
    if (!HF_API_KEY) {
        console.warn('HUGGINGFACE_API_KEY not set. Defaulting sentiment to neutral.');
        return 'neutral';
    }
    try {
        const url = `https://api-inference.huggingface.co/models/${HF_SENTIMENT_MODEL}`;
        const response = await axios.post(
            url,
            { inputs: text },
            { headers: { Authorization: `Bearer ${HF_API_KEY}` }, timeout: 15000 }
        );

        // Response is typically [[{label: 'POSITIVE', score: 0.99}, {label: 'NEGATIVE', score: 0.01}]]
        const predictions = Array.isArray(response.data) ? response.data[0] : null;
        if (!predictions || !Array.isArray(predictions)) {
            return 'neutral';
        }
        // Pick the highest score label
        const best = predictions.reduce((a, b) => (a.score > b.score ? a : b));
        const label = (best.label || '').toLowerCase();
        if (label.includes('pos')) return 'positive';
        if (label.includes('neg')) return 'negative';
        return 'neutral';
    } catch (error) {
        console.error('Error calling HuggingFace sentiment API:', error.message || error);
        return 'neutral';
    }
};
