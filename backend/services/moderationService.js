const OpenAI = require('openai');

let openaiClient = null;

const getOpenAIClient = () => {
    if (!openaiClient) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is not set in environment variables.');
        }
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openaiClient;
};

exports.moderateText = async (text) => {
    console.log(`Moderating text: "${text}" using OpenAI Moderation API`);
    try {
        const openai = getOpenAIClient();
        const response = await openai.moderations.create({
            input: text,
        });
        
        const moderationResult = response.results[0];
        
        // The `flagged` property indicates if the text violates OpenAI's usage policies.
        if (moderationResult.flagged) {
            console.warn("Text flagged by OpenAI Moderation API:", moderationResult.categories);
            return { flagged: true, categories: moderationResult.categories };
        } else {
            return { flagged: false };
        }
    } catch (error) {
        console.error("Error calling OpenAI Moderation API:", error);
    // Fallback: do not block publishing when moderation API fails (dev-friendly)
    // Change to flagged:true if you want stricter behavior in production.
    return { flagged: false, categories: { error: 'OpenAI API call failed' } };
    }
};
