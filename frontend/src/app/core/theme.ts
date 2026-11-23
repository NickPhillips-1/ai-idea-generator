import { Injectable, signal } from '@angular/core';

export type ColorMode = 'light' | 'dark';

const storageKey = 'founders-theme';

@Injectable({ providedIn: 'root' })
export class Theme {
  readonly mode = signal<ColorMode>(readMode());

  constructor() {
    applyMode(this.mode());
  }

  toggle(): void {
    const next: ColorMode = this.mode() === 'dark' ? 'light' : 'dark';
    this.mode.set(next);
    applyMode(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // Storage is unavailable in some private browsing modes.
    }
  }
}

function readMode(): ColorMode {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // Fall through to the system preference.
  }
  if (typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function applyMode(mode: ColorMode): void {
  document.documentElement.dataset['theme'] = mode;
}
