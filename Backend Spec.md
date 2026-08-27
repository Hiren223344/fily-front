# FilyBase Backend — Build Prompt

Paste this to a backend engineer or an AI coding agent (e.g. Claude Code) to scaffold the
service that the FilyBase frontend (Landing, Dashboard, Models, Endpoints, Billing, Sign
In/Up) already expects.

---

## Prompt

> Build a backend for **FilyBase**, a serverless inference API that runs open-weight
> models (Llama, Mixtral, Qwen, Stable Diffusion, Whisper, embeddings) on our own GPU
> server (not a third-party cloud). It needs to:
>
> 1. **Model serving** — run each model as a long-lived process on our GPU box (vLLM /
>    TGI / Triton for text models, a diffusers server for image, faster-whisper for
>    audio), fronted by one gateway API so callers never talk to the model servers
>    directly.
> 2. **Gateway API** — an OpenAI-compatible HTTP surface (see contract below) that
>    authenticates requests, routes to the right model process, meters usage, and
>    streams responses (SSE) when requested.
> 3. **Auth** — API keys (`sk-fb-...`), hashed at rest, scoped to a project/account,
>    checked via `Authorization: Bearer`.
> 4. **Metering & billing** — log every request's token/image/audio-minute count, price
>    it from a per-model rate table, roll it up into monthly usage + invoices.
> 5. **Endpoint management** — CRUD for named endpoints (name, model, status
>    live/paused), so the dashboard can list/toggle/create them.
> 6. **Accounts** — email/password (or OAuth) signup/login issuing a session or JWT.
>
> Suggested stack: FastAPI or Node/Express for the gateway, Postgres for
> accounts/keys/endpoints/usage/invoices, Redis for rate limiting and short-lived
> job state, a queue (Redis streams or simple in-process) in front of each model
> process so requests don't overload the GPU. Deploy the gateway + Postgres + Redis
> as containers on the same server that hosts the GPUs; put the gateway behind a
> reverse proxy (nginx/Caddy) with TLS.

---

## API contract (matches the frontend exactly)

### Auth
```
POST /v1/auth/signup   { name, email, password } -> { token, user }
POST /v1/auth/login    { email, password }        -> { token, user }
```

### Inference (OpenAI-compatible)
```
POST /v1/completions
Authorization: Bearer sk-fb-...
{ "model": "llama-3.1-70b", "prompt": "...", "stream": false }

-> 200 { "id": "cmpl-...", "model": "...", "latency_ms": 41,
         "choices": [...], "usage": { "total_tokens": 812 } }
```
Same shape for `/v1/images/generations` (Stable Diffusion), `/v1/audio/transcriptions`
(Whisper), `/v1/embeddings` (BGE/E5). `stream:true` returns `text/event-stream`.

### Models catalog
```
GET /v1/models -> [{ id, name, provider, category, price }]
```
Backs the Models page grid/filter.

### Endpoints (dashboard "Endpoints" page)
```
GET    /v1/endpoints                       -> [{ id, name, model, live, requests_24h, p50_latency_ms, created_at }]
POST   /v1/endpoints        { name, model } -> created endpoint
PATCH  /v1/endpoints/:id     { live }       -> toggled endpoint
```

### Usage / dashboard stats
```
GET /v1/usage?range=24h|7d|30d
-> { requests, tokens, spend, p50_latency_ms, chart: [ {t, tokens_per_hour} ] }
```

### Billing
```
GET /v1/billing/plan          -> { plan, usage_this_month, estimated_total }
GET /v1/billing/invoices      -> [{ id, date, amount, status }]
GET /v1/billing/cost-breakdown?period=2026-08 -> [{ model, usage, rate, cost }]
```

---

## Wiring the frontend to it

The pages currently render mock data from each `Component`'s `renderVals()`. To connect:

1. Add a small `api.js` helper (fetch wrapper) with the real base URL, e.g.
   `const API_BASE = "https://api.filybase.ai"` (point this at your server's public IP
   or domain once you have TLS in front of it).
2. In each DC's logic class, replace the hardcoded arrays/objects with a
   `componentDidMount() { fetch(...).then(...).then(data => this.setState({...})) }`
   call to the matching endpoint above, storing the result in `state` and reading it
   in `renderVals()` — the template holes don't change.
3. Store the API key/session token from Sign In/Sign Up (e.g. in `localStorage`) and
   send it as `Authorization: Bearer <token>` on every call.
4. CORS: since the frontend and backend are different origins, the gateway must send
   `Access-Control-Allow-Origin` for your frontend's domain (or `*` while prototyping).

Once that's live, the Dashboard/Endpoints/Billing pages will show real data instead of
the sample numbers currently baked into their logic classes — no template changes
needed.
