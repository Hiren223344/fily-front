'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, Square, RotateCcw, Copy, Check, Trash2, Code2, ChevronDown, ChevronUp } from 'lucide-react';
import { Nav } from '@/components/Nav';
import { streamChatCompletions } from '@/lib/stream';
import { api } from '@/lib/api';

let idSeq = 0;
function makeId() {
  idSeq += 1;
  return `msg-${Date.now()}-${idSeq}`;
}

function formatModelPrice(m) {
  const p = m?.price;
  if (p == null) return null;
  if (typeof p === 'string') return p;
  if (typeof p !== 'object') return null;
  const inRate = Number(p.in_per_mtok) || 0;
  const outRate = Number(p.out_per_mtok) || 0;
  if (inRate || outRate) {
    return inRate === outRate ? `$${inRate} / 1M tok` : `$${inRate} in · $${outRate} out / 1M tok`;
  }
  if (Number(p.per_image)) return `$${p.per_image} / image`;
  if (Number(p.per_audio_min)) return `$${p.per_audio_min} / min`;
  return null;
}

function computeCost(modelObj, promptTokens, completionTokens) {
  const p = modelObj?.price;
  if (!p || typeof p !== 'object') return null;
  const inRate = Number(p.in_per_mtok) || 0;
  const outRate = Number(p.out_per_mtok) || 0;
  if (!inRate && !outRate) return null;
  const cost = (promptTokens * inRate + completionTokens * (outRate || inRate)) / 1e6;
  return cost;
}

function formatCost(v) {
  if (v == null) return null;
  if (v < 0.01) return `$${v.toFixed(4)}`;
  return `$${v.toFixed(2)}`;
}

function approxTokens(text) {
  return Math.max(1, Math.floor((text || '').length / 4));
}

function buildRequestMessages(systemPrompt, chatMessages) {
  const base = systemPrompt.trim() ? [{ role: 'system', content: systemPrompt.trim() }] : [];
  return [...base, ...chatMessages.map((m) => ({ role: m.role, content: m.content }))];
}

function buildSnippets({ model, requestMessages, temperature, maxTokens, stream }) {
  const messagesJson = JSON.stringify(requestMessages, null, 2);
  const bodyJson = JSON.stringify(
    { model, messages: requestMessages, temperature, max_tokens: maxTokens, stream },
    null,
    2
  );

  const curl = `curl https://api.filybase.ai/v1/chat/completions \\
  -H "Authorization: Bearer $FILYBASE_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${bodyJson}'`;

  const python = `from openai import OpenAI

client = OpenAI(
    base_url="https://api.filybase.ai/v1",
    api_key="YOUR_API_KEY",
)

response = client.chat.completions.create(
    model="${model}",
    messages=${messagesJson},
    temperature=${temperature},
    max_tokens=${maxTokens},
    stream=${stream ? 'True' : 'False'},
)`;

  const node = `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://api.filybase.ai/v1",
  apiKey: process.env.FILYBASE_API_KEY,
});

const response = await client.chat.completions.create({
  model: "${model}",
  messages: ${messagesJson},
  temperature: ${temperature},
  max_tokens: ${maxTokens},
  stream: ${stream ? 'true' : 'false'},
});`;

  return { curl, python, node };
}

const QUICK_PROMPTS = [
  { label: 'Go proxy', text: 'Write a high-performance HTTP reverse proxy in Go.' },
  { label: 'Serverless', text: 'Summarize the advantages of serverless GPU inference over dedicated instances.' },
  { label: 'SQL', text: 'Write a SQL query to find the top 5 customers by total order value.' },
];

const CODE_TABS = [
  { key: 'curl', label: 'cURL' },
  { key: 'python', label: 'Python' },
  { key: 'node', label: 'Node.js' },
];

