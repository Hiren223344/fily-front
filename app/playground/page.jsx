'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Nav } from '@/components/Nav';
import { streamChatCompletions } from '@/lib/stream';
import { api } from '@/lib/api';

const AVAILABLE_MODELS = [
  { id: 'llama-3.1-70b', name: 'Llama 3.1 70B', provider: 'Meta', category: 'Text' },
  { id: 'llama-3.1-8b', name: 'Llama 3.1 8B', provider: 'Meta', category: 'Text' },
  { id: 'mixtral-8x22b', name: 'Mixtral 8x22B', provider: 'Mistral', category: 'Text' },
  { id: 'qwen-2.5-32b', name: 'Qwen 2.5 32B', provider: 'Alibaba', category: 'Text' },
  { id: 'deepseek-v3', name: 'DeepSeek V3', provider: 'DeepSeek', category: 'Text' },
  { id: 'custom-fine-tune', name: 'Your fine-tune', provider: 'Custom', category: 'Text' },
];

export default function PlaygroundPage() {
  const searchParams = useSearchParams();
  const initialModel = searchParams.get('model') || 'llama-3.1-70b';

  const [model, setModel] = useState(initialModel);
  const [systemPrompt, setSystemPrompt] = useState('You are an expert AI assistant on FilyBase serverless inference.');
  const [userPrompt, setUserPrompt] = useState('Explain how serverless GPU inference achieves zero cold starts and autoscaling.');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [stream, setStream] = useState(true);

  const [output, setOutput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [latencyMs, setLatencyMs] = useState(null);
  const [ttftMs, setTtftMs] = useState(null);
  const [tokenCount, setTokenCount] = useState(0);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const abortHandleRef = useRef(null);
  const startTimeRef = useRef(0);

  // Abort on unmount via AbortController
  useEffect(() => {
    return () => {
      if (abortHandleRef.current && abortHandleRef.current.abort) {
        abortHandleRef.current.abort();
      }
    };
  }, []);

  async function handleRun() {
    if (!userPrompt.trim()) return;

    if (abortHandleRef.current && abortHandleRef.current.abort) {
      abortHandleRef.current.abort();
    }

    setOutput('');
    setError(null);
    setIsStreaming(true);
    setLatencyMs(null);
    setTtftMs(null);
    setTokenCount(0);

    const startTime = performance.now();
    startTimeRef.current = startTime;
    let firstTokenReceived = false;
    let accumulatedTokens = 0;

    const messages = [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      { role: 'user', content: userPrompt },
    ];

    if (stream) {
      // Use fetch + ReadableStream reader with rAF-batched flush
      const handle = await streamChatCompletions({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        onStart: () => {},
        onToken: (tokenChunk) => {
          if (!firstTokenReceived) {
            firstTokenReceived = true;
            const ttft = Math.round(performance.now() - startTimeRef.current);
            setTtftMs(ttft);
          }
          setOutput((prev) => prev + tokenChunk);
          accumulatedTokens += Math.max(1, Math.floor(tokenChunk.length / 4));
          setTokenCount((prev) => prev + Math.max(1, Math.floor(tokenChunk.length / 4)));
        },
        onDone: () => {
          setIsStreaming(false);
          const totalDuration = Math.round(performance.now() - startTimeRef.current);
          setLatencyMs(totalDuration);
        },
        onError: (err) => {
          setIsStreaming(false);
          setError(err.message || 'Streaming failed');
        },
      });

      abortHandleRef.current = handle;
    } else {
      // Non-streaming fallback
      try {
        const res = await api.post('/v1/chat/completions', {
          model,
          messages,
          stream: false,
          temperature,
          max_tokens: maxTokens,
        });

        const totalDuration = Math.round(performance.now() - startTime);
        setLatencyMs(totalDuration);
        setTtftMs(res.latency_ms || totalDuration);

        const content = res.choices?.[0]?.message?.content || '';
        setOutput(content);
        setTokenCount(res.usage?.total_tokens || Math.floor(content.length / 4));
      } catch (err) {
        setError(err.message || 'Request failed');
      } finally {
        setIsStreaming(false);
      }
    }
  }

  function handleStop() {
    if (abortHandleRef.current && abortHandleRef.current.abort) {
      abortHandleRef.current.abort();
    }
    setIsStreaming(false);
    if (startTimeRef.current) {
      setLatencyMs(Math.round(performance.now() - startTimeRef.current));
    }
  }

  function handleCopy() {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ background: '#f5f1e4', color: '#2c2e2a', minHeight: '100vh', paddingBottom: '80px' }}>
      <Nav variant="marketing" />

      <div style={{ maxWidth: '1280px', margin: '40px auto 0', padding: '0 24px' }}>
        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
          <div>
            <div style={{ fontSize: '15px', color: '#80827f', marginBottom: '8px' }}>TEST CONSOLE</div>
            <h1 style={{ fontSize: '53px', fontWeight: 500, letterSpacing: '-2.12px', lineHeight: 1.1, margin: 0 }}>
              Playground
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: '#80827f' }}>
              Endpoint: <span className="mono" style={{ color: '#2c2e2a' }}>POST /v1/chat/completions</span>
            </span>
          </div>
        </div>

        {/* PLAYGROUND GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', alignItems: 'start' }}>
          {/* LEFT: INPUTS & CONTROLS */}
          <div style={{ background: '#ffffff', borderRadius: '40px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Model</div>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                style={{
                  width: '100%',
                  background: '#f5f1e4',
                  border: '1px solid #e0dbce',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  color: '#2c2e2a',
                  cursor: 'pointer',
                }}
              >
                {AVAILABLE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.provider})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>System Prompt</div>
              <textarea
                rows={2}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Optional instructions for the model..."
                style={{
                  width: '100%',
                  background: '#f5f1e4',
                  border: '1px solid #e0dbce',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  color: '#2c2e2a',
                  resize: 'vertical',
                }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>User Message</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setUserPrompt('Write a high-performance HTTP reverse proxy in Go.')}
                    style={{ background: '#f5f1e4', border: 'none', borderRadius: '20px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', color: '#80827f' }}
                  >
                    Go proxy
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserPrompt('Summarize the advantages of serverless GPU inference over dedicated instances.')}
                    style={{ background: '#f5f1e4', border: 'none', borderRadius: '20px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', color: '#80827f' }}
                  >
                    Serverless
                  </button>
                </div>
              </div>
              <textarea
                rows={5}
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Enter prompt to execute on GPU..."
                style={{
                  width: '100%',
                  background: '#f5f1e4',
                  border: '1px solid #e0dbce',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  color: '#2c2e2a',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* PARAMETER SLIDERS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingTop: '8px', borderTop: '1px solid #e0dbce' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span>Temperature</span>
                  <span className="mono">{temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#8ed462' }}
                />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span>Max Tokens</span>
                  <span className="mono">{maxTokens}</span>
                </div>
                <input
                  type="range"
                  min="64"
                  max="4096"
                  step="64"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
                  style={{ width: '100%', accentColor: '#8ed462' }}
                />
              </div>
            </div>

            {/* STREAMING TOGGLE */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>SSE Streaming</div>
                <div style={{ fontSize: '12px', color: '#80827f' }}>ReadableStream reader + rAF batched flush</div>
              </div>
              <input
                type="checkbox"
                checked={stream}
                onChange={(e) => setStream(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#8ed462', cursor: 'pointer' }}
              />
            </div>

            {/* ACTIONS */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              {isStreaming ? (
                <button
                  type="button"
                  onClick={handleStop}
                  style={{
                    flex: 1,
                    background: '#ff705d',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '14px',
                    fontSize: '15px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Stop generating
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRun}
                  style={{
                    flex: 1,
                    background: '#8ed462',
                    color: '#2c2e2a',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '14px',
                    fontSize: '15px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  Execute inference →
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: STREAMING OUTPUT */}
          <div style={{ background: '#ffffff', borderRadius: '40px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: isStreaming ? '#2ba0ff' : output ? '#8ed462' : '#80827f',
                    display: 'inline-block',
                  }}
                ></span>
                <span style={{ fontSize: '15px', fontWeight: 500 }}>Output Stream</span>
              </div>
              {output && (
                <button
                  type="button"
                  onClick={handleCopy}
                  style={{
                    background: '#f5f1e4',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    color: '#2c2e2a',
                  }}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              )}
            </div>

            {/* METRICS BAR */}
            {(latencyMs !== null || ttftMs !== null || tokenCount > 0) && (
              <div style={{ display: 'flex', gap: '16px', background: '#f5f1e4', borderRadius: '16px', padding: '10px 16px', fontSize: '12px' }}>
                {ttftMs !== null && (
                  <div>
                    <span style={{ color: '#80827f' }}>TTFT: </span>
                    <span className="mono" style={{ fontWeight: 500 }}>{ttftMs}ms</span>
                  </div>
                )}
                {latencyMs !== null && (
                  <div>
                    <span style={{ color: '#80827f' }}>Total: </span>
                    <span className="mono" style={{ fontWeight: 500 }}>{latencyMs}ms</span>
                  </div>
                )}
                {tokenCount > 0 && (
                  <div>
                    <span style={{ color: '#80827f' }}>Tokens: </span>
                    <span className="mono" style={{ fontWeight: 500 }}>~{tokenCount}</span>
                  </div>
                )}
              </div>
            )}

            {/* ERROR ALERT */}
            {error && (
              <div style={{ background: '#ffebe8', color: '#ff705d', padding: '12px 16px', borderRadius: '14px', fontSize: '13px' }}>
                {error}
              </div>
            )}

            {/* TEXT STREAM DISPLAY */}
            <div
              style={{
                flex: 1,
                background: '#f5f1e4',
                borderRadius: '24px',
                padding: '20px',
                minHeight: '340px',
                overflowY: 'auto',
                fontSize: '14px',
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
                position: 'relative',
              }}
            >
              {output ? (
                <>
                  {output}
                  {isStreaming && (
                    <span
                      style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '14px',
                        background: '#2c2e2a',
                        marginLeft: '3px',
                        verticalAlign: 'middle',
                        animation: 'pulse 1s infinite',
                      }}
                    ></span>
                  )}
                </>
              ) : isStreaming ? (
                <div style={{ color: '#80827f', fontStyle: 'italic' }}>Connecting to GPU worker process & streaming tokens...</div>
              ) : (
                <div style={{ color: '#80827f' }}>Click &ldquo;Execute inference&rdquo; to test model response streaming live via SSE.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
