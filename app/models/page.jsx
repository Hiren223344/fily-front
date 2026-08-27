'use client';

import React from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { store, TTL } from '@/lib/store';
import { Nav } from '@/components/Nav';
import { ModelCardSkeleton } from '@/components/LoadingSkeleton';
import { ErrorRetry } from '@/components/ErrorRetry';
import { EmptyState } from '@/components/EmptyState';

const DEFAULT_MODELS = [
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
];

export default class ModelsPage extends React.Component {
  state = {
    filter: 'all',
    searchQuery: '',
    loading: true,
    error: null,
    modelsData: null,
  };

  componentDidMount() {
    this.fetchModels();
  }

  async fetchModels(forceRefresh = false) {
    this.setState({ loading: true, error: null });
    try {
      // 5 min cache TTL for models catalog
      const modelsKey = '/v1/models';
      const data = await store.get(modelsKey, () => api.get(modelsKey), TTL.MODELS, forceRefresh);
      this.setState({
        modelsData: Array.isArray(data) ? data : DEFAULT_MODELS,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('[Models] Fetch error:', err);
      this.setState({
        error: err.message || 'Failed to fetch model catalog',
        loading: false,
      });
    }
  }

  getDotColor(category) {
    switch (category?.toLowerCase()) {
      case 'text': return '#8ed462';
      case 'image': return '#2ba0ff';
      case 'audio': return '#ff705d';
      case 'embeddings': return '#f5e211';
      default: return '#8ed462';
    }
  }

  renderVals() {
    const filter = this.state.filter;
    const query = this.state.searchQuery.toLowerCase().trim();
    const sourceModels = Array.isArray(this.state.modelsData) && this.state.modelsData.length > 0
      ? this.state.modelsData
      : DEFAULT_MODELS;

    const filtered = sourceModels
      .filter((m) => {
        const cat = (m.category || '').toLowerCase();
        const matchesCategory = filter === 'all' || cat === filter;
        const matchesSearch = !query || m.name.toLowerCase().includes(query) || (m.provider || '').toLowerCase().includes(query);
        return matchesCategory && matchesSearch;
      })
      .map((m, i) => ({
        ...m,
        dotColor: m.dotColor || this.getDotColor(m.category),
        delay: `${i * 40}ms`,
      }));

    const activeBg = '#8ed462';
    const inactiveBg = '#ffffff';

    return {
      models: filtered,
      bgAll: filter === 'all' ? activeBg : inactiveBg,
      bgText: filter === 'text' ? activeBg : inactiveBg,
      bgImage: filter === 'image' ? activeBg : inactiveBg,
      bgAudio: filter === 'audio' ? activeBg : inactiveBg,
      bgEmbed: filter === 'embeddings' ? activeBg : inactiveBg,
      setFilterAll: () => this.setState({ filter: 'all' }),
      setFilterText: () => this.setState({ filter: 'text' }),
      setFilterImage: () => this.setState({ filter: 'image' }),
      setFilterAudio: () => this.setState({ filter: 'audio' }),
      setFilterEmbed: () => this.setState({ filter: 'embeddings' }),
    };
  }

  render() {
    const vals = this.renderVals();
    const { loading, error } = this.state;

    return (
      <div style={{ background: '#f5f1e4', color: '#2c2e2a', minHeight: '100vh', paddingBottom: '100px' }}>
        <Nav />

        {/* HEADER */}
        <div style={{ maxWidth: '1200px', margin: '64px auto 0', padding: '0 24px', textAlign: 'center' }}>
          <div
            style={{
              fontSize: '15px',
              color: '#80827f',
              marginBottom: '20px',
              opacity: 0,
              animation: 'fadeUp 0.5s cubic-bezier(0.4,0,0.2,1) 0s forwards',
            }}
          >
            MODEL CATALOG
          </div>
          <h1
            style={{
              fontSize: 'clamp(44px, 7vw, 81px)',
              fontWeight: 500,
              letterSpacing: '-3px',
              lineHeight: 1.1,
              margin: '0 0 20px',
              opacity: 0,
              animation: 'fadeUp 0.5s cubic-bezier(0.4,0,0.2,1) 0.08s forwards',
            }}
          >
            Every model. One endpoint.
          </h1>
          <p
            style={{
              fontSize: '20px',
              lineHeight: 1.5,
              color: '#2c2e2a',
              maxWidth: '640px',
              margin: '0 auto',
              opacity: 0,
              animation: 'fadeUp 0.5s cubic-bezier(0.4,0,0.2,1) 0.16s forwards',
            }}
          >
            Open-weight and fine-tuned models, all served through the same OpenAI-compatible API. Pay per token — no minimums.
          </p>
        </div>

        {/* FILTERS */}
        <div
          style={{
            maxWidth: '1200px',
            margin: '40px auto 0',
            padding: '0 24px',
            display: 'flex',
            gap: '10px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={vals.setFilterAll}
            style={{
              border: 'none',
              borderRadius: '50px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'inherit',
              cursor: 'pointer',
              background: vals.bgAll,
              color: '#2c2e2a',
              transition: 'background 200ms cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            All
          </button>
          <button
            type="button"
            onClick={vals.setFilterText}
            style={{
              border: 'none',
              borderRadius: '50px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'inherit',
              cursor: 'pointer',
              background: vals.bgText,
              color: '#2c2e2a',
              transition: 'background 200ms cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            Text
          </button>
          <button
            type="button"
            onClick={vals.setFilterImage}
            style={{
              border: 'none',
              borderRadius: '50px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'inherit',
              cursor: 'pointer',
              background: vals.bgImage,
              color: '#2c2e2a',
              transition: 'background 200ms cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            Image
          </button>
          <button
            type="button"
            onClick={vals.setFilterAudio}
            style={{
              border: 'none',
              borderRadius: '50px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'inherit',
              cursor: 'pointer',
              background: vals.bgAudio,
              color: '#2c2e2a',
              transition: 'background 200ms cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            Audio
          </button>
          <button
            type="button"
            onClick={vals.setFilterEmbed}
            style={{
              border: 'none',
              borderRadius: '50px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'inherit',
              cursor: 'pointer',
              background: vals.bgEmbed,
              color: '#2c2e2a',
              transition: 'background 200ms cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            Embeddings
          </button>
        </div>

        {/* ERROR STATE WITH RETRY */}
        {error && (
          <div style={{ maxWidth: '1200px', margin: '24px auto 0', padding: '0 24px' }}>
            <ErrorRetry error={error} onRetry={() => this.fetchModels(true)} message="Failed to load models catalog" />
          </div>
        )}

        {/* MODEL GRID */}
        <div
          style={{
            maxWidth: '1200px',
            margin: '32px auto 0',
            padding: '0 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          {loading && !this.state.modelsData ? (
            <>
              <ModelCardSkeleton />
              <ModelCardSkeleton />
              <ModelCardSkeleton />
              <ModelCardSkeleton />
              <ModelCardSkeleton />
              <ModelCardSkeleton />
            </>
          ) : vals.models.length === 0 ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <EmptyState
                title="No models found in this category"
                description="Try selecting a different filter above."
                actionLabel="Show all models"
                onAction={vals.setFilterAll}
              />
            </div>
          ) : (
            vals.models.map((m) => (
              <div
                key={m.id || m.name}
                className="card-hover"
                style={{
                  background: '#ffffff',
                  borderRadius: '50px',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  opacity: 0,
                  animation: 'fadeUp 0.4s cubic-bezier(0.4,0,0.2,1) forwards',
                  animationDelay: m.delay,
                  transition: 'transform 250ms cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: m.dotColor, display: 'inline-block' }}></span>
                  <div style={{ fontSize: '13px', color: '#80827f' }}>{m.category}</div>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 500 }}>{m.name}</div>
                <div style={{ fontSize: '14px', color: '#80827f' }} className="mono">
                  {m.provider}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    marginTop: '8px',
                    paddingTop: '14px',
                    borderTop: '1px solid #e0dbce',
                  }}
                >
                  <div style={{ fontSize: '16px', fontWeight: 500 }}>{m.price}</div>
                  <Link
                    href={`/playground?model=${encodeURIComponent(m.id || m.name)}`}
                    style={{ fontSize: '14px', fontWeight: 500, borderBottom: '1px solid #80827f', color: '#2c2e2a', textDecoration: 'none' }}
                  >
                    Test in console →
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }
}
