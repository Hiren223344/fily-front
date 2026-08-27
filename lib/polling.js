/**
 * polling.js — smart polling with document.hidden pause.
 * Dashboard stats and endpoint tables poll on an interval that pauses when document.hidden is true.
 * No websockets in v1.
 */

'use client';

import { useEffect, useRef } from 'react';

/**
 * Standalone Poller class for logic classes or direct use
 */
export class Poller {
  constructor(callback, intervalMs = 15000, options = {}) {
    this.callback = callback;
    this.intervalMs = intervalMs;
    this.pauseOnHidden = options.pauseOnHidden !== false;
    this.timerId = null;
    this.isRunning = false;
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
  }

  start(immediate = false) {
    if (this.isRunning) return;
    this.isRunning = true;

    if (typeof document !== 'undefined' && this.pauseOnHidden) {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }

    if (immediate && (!document.hidden || !this.pauseOnHidden)) {
      this.execute();
    }

    this.scheduleNext();
  }

  stop() {
    this.isRunning = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (typeof document !== 'undefined' && this.pauseOnHidden) {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  scheduleNext() {
    if (!this.isRunning) return;
    if (this.timerId) clearTimeout(this.timerId);

    this.timerId = setTimeout(async () => {
      if (this.isRunning && (!document.hidden || !this.pauseOnHidden)) {
        await this.execute();
      }
      this.scheduleNext();
    }, this.intervalMs);
  }

  async execute() {
    try {
      if (this.callback) {
        await this.callback();
      }
    } catch (e) {
      console.error('[polling] Error executing poller callback:', e);
    }
  }

  handleVisibilityChange() {
    if (typeof document === 'undefined') return;
    if (document.hidden) {
      // Document is now hidden: clear active timer to pause polling
      if (this.timerId) {
        clearTimeout(this.timerId);
        this.timerId = null;
      }
    } else {
      // Document became visible again: resume polling immediately!
      if (this.isRunning) {
        this.execute();
        this.scheduleNext();
      }
    }
  }
}

/**
 * React Hook for polling that pauses on document.hidden
 */
export function usePolling(callback, intervalMs = 15000, options = {}) {
  const { enabled = true, immediate = false, pauseOnHidden = true } = options;
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || intervalMs <= 0) return;

    const poller = new Poller(
      () => savedCallback.current && savedCallback.current(),
      intervalMs,
      { pauseOnHidden }
    );

    poller.start(immediate);

    return () => {
      poller.stop();
    };
  }, [enabled, intervalMs, immediate, pauseOnHidden]);
}

export default Poller;
