import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { messages, conversationHistory } = await req.json();
    
    const systemPrompt = `You are a concise, professional work log auditor. Your job is to collect work details (tasks, technologies, and learnings) for a daily log.
Analyze the user's input and identify what information is missing:
- Tasks (What they did)
- Technologies/Skills (What tools/languages they used)
- Learnings/Takeaways (What they learned or resolved)

Rules:
1. If details are missing, ask exactly ONE short, targeted follow-up question about the missing item (e.g., "Which technologies did you use?" or "Did you have any learnings or challenges?").
2. Keep your replies under 15 words. Avoid paragraphs, fluff, or assumptions.
3. If all details are present, or after exactly 3 user messages, respond with "COMPLETE: [Professional one-sentence summary of work done (max 15 words)]".`;

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
