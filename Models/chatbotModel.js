const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getChatbotResponse(messages) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages, // ← full array of [{ role, content }]
    temperature: 0.6,
  });

  return completion.choices[0].message.content;
}

module.exports = {
  getChatbotResponse
};
