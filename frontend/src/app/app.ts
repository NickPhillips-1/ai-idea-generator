import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { SessionApi } from './core/api/session-api.service';

function isLoginPath(url: string): boolean {
  const path = url.split('?')[0].split('#')[0];
  return path === '/login' || path.startsWith('/login/');
}

function isDashboardPath(url: string): boolean {
  const path = url.split('?')[0].split('#')[0];
  return path === '/' || path === '' || path === '/dashboard';
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css',
  host: {
    '[class.stage]': 'stage()',
  },
})
export class App implements OnInit {
  private readonly router = inject(Router);
  private readonly sessions = inject(SessionApi);

  protected readonly account = this.sessions.account;
  protected readonly sessionReady = signal(false);
  protected readonly pictureFailed = signal(false);
  protected readonly menuOpen = signal(false);
  protected readonly loggingOut = signal(false);

  protected readonly workspace = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => !isLoginPath(this.router.url)),
    ),
    { initialValue: !isLoginPath(globalThis.location.pathname) },
  );

  protected readonly stage = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => isDashboardPath(this.router.url)),
    ),
    { initialValue: isDashboardPath(globalThis.location.pathname) },
  );

  ngOnInit(): void {
    this.followVisibleHeight();
    this.sessions.current().subscribe({
      next: () => this.sessionReady.set(true),
      error: () => this.sessionReady.set(true),
    });
  }

  private followVisibleHeight(): void {
    const viewport = window.visualViewport;
    if (!viewport) {
      return;
    }
    const apply = () => {
      if (viewport.height > 0) {
        document.documentElement.style.setProperty('--app-height', `${viewport.height}px`);
      }
    };
    apply();
    viewport.addEventListener('resize', apply);
    viewport.addEventListener('scroll', apply);
  }

  protected initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return '';
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 1).toUpperCase();
    }
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  protected toggleMenu(event: Event): void {
    event.stopPropagation();
    if (this.loggingOut()) {
      return;
    }
    this.menuOpen.update((open) => !open);
  }

  protected logout(event: Event): void {
    event.stopPropagation();
    if (this.loggingOut()) {
      return;
    }
    this.loggingOut.set(true);
    this.sessions.logout().subscribe({
      next: () => {
        this.menuOpen.set(false);
        void this.router.navigateByUrl('/login');
      },
      error: () => this.loggingOut.set(false),
    });
  }

  @HostListener('document:click')
  protected closeMenu(): void {
    if (!this.loggingOut()) {
      this.menuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected closeMenuOnEscape(): void {
    if (!this.loggingOut()) {
      this.menuOpen.set(false);
    }
  }
}
