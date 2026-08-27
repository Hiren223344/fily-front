import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { model = 'llama-3.1-70b', prompt = '', stream = false } = body;
    const text = `FilyBase inference output for ${model}. Response to: "${prompt.substring(0, 30)}..."`;

    if (stream) {
      const encoder = new TextEncoder();
      const streamReadable = new ReadableStream({
        async start(controller) {
          const words = text.split(' ');
          for (let i = 0; i < words.length; i++) {
            const chunk = {
              id: `cmpl-${Date.now()}`,
              object: 'text_completion',
              created: Math.floor(Date.now() / 1000),
              model,
              choices: [{ text: (i === 0 ? '' : ' ') + words[i], index: 0, finish_reason: null }],
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            await new Promise((r) => setTimeout(r, 40));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });
      return new Response(streamReadable, {
        headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache' },
      });
    }

    return NextResponse.json({
      id: `cmpl-${Date.now()}`,
      model,
      latency_ms: 41,
      choices: [{ text, index: 0, finish_reason: 'stop' }],
      usage: { total_tokens: 812 },
    });
  } catch (err) {
    return NextResponse.json({ error: { message: err.message, code: 'internal_error' } }, { status: 500 });
  }
}
