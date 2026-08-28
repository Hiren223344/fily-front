/**
 * stream.js — streaming helper for playground/test console.
 * Use fetch + ReadableStream reader, not EventSource — EventSource can't send an Authorization header.
 * Parse data: lines, stop on [DONE], append tokens to state with a rAF-batched flush so React isn't re-rendering per token.
 * Abort on unmount via AbortController.
 */

import { auth } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

export async function streamChatCompletions({
  model = 'llama-3.1-70b',
  messages = [],
  prompt = null,
  temperature = 0.7,
  max_tokens = 2048,
  signal = null,
  onToken = () => {},
  onDone = () => {},
  onError = () => {},
  onStart = () => {},
}) {
  const controller = new AbortController();

  if (signal) {
    signal.addEventListener('abort', () => controller.abort(signal.reason));
  }

  // Token buffer for requestAnimationFrame batching
  let tokenBuffer = '';
  let rafId = null;

  function flushBuffer() {
    if (tokenBuffer.length > 0) {
      onToken(tokenBuffer);
      tokenBuffer = '';
    }
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function queueToken(chunk) {
    tokenBuffer += chunk;
    if (!rafId && typeof window !== 'undefined') {
      rafId = requestAnimationFrame(() => {
        flushBuffer();
      });
    } else if (typeof window === 'undefined') {
      flushBuffer();
    }
  }

  const endpoint = prompt ? `${API_BASE}/v1/completions` : `${API_BASE}/v1/chat/completions`;
  const bodyPayload = prompt
    ? { model, prompt, stream: true, temperature, max_tokens }
    : { model, messages, stream: true, temperature, max_tokens };

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
  };

  const token = auth.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    onStart();

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyPayload),
      signal: controller.signal,
      credentials: 'include',
    });

    if (!response.ok) {
      let errBody;
      try {
        errBody = await response.json();
      } catch (_) {
        errBody = { message: await response.text().catch(() => response.statusText) };
      }
      const errorMsg =
        errBody?.error?.message ||
        errBody?.message ||
        `Streaming request failed with status ${response.status}`;
      const streamErr = new Error(errorMsg);
      // Extra diagnostic fields for the UI — additive, existing callers only read .message.
      streamErr.status = response.status;
      streamErr.code = errBody?.error?.code || errBody?.code || null;
      streamErr.requestId =
        errBody?.request_id || errBody?.error?.request_id || response.headers.get('x-request-id') || null;
      throw streamErr;
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported on this response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let lineBuffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      lineBuffer += decoder.decode(value, { stream: true });
      const lines = lineBuffer.split('\n');
      // The last element is either empty or incomplete line
      lineBuffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) {
          // SSE keepalive or comment
          continue;
        }

        if (trimmed.startsWith('data:')) {
          const dataStr = trimmed.slice(5).trim();

          if (dataStr === '[DONE]') {
            flushBuffer();
            onDone();
            return { abort: () => controller.abort() };
          }

          try {
            const parsed = JSON.parse(dataStr);
            // OpenAI chat delta format
            const content =
              parsed.choices?.[0]?.delta?.content ||
              parsed.choices?.[0]?.text ||
              '';

            if (content) {
              queueToken(content);
            }
          } catch (jsonErr) {
            // Non-JSON SSE payload, treat as raw text
            if (dataStr) {
              queueToken(dataStr);
            }
          }
        }
      }
    }

    // Process any remaining text in lineBuffer
    if (lineBuffer.trim().startsWith('data:')) {
      const dataStr = lineBuffer.trim().slice(5).trim();
      if (dataStr && dataStr !== '[DONE]') {
        try {
          const parsed = JSON.parse(dataStr);
          const content = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.text || '';
          if (content) queueToken(content);
        } catch (_) {}
      }
    }

    flushBuffer();
    onDone();
  } catch (err) {
    flushBuffer();
    if (err.name === 'AbortError') {
      console.log('[stream] Stream aborted by user');
      return { abort: () => {} };
    }
    onError(err);
  }

  return {
    abort: () => {
      flushBuffer();
      controller.abort();
    },
  };
}

export default streamChatCompletions;
