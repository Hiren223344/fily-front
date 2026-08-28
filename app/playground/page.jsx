'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Send,
  Square,
  RotateCcw,
  Copy,
  Check,
  Trash2,
  Code2,
  ChevronDown,
  ChevronUp,
  Brain,
  Sun,
  Moon,
  AlertTriangle,
} from 'lucide-react';
import { Nav } from '@/components/Nav';
import { streamChatCompletions } from '@/lib/stream';
import { api } from '@/lib/api';

const THEME_STORAGE_KEY = 'fb-playground-theme';

const PALETTES = {
  light: {
    pageBg: '#f5f1e4',
    panelBg: '#ffffff',
    panelBorder: 'transparent',
    inputBg: '#f5f1e4',
    inputBorder: '#e0dbce',
    text: '#2c2e2a',
    textMuted: '#80827f',
    transcriptBg: '#f5f1e4',
    assistantBubbleBg: '#ffffff',
    assistantBubbleBorder: '#e0dbce',
    chipBg: '#f5f1e4',
    chipText: '#80827f',
    errorBg: '#fff1ef',
    errorBorder: '#ffd6cf',
  },
  dark: {
    pageBg: '#15161b',
    panelBg: '#1d1f26',
    panelBorder: '#2c2f38',
    inputBg: '#24262e',
    inputBorder: '#343740',
    text: '#f2f2f0',
    textMuted: '#8b8f9c',
    transcriptBg: '#17181d',
    assistantBubbleBg: '#20222a',
    assistantBubbleBorder: '#343740',
    chipBg: '#24262e',
    chipText: '#9599a6',
    errorBg: '#301b19',
    errorBorder: '#4a2622',
  },
};

const ACCENT = { green: '#8ed462', blue: '#2ba0ff', red: '#ff705d', yellow: '#f5e211' };

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
  return (promptTokens * inRate + completionTokens * (outRate || inRate)) / 1e6;
}

function formatCost(v) {
  if (v == null) return null;
  if (v === 0) return '$0.00';
  if (v < 0.0001) return '<$0.0001';
  return v < 0.01 ? `$${v.toFixed(4)}` : `$${v.toFixed(2)}`;
}

function approxTokens(text) {
  return Math.max(1, Math.floor((text || '').length / 4));
}

function buildRequestMessages(systemPrompt, chatMessages) {
  const base = systemPrompt.trim() ? [{ role: 'system', content: systemPrompt.trim() }] : [];
  return [...base, ...chatMessages.map((m) => ({ role: m.role, content: m.content }))];
}

