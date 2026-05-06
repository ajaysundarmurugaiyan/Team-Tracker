import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { messages, conversationHistory } = await req.json();
    
    const systemPrompt = `You are an intelligent work log assistant. Your job is to have a natural conversation with the user to understand their daily work.

Ask follow-up questions based on what they tell you. Extract:
- What tasks they worked on
- Technologies/skills they used
- Challenges they faced
- What they learned
- Any achievements

Be conversational and adaptive. Don't ask all questions at once. After 4-5 meaningful exchanges, respond with "COMPLETE:" followed by a summary.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: messages }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || 'Sorry, I had trouble understanding that.';
    
    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Groq API error:', error);
    return NextResponse.json({ error: 'Failed to get AI response' }, { status: 500 });
  }
}