function PlaygroundContent() {
  const searchParams = useSearchParams();
  const initialModel = searchParams?.get('model') || '';

  const [models, setModels] = useState([]);
  const [model, setModel] = useState(initialModel);

  useEffect(() => {
    let alive = true;
    api
      .get('/v1/models')
      .then((data) => {
        if (!alive) return;
        const list = Array.isArray(data) ? data : [];
        setModels(list);
        setModel((cur) => cur || list[0]?.id || '');
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const [systemPrompt, setSystemPrompt] = useState('You are an expert AI assistant on FilyBase serverless inference.');
  const [draft, setDraft] = useState('Explain how serverless GPU inference achieves zero cold starts and autoscaling.');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [stream, setStream] = useState(true);

  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [showCode, setShowCode] = useState(false);
  const [codeTab, setCodeTab] = useState('curl');

  const abortHandleRef = useRef(null);
  const startTimeRef = useRef(0);
  const transcriptRef = useRef(null);
  const composerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (abortHandleRef.current && abortHandleRef.current.abort) {
        abortHandleRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function updateMessage(id, updater) {
    setMessages((prev) => prev.map((m) => (m.id === id ? updater(m) : m)));
  }

  function runTurn(requestMessages, assistantId, promptTokensApprox) {
    setIsStreaming(true);
    setError(null);

    const startTime = performance.now();
    startTimeRef.current = startTime;
    let firstTokenReceived = false;
    const modelObj = models.find((m) => m.id === model);

    function finalize(content, totalMs, ttftMsOverride) {
      const completionTokens = approxTokens(content);
      const cost = computeCost(modelObj, promptTokensApprox, completionTokens);
      updateMessage(assistantId, (m) => ({
        ...m,
        pending: false,
        latencyMs: totalMs,
        ttftMs: m.ttftMs ?? ttftMsOverride ?? totalMs,
        tokenCount: completionTokens,
        cost,
      }));
    }

    if (stream) {
      streamChatCompletions({
        model,
        messages: requestMessages,
        temperature,
        max_tokens: maxTokens,
        onToken: (chunk) => {
          if (!firstTokenReceived) {
            firstTokenReceived = true;
            const ttft = Math.round(performance.now() - startTimeRef.current);
            updateMessage(assistantId, (m) => ({ ...m, ttftMs: ttft }));
          }
          updateMessage(assistantId, (m) => ({ ...m, content: m.content + chunk }));
        },
        onDone: () => {
          setIsStreaming(false);
          abortHandleRef.current = null;
          const totalDuration = Math.round(performance.now() - startTimeRef.current);
          updateMessage(assistantId, (m) => {
            const completionTokens = approxTokens(m.content);
            const cost = computeCost(modelObj, promptTokensApprox, completionTokens);
            return { ...m, pending: false, latencyMs: totalDuration, tokenCount: completionTokens, cost };
          });
        },
        onError: (err) => {
          setIsStreaming(false);
          abortHandleRef.current = null;
          updateMessage(assistantId, (m) => ({ ...m, pending: false, error: err.message || 'Streaming failed' }));
        },
      }).then((handle) => {
        abortHandleRef.current = handle;
      });
    } else {
      api
        .post('/v1/chat/completions', {
          model,
          messages: requestMessages,
          stream: false,
          temperature,
          max_tokens: maxTokens,
        })
        .then((res) => {
          const totalDuration = Math.round(performance.now() - startTime);
          const content = res.choices?.[0]?.message?.content || '';
          const ttft = res.latency_ms || totalDuration;
          updateMessage(assistantId, (m) => ({ ...m, content }));
          finalize(content, totalDuration, ttft);
        })
        .catch((err) => {
          updateMessage(assistantId, (m) => ({ ...m, pending: false, error: err.message || 'Request failed' }));
        })
        .finally(() => {
          setIsStreaming(false);
          abortHandleRef.current = null;
        });
    }
  }

  function handleSend() {
    const text = draft.trim();
    if (!text || isStreaming || !model) return;

    const userMsg = { id: makeId(), role: 'user', content: text };
    const assistantMsg = { id: makeId(), role: 'assistant', content: '', pending: true };
    const nextMessages = [...messages, userMsg];

    setMessages([...nextMessages, assistantMsg]);
    setDraft('');
    if (composerRef.current) composerRef.current.style.height = 'auto';

    const requestMessages = buildRequestMessages(systemPrompt, nextMessages);
    const promptTokensApprox = approxTokens(requestMessages.map((m) => m.content).join(' '));
    runTurn(requestMessages, assistantMsg.id, promptTokensApprox);
  }

  function handleStop() {
    if (abortHandleRef.current && abortHandleRef.current.abort) {
      abortHandleRef.current.abort();
    }
    setIsStreaming(false);
    const elapsed = startTimeRef.current ? Math.round(performance.now() - startTimeRef.current) : null;
    setMessages((prev) =>
      prev.map((m, i) =>
        i === prev.length - 1 && m.role === 'assistant' && m.pending
          ? { ...m, pending: false, stopped: true, latencyMs: elapsed, tokenCount: approxTokens(m.content) }
          : m
      )
    );
  }

  function handleRegenerate() {
    if (isStreaming) return;
    let lastUserIdx = -1;
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === 'user') {
        lastUserIdx = i;
        break;
      }
    }
    if (lastUserIdx === -1) return;

    const trimmed = messages.slice(0, lastUserIdx + 1);
    const assistantMsg = { id: makeId(), role: 'assistant', content: '', pending: true };
    setMessages([...trimmed, assistantMsg]);

    const requestMessages = buildRequestMessages(systemPrompt, trimmed);
    const promptTokensApprox = approxTokens(requestMessages.map((m) => m.content).join(' '));
    runTurn(requestMessages, assistantMsg.id, promptTokensApprox);
  }

  function handleNewChat() {
    if (abortHandleRef.current && abortHandleRef.current.abort) {
      abortHandleRef.current.abort();
    }
    setIsStreaming(false);
    setMessages([]);
    setError(null);
  }

  function handleCopy(id, content) {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 2000);
  }

  function handleComposerInput(e) {
    setDraft(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  }

  function handleComposerKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const lastAssistantId = [...messages].reverse().find((m) => m.role === 'assistant' && !m.pending)?.id;
  const requestMessagesForSnippet = buildRequestMessages(
    systemPrompt,
    messages.length > 0 ? messages.filter((m) => !m.pending) : [{ id: 'example', role: 'user', content: draft.trim() || 'Hello!' }]
  );
  const snippets = buildSnippets({
    model: model || 'llama-3.1-70b',
    requestMessages: requestMessagesForSnippet,
    temperature,
    maxTokens,
    stream,
  });

  return (
    <div style={{ background: '#f5f1e4', color: '#2c2e2a', minHeight: '100vh', paddingBottom: '80px' }}>
      <Nav variant="marketing" />

      <div style={{ maxWidth: '1280px', margin: '40px auto 0', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
          <div>
            <div style={{ fontSize: '15px', color: '#80827f', marginBottom: '8px' }}>TEST CONSOLE</div>
            <h1 style={{ fontSize: 'clamp(34px, 9vw, 53px)', fontWeight: 500, letterSpacing: '-2.12px', lineHeight: 1.1, margin: 0 }}>
              Playground
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: '#80827f' }}>
              Endpoint: <span className="mono" style={{ color: '#2c2e2a' }}>POST /v1/chat/completions</span>
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(360px, 100%), 1fr))', gap: '20px', alignItems: 'start' }}>
          {/* SETTINGS SIDEBAR */}
          <div style={{ background: '#ffffff', borderRadius: '40px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
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
                {models.length === 0 ? (
                  <option value={model}>{model || 'Loading models…'}</option>
                ) : (
                  models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name || m.id}{m.provider ? ` (${m.provider})` : ''}
                    </option>
                  ))
                )}
              </select>
              {(() => {
                const priceLabel = formatModelPrice(models.find((m) => m.id === model));
                return priceLabel ? (
                  <div style={{ fontSize: '12px', color: '#80827f', marginTop: '6px' }} className="mono">
                    {priceLabel}
                  </div>
                ) : null;
              })()}
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

            <div style={{ display: 'flex', gap: '10px', paddingTop: '8px', borderTop: '1px solid #e0dbce' }}>
              <button
                type="button"
                onClick={handleNewChat}
                disabled={messages.length === 0}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: '#f5f1e4',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  fontFamily: 'inherit',
                  color: '#2c2e2a',
                  cursor: messages.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: messages.length === 0 ? 0.5 : 1,
                }}
              >
                <Trash2 size={14} /> New chat
              </button>
              <button
                type="button"
                onClick={() => setShowCode((v) => !v)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: showCode ? '#2c2e2a' : '#f5f1e4',
                  color: showCode ? '#f5f1e4' : '#2c2e2a',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                <Code2 size={14} /> Code {showCode ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {showCode && (
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  {CODE_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setCodeTab(tab.key)}
                      style={{
                        background: codeTab === tab.key ? '#8ed462' : '#f5f1e4',
                        border: 'none',
                        borderRadius: '20px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        color: '#2c2e2a',
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleCopy('snippet', snippets[codeTab])}
                    style={{
                      marginLeft: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'none',
                      border: 'none',
                      borderRadius: '20px',
                      padding: '6px 10px',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      color: '#80827f',
                    }}
                  >
                    {copiedId === 'snippet' ? <Check size={13} /> : <Copy size={13} />}
                    {copiedId === 'snippet' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre
                  className="mono"
                  style={{
                    margin: 0,
                    background: '#f5f1e4',
                    borderRadius: '16px',
                    padding: '16px',
                    fontSize: '12px',
                    lineHeight: 1.6,
                    overflowX: 'auto',
                    whiteSpace: 'pre',
                    minWidth: 0,
                  }}
                >
                  {snippets[codeTab]}
                </pre>
              </div>
            )}
          </div>

          {/* CHAT PANEL */}
          <div style={{ background: '#ffffff', borderRadius: '40px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '480px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: isStreaming ? '#2ba0ff' : messages.length > 0 ? '#8ed462' : '#80827f',
                    display: 'inline-block',
                  }}
                ></span>
                <span style={{ fontSize: '15px', fontWeight: 500 }}>
                  {isStreaming ? 'Streaming…' : messages.length > 0 ? 'Conversation' : 'Output Stream'}
                </span>
              </div>
              {lastAssistantId && !isStreaming && (
                <button
                  type="button"
                  onClick={handleRegenerate}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
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
                  <RotateCcw size={13} /> Regenerate
                </button>
              )}
            </div>

            {error && (
              <div style={{ background: '#ffebe8', color: '#ff705d', padding: '12px 16px', borderRadius: '14px', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <div
              ref={transcriptRef}
              style={{
                flex: 1,
                background: '#f5f1e4',
                borderRadius: '24px',
                padding: '20px',
                minHeight: '300px',
                maxHeight: '520px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                minWidth: 0,
              }}
            >
              {messages.length === 0 ? (
                <div style={{ color: '#80827f', fontSize: '14px', lineHeight: 1.7 }}>
                  Send a message to test model response streaming live via SSE.
                </div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start', minWidth: 0 }}>
                    <div
                      style={{
                        maxWidth: '92%',
                        minWidth: 0,
                        background: m.role === 'user' ? '#2c2e2a' : '#ffffff',
                        color: m.role === 'user' ? '#f5f1e4' : '#2c2e2a',
                        border: m.role === 'assistant' ? '1px solid #e0dbce' : 'none',
                        borderRadius: '20px',
                        padding: '13px 18px',
                        fontSize: '14px',
                        lineHeight: 1.7,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {m.content}
                      {m.pending && !m.content && (
                        <span style={{ color: '#80827f', fontStyle: 'italic' }}>Connecting to GPU worker process…</span>
                      )}
                      {m.pending && (
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
                      {m.error && <div style={{ color: '#ff705d', fontSize: '13px', marginTop: '4px' }}>{m.error}</div>}
                    </div>

                    {m.role === 'assistant' && !m.pending && (m.latencyMs != null || m.tokenCount || m.cost != null) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '11px', color: '#80827f' }}>
                        {m.ttftMs != null && (
                          <span className="mono">TTFT {m.ttftMs}ms</span>
                        )}
                        {m.latencyMs != null && <span className="mono">Total {m.latencyMs}ms</span>}
                        {m.tokenCount ? <span className="mono">~{m.tokenCount} tok</span> : null}
                        {m.cost != null && <span className="mono">~{formatCost(m.cost)}</span>}
                        {m.stopped && <span>· stopped</span>}
                        <button
                          type="button"
                          onClick={() => handleCopy(m.id, m.content)}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#80827f', fontSize: '11px', padding: 0 }}
                        >
                          {copiedId === m.id ? <Check size={12} /> : <Copy size={12} />}
                          {copiedId === m.id ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {messages.length === 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {QUICK_PROMPTS.map((qp) => (
                  <button
                    key={qp.label}
                    type="button"
                    onClick={() => setDraft(qp.text)}
                    style={{ background: '#f5f1e4', border: 'none', borderRadius: '20px', padding: '5px 12px', fontSize: '11px', cursor: 'pointer', color: '#80827f' }}
                  >
                    {qp.label}
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <textarea
                ref={composerRef}
                rows={1}
                value={draft}
                onChange={handleComposerInput}
                onKeyDown={handleComposerKeyDown}
                placeholder="Message the model... (Enter to send, Shift+Enter for a new line)"
                style={{
                  flex: 1,
                  minWidth: 0,
                  background: '#f5f1e4',
                  border: '1px solid #e0dbce',
                  borderRadius: '18px',
                  padding: '13px 16px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  color: '#2c2e2a',
                  resize: 'none',
                  maxHeight: '200px',
                }}
              />
              {isStreaming ? (
                <button
                  type="button"
                  onClick={handleStop}
                  style={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '48px',
                    height: '48px',
                    background: '#ff705d',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                  }}
                  aria-label="Stop generating"
                >
                  <Square size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!draft.trim() || !model}
                  style={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '48px',
                    height: '48px',
                    background: '#8ed462',
                    color: '#2c2e2a',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: !draft.trim() || !model ? 'not-allowed' : 'pointer',
                    opacity: !draft.trim() || !model ? 0.5 : 1,
                  }}
                  aria-label="Send message"
                >
                  <Send size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlaygroundPage() {
  return (
    <Suspense fallback={<div style={{ background: '#f5f1e4', minHeight: '100vh' }}></div>}>
      <PlaygroundContent />
    </Suspense>
  );
}
