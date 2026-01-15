import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function getGroqResponse(history = []) {
  try {
    // Limit history to prevent token overflow (last 20 messages)
    const limitedHistory = history.slice(-20);
    
    const messages = limitedHistory.map(msg => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    }));

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    });

    const reply = completion.choices[0]?.message?.content;
    
    if (!reply || reply.trim() === "") {
      throw new Error("Empty response from AI");
    }

    return reply;
  } catch (err) {
    console.error("Groq API Error:", err.message);
    throw new Error("AI service temporarily unavailable");
  }
}