/**
 * db.js — In-memory store for Next.js mock API routes
 * Provides realistic initial seed data and full CRUD capability.
 */

// Shared global state for Next.js hot-reloads
const globalStore = globalThis.__filybase_db || {
  users: [
    { id: 'usr_1', email: 'jordan@filybase.ai', name: 'Jordan Diaz', plan: 'Pay as you go' },
  ],
  endpoints: [
    { id: 'ep_1', name: 'chat-prod', model: 'llama-3.1-70b', requests: '48.2K', requests_24h: 48200, latency: '41ms', p50_latency_ms: 41, created: 'Jun 12, 2026', created_at: '2026-06-12T10:00:00Z', live: true },
    { id: 'ep_2', name: 'embeddings', model: 'bge-large', requests: '12.9K', requests_24h: 12900, latency: '9ms', p50_latency_ms: 9, created: 'Jun 12, 2026', created_at: '2026-06-12T11:00:00Z', live: true },
    { id: 'ep_3', name: 'sd-image-gen', model: 'stable-diffusion-3', requests: '2.1K', requests_24h: 2100, latency: '640ms', p50_latency_ms: 640, created: 'Jul 2, 2026', created_at: '2026-07-02T14:30:00Z', live: false },
    { id: 'ep_4', name: 'ft-support-bot', model: 'custom fine-tune', requests: '6.4K', requests_24h: 6400, latency: '52ms', p50_latency_ms: 52, created: 'Jul 18, 2026', created_at: '2026-07-18T09:15:00Z', live: true },
    { id: 'ep_5', name: 'summarizer', model: 'qwen-2.5-32b', requests: '980', requests_24h: 980, latency: '38ms', p50_latency_ms: 38, created: 'Aug 3, 2026', created_at: '2026-08-03T16:45:00Z', live: true },
    { id: 'ep_6', name: 'moderation-check', model: 'llama-3.1-8b', requests: '31.5K', requests_24h: 31500, latency: '18ms', p50_latency_ms: 18, created: 'Aug 9, 2026', created_at: '2026-08-09T08:20:00Z', live: false },
  ],
  models: [
    { id: 'llama-3.1-70b', name: 'Llama 3.1 70B', provider: 'Meta', category: 'Text', price: '$0.90 / 1M tok', dotColor: '#8ed462' },
    { id: 'llama-3.1-8b', name: 'Llama 3.1 8B', provider: 'Meta', category: 'Text', price: '$0.15 / 1M tok', dotColor: '#8ed462' },
    { id: 'mixtral-8x22b', name: 'Mixtral 8x22B', provider: 'Mistral', category: 'Text', price: '$1.20 / 1M tok', dotColor: '#8ed462' },
    { id: 'qwen-2.5-32b', name: 'Qwen 2.5 32B', provider: 'Alibaba', category: 'Text', price: '$0.70 / 1M tok', dotColor: '#8ed462' },
    { id: 'deepseek-v3', name: 'DeepSeek V3', provider: 'DeepSeek', category: 'Text', price: '$0.55 / 1M tok', dotColor: '#8ed462' },
    { id: 'custom-fine-tune', name: 'Your fine-tune', provider: 'Custom', category: 'Text', price: 'from $1.00 / 1M tok', dotColor: '#8ed462' },
    { id: 'stable-diffusion-3', name: 'Stable Diffusion 3', provider: 'Stability', category: 'Image', price: '$0.02 / image', dotColor: '#2ba0ff' },
    { id: 'flux-dev', name: 'Flux Dev', provider: 'Black Forest Labs', category: 'Image', price: '$0.025 / image', dotColor: '#2ba0ff' },
    { id: 'whisper-large-v3', name: 'Whisper Large v3', provider: 'OpenAI', category: 'Audio', price: '$0.006 / min', dotColor: '#ff705d' },
    { id: 'bge-large', name: 'BGE Large', provider: 'BAAI', category: 'Embeddings', price: '$0.01 / 1M tok', dotColor: '#f5e211' },
    { id: 'e5-mistral', name: 'E5 Mistral', provider: 'Microsoft', category: 'Embeddings', price: '$0.012 / 1M tok', dotColor: '#f5e211' },
  ],
  apiKeys: [
    { id: 'key_1', name: 'Production API Key', key: 'sk-fb-live-89f41a029c7e44a193fd', maskedKey: 'sk-fb-••••93fd', created_at: '2026-06-12', last_used: 'Just now' },
    { id: 'key_2', name: 'Staging / Dev', key: 'sk-fb-test-45a2b13c88e990c7d21a', maskedKey: 'sk-fb-••••d21a', created_at: '2026-07-20', last_used: '2 hours ago' },
  ],
  invoices: [
    { id: 'INV-0912', date: 'Aug 1, 2026', amount: '$8,240.40', status: 'Paid', statusColor: '#8ed462' },
    { id: 'INV-0871', date: 'Jul 1, 2026', amount: '$6,110.20', status: 'Paid', statusColor: '#8ed462' },
    { id: 'INV-0834', date: 'Jun 1, 2026', amount: '$5,982.75', status: 'Paid', statusColor: '#8ed462' },
    { id: 'INV-0799', date: 'May 1, 2026', amount: '$4,420.05', status: 'Unpaid', statusColor: '#ff705d' },
  ],
  costBreakdown: [
    { model: 'Llama 3.1 70B', usage: '6.1B tok', rate: '$0.90/M', cost: '$5,490.00' },
    { model: 'Mixtral 8x22B', usage: '2.2B tok', rate: '$1.20/M', cost: '$2,640.00' },
    { model: 'Stable Diffusion 3', usage: '4,120 img', rate: '$0.02/img', cost: '$82.40' },
    { model: 'BGE Embeddings', usage: '2.8B tok', rate: '$0.01/M', cost: '$28.00' },
  ],
  usageStats: {
    '24h': {
      requests: '48.2K',
      tokens: '312M',
      spend: '$284',
      latency: '41ms',
      p50_latency_ms: 41,
      chart: [22, 28, 19, 34, 41, 38, 52, 61, 58, 70, 65, 74, 80, 76, 68, 72, 85, 90, 82, 77, 64, 55, 48, 40],
    },
    '7d': {
      requests: '338K',
      tokens: '2.1B',
      spend: '$1,960',
      latency: '44ms',
      p50_latency_ms: 44,
      chart: [45, 52, 60, 58, 70, 66, 74],
    },
    '30d': {
      requests: '1.42M',
      tokens: '9.4B',
      spend: '$8,240',
      latency: '46ms',
      p50_latency_ms: 46,
      chart: [40, 44, 48, 46, 52, 55, 58, 54, 60, 63, 61, 66, 70, 68, 72, 75, 71, 69, 74, 78, 80, 76, 73, 77, 82, 85, 81, 79, 84, 88],
    },
  },
};

globalThis.__filybase_db = globalStore;

export const db = globalStore;
export default db;