// Normalizes whatever an ApiError (lib/api.js) or the enriched stream.js
// Error carries into one shape the error card can render. Never includes
// secrets — only status/code/request id/message, all non-sensitive.
function describeError(err) {
  return {
    message: err?.message || 'Something went wrong',
    status: err?.status ?? null,
    code: err?.code ?? null,
    requestId: err?.requestId || err?.details?.request_id || err?.details?.error?.request_id || null,
  };
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

function TypingDots({ color }) {
  return (
    <div style={{ display: 'flex', gap: '4px', padding: '4px 0' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: color,
            display: 'inline-block',
            animation: 'pulse 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

function PlaygroundContent() {
  const searchParams = useSearchParams();
  const initialModel = searchParams?.get('model') || '';

  const [theme, setTheme] = useState('light');
  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') {
        setTheme(saved);
        return;
      }
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
      }
    } catch (_) {
      /* localStorage/matchMedia unavailable — stay on default light theme */
    }
  }, []);
  function toggleTheme() {
    setTheme((t) => {
      const next = t === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch (_) {}
      return next;
    });
  }
  const c = PALETTES[theme];

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
  const [copiedId, setCopiedId] = useState(null);
  const [showCode, setShowCode] = useState(false);
  const [codeTab, setCodeTab] = useState('curl');
  const [brainOpen, setBrainOpen] = useState(false);

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

  // Escape stops an in-flight generation, or closes the code panel.
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key !== 'Escape') return;
      if (isStreaming) {
        handleStop();
      } else if (showCode) {
        setShowCode(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming, showCode]);

  function updateMessage(id, updater) {
    setMessages((prev) => prev.map((m) => (m.id === id ? updater(m) : m)));
  }

  function runTurn(requestMessages, assistantId, promptTokensApprox) {
    setIsStreaming(true);

    const startTime = performance.now();
    startTimeRef.current = startTime;
    let firstTokenReceived = false;
    const modelObj = models.find((m) => m.id === model);
    const activeModel = model;

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
          const elapsed = Math.round(performance.now() - startTimeRef.current);
          updateMessage(assistantId, (m) => ({
            ...m,
            pending: false,
            error: { ...describeError(err), elapsedMs: elapsed, model: activeModel, partialTokens: approxTokens(m.content) },
          }));
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
          const completionTokens = approxTokens(content);
          const cost = computeCost(modelObj, promptTokensApprox, completionTokens);
          updateMessage(assistantId, (m) => ({
            ...m,
            content,
            pending: false,
            latencyMs: totalDuration,
            ttftMs: ttft,
            tokenCount: completionTokens,
            cost,
          }));
        })
        .catch((err) => {
          const elapsed = Math.round(performance.now() - startTime);
          updateMessage(assistantId, (m) => ({
            ...m,
            pending: false,
            error: { ...describeError(err), elapsedMs: elapsed, model: activeModel, partialTokens: 0 },
          }));
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

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
  const hasCompletedTurn = Boolean([...messages].reverse().find((m) => m.role === 'assistant' && !m.pending));
  const activeTurn = messages[messages.length - 1];
  const isAwaitingFirstToken = isStreaming && activeTurn?.pending && !activeTurn?.content;

  let brainStatus = 'Idle — send a message to begin.';
  if (isStreaming) {
    brainStatus = isAwaitingFirstToken ? 'Connecting to GPU worker…' : 'Streaming tokens…';
  } else if (lastAssistant?.error) {
    brainStatus = 'Last request failed.';
  } else if (lastAssistant && lastAssistant.latencyMs != null) {
    brainStatus = `Done in ${lastAssistant.latencyMs}ms.`;
  }

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
    <div style={{ background: '#f5f1e4', minHeight: '100vh' }}>
      <Nav variant="marketing" />

      <div
        style={{
          background: c.pageBg,
          color: c.text,
          minHeight: 'calc(100vh - 100px)',
          paddingBottom: '80px',
          transition: 'background 200ms ease, color 200ms ease',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
            <div>
              <div style={{ fontSize: '15px', color: c.textMuted, marginBottom: '8px' }}>TEST CONSOLE</div>
              <h1 style={{ fontSize: 'clamp(34px, 9vw, 53px)', fontWeight: 500, letterSpacing: '-2.12px', lineHeight: 1.1, margin: 0 }}>
                Playground
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', color: c.textMuted }}>
                Endpoint: <span className="mono" style={{ color: c.text }}>POST /v1/chat/completions</span>
              </span>
              <button
                type="button"
                className="pg-btn"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                aria-pressed={theme === 'dark'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: `1px solid ${c.inputBorder}`,
                  background: c.panelBg,
                  color: c.text,
                  cursor: 'pointer',
                }}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(360px, 100%), 1fr))', gap: '20px', alignItems: 'start' }}>
            {/* SETTINGS SIDEBAR */}
            <div
              style={{
                background: c.panelBg,
                border: `1px solid ${c.panelBorder}`,
                borderRadius: '40px',
                padding: '32px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                minWidth: 0,
                transition: 'background 200ms ease, border-color 200ms ease',
              }}
            >
              <div>
                <label htmlFor="pg-model" style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                  Model
                </label>
                <select
                  id="pg-model"
                  value={model}
                  disabled={isStreaming}
                  onChange={(e) => setModel(e.target.value)}
                  style={{
                    width: '100%',
                    background: c.inputBg,
                    border: `1px solid ${c.inputBorder}`,
                    borderRadius: '12px',
                    padding: '12px 16px',
                    fontSize: '15px',
                    fontFamily: 'inherit',
                    color: c.text,
                    cursor: isStreaming ? 'not-allowed' : 'pointer',
                    opacity: isStreaming ? 0.6 : 1,
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
                    <div style={{ fontSize: '12px', color: c.textMuted, marginTop: '6px' }} className="mono">
                      {priceLabel}
                    </div>
                  ) : null;
                })()}
              </div>

              <div>
                <label htmlFor="pg-system-prompt" style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                  System Prompt
                </label>
                <textarea
                  id="pg-system-prompt"
                  rows={2}
                  value={systemPrompt}
                  disabled={isStreaming}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Optional instructions for the model..."
                  style={{
                    width: '100%',
                    background: c.inputBg,
                    border: `1px solid ${c.inputBorder}`,
                    borderRadius: '12px',
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    color: c.text,
                    resize: 'vertical',
                    opacity: isStreaming ? 0.6 : 1,
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingTop: '8px', borderTop: `1px solid ${c.inputBorder}` }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px', color: c.text }}>
                    <span>Temperature</span>
                    <span className="mono">{temperature}</span>
                  </div>
                  <input
                    type="range"
                    aria-label="Temperature"
                    min="0"
                    max="1"
                    step="0.05"
                    value={temperature}
                    disabled={isStreaming}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: ACCENT.green }}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px', color: c.text }}>
                    <span>Max Tokens</span>
                    <span className="mono">{maxTokens}</span>
                  </div>
                  <input
                    type="range"
                    aria-label="Max tokens"
                    min="64"
                    max="4096"
                    step="64"
                    value={maxTokens}
                    disabled={isStreaming}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
                    style={{ width: '100%', accentColor: ACCENT.green }}
                  />
                </div>
              </div>

              <div>
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Inference Mode</div>
                <div
                  role="group"
                  aria-label="Inference mode"
                  style={{
                    position: 'relative',
                    display: 'flex',
                    background: c.inputBg,
                    border: `1px solid ${c.inputBorder}`,
                    borderRadius: '50px',
                    padding: '4px',
                  }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      top: '4px',
                      bottom: '4px',
                      left: stream ? '4px' : '50%',
                      width: 'calc(50% - 4px)',
                      background: ACCENT.green,
                      borderRadius: '50px',
                      transition: 'left 220ms cubic-bezier(0.4,0,0.2,1)',
                    }}
                  />
                  <button
                    type="button"
                    disabled={isStreaming}
                    onClick={() => setStream(true)}
                    aria-pressed={stream}
                    style={{
                      position: 'relative',
                      flex: 1,
                      border: 'none',
                      background: 'none',
                      borderRadius: '50px',
                      padding: '9px',
                      fontSize: '13px',
                      fontWeight: 500,
                      fontFamily: 'inherit',
                      cursor: isStreaming ? 'not-allowed' : 'pointer',
                      color: stream ? '#2c2e2a' : c.textMuted,
                      zIndex: 1,
                    }}
                  >
                    Streaming
                  </button>
                  <button
                    type="button"
                    disabled={isStreaming}
                    onClick={() => setStream(false)}
                    aria-pressed={!stream}
                    style={{
                      position: 'relative',
                      flex: 1,
                      border: 'none',
                      background: 'none',
                      borderRadius: '50px',
                      padding: '9px',
                      fontSize: '13px',
                      fontWeight: 500,
                      fontFamily: 'inherit',
                      cursor: isStreaming ? 'not-allowed' : 'pointer',
                      color: !stream ? '#2c2e2a' : c.textMuted,
                      zIndex: 1,
                    }}
                  >
                    Standard
                  </button>
                </div>
                <div style={{ fontSize: '11px', color: c.textMuted, marginTop: '6px' }}>
                  {stream ? 'ReadableStream reader + rAF batched flush' : 'Single JSON response, no token streaming'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', paddingTop: '8px', borderTop: `1px solid ${c.inputBorder}` }}>
                <button
                  type="button"
                  className="pg-btn"
                  onClick={handleNewChat}
                  disabled={messages.length === 0}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: c.chipBg,
                    border: 'none',
                    borderRadius: '50px',
                    padding: '12px',
                    fontSize: '13px',
                    fontWeight: 500,
                    fontFamily: 'inherit',
                    color: c.text,
                    cursor: messages.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: messages.length === 0 ? 0.5 : 1,
                  }}
                >
                  <Trash2 size={14} /> New chat
                </button>
                <button
                  type="button"
                  className="pg-btn"
                  onClick={() => setShowCode((v) => !v)}
                  aria-expanded={showCode}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: showCode ? '#2c2e2a' : c.chipBg,
                    color: showCode ? '#f5f1e4' : c.text,
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
                        className="pg-btn"
                        onClick={() => setCodeTab(tab.key)}
                        aria-pressed={codeTab === tab.key}
                        style={{
                          background: codeTab === tab.key ? ACCENT.green : c.chipBg,
                          border: 'none',
                          borderRadius: '20px',
                          padding: '6px 14px',
                          fontSize: '12px',
                          fontWeight: 500,
                          fontFamily: 'inherit',
                          cursor: 'pointer',
                          color: codeTab === tab.key ? '#2c2e2a' : c.chipText,
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="pg-btn"
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
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                        color: c.textMuted,
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
                      background: c.inputBg,
                      border: `1px solid ${c.inputBorder}`,
                      borderRadius: '16px',
                      padding: '16px',
                      fontSize: '12px',
                      lineHeight: 1.6,
                      color: c.text,
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
            <div
              style={{
                background: c.panelBg,
                border: `1px solid ${c.panelBorder}`,
                borderRadius: '40px',
                padding: '32px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                minHeight: '480px',
                minWidth: 0,
                transition: 'background 200ms ease, border-color 200ms ease',
              }}
            >
              {/* NEURAL BRAIN STATUS WIDGET */}
              <div
                style={{
                  background: c.chipBg,
                  borderRadius: brainOpen ? '20px' : '50px',
                  padding: '10px 16px',
                  transition: 'border-radius 180ms ease',
                }}
              >
                <button
                  type="button"
                  onClick={() => setBrainOpen((v) => !v)}
                  aria-expanded={brainOpen}
                  aria-label="Toggle model status details"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    color: c.text,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <Brain
                      size={15}
                      color={isStreaming ? ACCENT.blue : ACCENT.green}
                      style={isStreaming ? { animation: 'pulse 1.4s ease-in-out infinite' } : undefined}
                    />
                    <span style={{ fontSize: '13px', fontWeight: 500, flexShrink: 0 }}>Neural Brain</span>
                    <span
                      className="mono"
                      style={{
                        fontSize: '12px',
                        color: c.textMuted,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {brainStatus}
                    </span>
                  </span>
                  {brainOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {brainOpen && (
                  <div
                    style={{
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: `1px solid ${c.inputBorder}`,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(min(120px, 100%), 1fr))',
                      gap: '10px',
                      fontSize: '12px',
                    }}
                  >
                    <div>
                      <div style={{ color: c.textMuted, marginBottom: '2px' }}>Model</div>
                      <div className="mono">{model || '—'}</div>
                    </div>
                    <div>
                      <div style={{ color: c.textMuted, marginBottom: '2px' }}>Mode</div>
                      <div className="mono">{stream ? 'streaming' : 'standard'}</div>
                    </div>
                    <div>
                      <div style={{ color: c.textMuted, marginBottom: '2px' }}>Last TTFT</div>
                      <div className="mono">{lastAssistant?.ttftMs != null ? `${lastAssistant.ttftMs}ms` : '—'}</div>
                    </div>
                    <div>
                      <div style={{ color: c.textMuted, marginBottom: '2px' }}>Last latency</div>
                      <div className="mono">{lastAssistant?.latencyMs != null ? `${lastAssistant.latencyMs}ms` : '—'}</div>
                    </div>
                    <div>
                      <div style={{ color: c.textMuted, marginBottom: '2px' }}>Last tokens</div>
                      <div className="mono">{lastAssistant?.tokenCount ? `~${lastAssistant.tokenCount}` : '—'}</div>
                    </div>
                    <div>
                      <div style={{ color: c.textMuted, marginBottom: '2px' }}>Last cost</div>
                      <div className="mono">{lastAssistant?.cost != null ? `~${formatCost(lastAssistant.cost)}` : '—'}</div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: isStreaming ? ACCENT.blue : messages.length > 0 ? ACCENT.green : c.textMuted,
                      display: 'inline-block',
                    }}
                  ></span>
                  <span style={{ fontSize: '15px', fontWeight: 500 }}>
                    {isStreaming ? 'Streaming…' : messages.length > 0 ? 'Conversation' : 'Output Stream'}
                  </span>
                </div>
                {hasCompletedTurn && !isStreaming && (
                  <button
                    type="button"
                    className="pg-btn"
                    onClick={handleRegenerate}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: c.chipBg,
                      border: 'none',
                      borderRadius: '20px',
                      padding: '6px 14px',
                      fontSize: '12px',
                      fontWeight: 500,
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                      color: c.text,
                    }}
                  >
                    <RotateCcw size={13} /> Regenerate
                  </button>
                )}
              </div>

              <div
                ref={transcriptRef}
                style={{
                  position: 'relative',
                  flex: 1,
                  background: c.transcriptBg,
                  borderRadius: '24px',
                  padding: '20px',
                  minHeight: '300px',
                  maxHeight: '520px',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  minWidth: 0,
                  transition: 'background 200ms ease',
                }}
              >
                {isAwaitingFirstToken && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', overflow: 'hidden' }}>
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        width: '35%',
                        background: `linear-gradient(90deg, transparent, ${ACCENT.blue}, transparent)`,
                        animation: 'pgShimmer 1.3s ease-in-out infinite',
                      }}
                    />
                  </div>
                )}

                {messages.length === 0 ? (
                  <div style={{ color: c.textMuted, fontSize: '14px', lineHeight: 1.7 }}>
                    Send a message to test model response streaming live via SSE.
                  </div>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start', minWidth: 0 }}>
                      {m.error ? (
                        <div
                          style={{
                            maxWidth: '92%',
                            minWidth: 0,
                            background: c.errorBg,
                            border: `1px solid ${c.errorBorder}`,
                            borderRadius: '20px',
                            padding: '16px 18px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: ACCENT.red, fontWeight: 500, fontSize: '14px' }}>
                            <AlertTriangle size={16} /> Request failed
                          </div>
                          <div style={{ fontSize: '13px', color: c.text, lineHeight: 1.5 }}>{m.error.message}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '11px', color: c.textMuted }} className="mono">
                            {m.error.model && <span>model: {m.error.model}</span>}
                            {m.error.status != null && <span>status: {m.error.status}</span>}
                            {m.error.code && <span>code: {m.error.code}</span>}
                            {m.error.requestId && <span>req: {m.error.requestId}</span>}
                            {m.error.elapsedMs != null && <span>elapsed: {m.error.elapsedMs}ms</span>}
                            {m.error.partialTokens ? <span>~{m.error.partialTokens} tok received</span> : null}
                          </div>
                          <button
                            type="button"
                            className="pg-btn"
                            onClick={handleRegenerate}
                            style={{
                              alignSelf: 'flex-start',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: ACCENT.red,
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '50px',
                              padding: '8px 16px',
                              fontSize: '12px',
                              fontWeight: 500,
                              fontFamily: 'inherit',
                              cursor: 'pointer',
                            }}
                          >
                            <RotateCcw size={13} /> Try again
                          </button>
                        </div>
                      ) : (
                        <div
                          style={{
                            maxWidth: '92%',
                            minWidth: 0,
                            background: m.role === 'user' ? '#2c2e2a' : c.assistantBubbleBg,
                            color: m.role === 'user' ? '#f5f1e4' : c.text,
                            border: m.role === 'assistant' ? `1px solid ${c.assistantBubbleBorder}` : 'none',
                            borderRadius: '20px',
                            padding: '13px 18px',
                            fontSize: '14px',
                            lineHeight: 1.7,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            transition: 'background 200ms ease, border-color 200ms ease',
                          }}
                        >
                          {m.pending && !m.content ? (
                            <TypingDots color={c.textMuted} />
                          ) : (
                            <>
                              {m.content}
                              {m.pending && (
                                <span
                                  style={{
                                    display: 'inline-block',
                                    width: '8px',
                                    height: '14px',
                                    background: c.text,
                                    marginLeft: '3px',
                                    verticalAlign: 'middle',
                                    animation: 'pulse 1s infinite',
                                  }}
                                ></span>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {m.role === 'assistant' && !m.pending && !m.error && (m.latencyMs != null || m.tokenCount || m.cost != null) && (
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '6px', fontSize: '11px', color: c.textMuted }}>
                          {m.ttftMs != null && <span className="mono">TTFT {m.ttftMs}ms</span>}
                          {m.latencyMs != null && <span className="mono">Total {m.latencyMs}ms</span>}
                          {m.tokenCount ? <span className="mono">~{m.tokenCount} tok</span> : null}
                          {m.cost != null && <span className="mono">~{formatCost(m.cost)}</span>}
                          {m.stopped && <span>· stopped</span>}
                          <button
                            type="button"
                            onClick={() => handleCopy(m.id, m.content)}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, fontSize: '11px', padding: 0, fontFamily: 'inherit' }}
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
                      className="pg-btn"
                      onClick={() => setDraft(qp.text)}
                      style={{ background: c.chipBg, border: 'none', borderRadius: '20px', padding: '5px 12px', fontSize: '11px', fontFamily: 'inherit', cursor: 'pointer', color: c.chipText }}
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
                  aria-label="Message the model"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    background: c.inputBg,
                    border: `1px solid ${c.inputBorder}`,
                    borderRadius: '18px',
                    padding: '13px 16px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    color: c.text,
                    resize: 'none',
                    maxHeight: '200px',
                  }}
                />
                {isStreaming ? (
                  <button
                    type="button"
                    className="pg-btn"
                    onClick={handleStop}
                    style={{
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '48px',
                      height: '48px',
                      background: ACCENT.red,
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
                    className="pg-btn"
                    onClick={handleSend}
                    disabled={!draft.trim() || !model}
                    style={{
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '48px',
                      height: '48px',
                      background: ACCENT.green,
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
