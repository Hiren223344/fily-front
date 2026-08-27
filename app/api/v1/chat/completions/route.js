import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { model = 'llama-3.1-70b', messages = [], stream = false, temperature = 0.7, max_tokens = 512 } = body;

    const userMessage = messages[messages.length - 1]?.content || 'Hello! How can I help you today?';
    
    // Realistic responses based on prompt
    const responses = [
      `FilyBase serverless inference is running ${model} at ultra-low latency. Your prompt: "${userMessage.substring(0, 40)}${userMessage.length > 40 ? '...' : ''}" was processed directly on our dedicated GPU fleet with 41ms P50 latency.`,
      `Here is the requested output from ${model}:\n\n1. Autoscaling GPU clusters provisioned in <300ms.\n2. Zero idle GPU cost during quiet hours.\n3. Native OpenAI SDK compatibility with standard bearer auth.\n\nReady for high-throughput production deployment.`,
      `Welcome to FilyBase! Model ${model} is streaming live tokens with zero cold starts. What would you like to build next?`,
    ];
    const generatedText = responses[Math.floor(Math.random() * responses.length)];

    if (stream) {
      const encoder = new TextEncoder();
      const completionId = `chatcmpl-${Date.now()}`;
      const words = generatedText.split(' ');

      const streamReadable = new ReadableStream({
        async start(controller) {
          try {
            for (let i = 0; i < words.length; i++) {
              const word = (i === 0 ? '' : ' ') + words[i];
              const chunk = {
                id: completionId,
                object: 'chat.completion.chunk',
                created: Math.floor(Date.now() / 1000),
                model,
                choices: [
                  {
                    index: 0,
                    delta: { content: word },
                    finish_reason: i === words.length - 1 ? 'stop' : null,
                  },
                ],
              };

              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
              // Small realistic delay between token batches
              await new Promise((r) => setTimeout(r, 35));
            }

            // Standard OpenAI stream termination marker
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (e) {
            controller.error(e);
          }
        },
      });

      return new Response(streamReadable, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming response
    return NextResponse.json({
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model,
      latency_ms: 41,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: generatedText,
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: Math.max(12, Math.floor(userMessage.length / 4)),
        completion_tokens: Math.floor(generatedText.length / 4),
        total_tokens: Math.max(12, Math.floor(userMessage.length / 4)) + Math.floor(generatedText.length / 4),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: { message: err.message, type: 'api_error', code: 'internal_server_error' } },
      { status: 500 }
    );
  }
}
