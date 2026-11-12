import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { SessionApi, SessionView } from './core/api/session-api.service';

function isLoginPath(url: string): boolean {
  const path = url.split('?')[0].split('#')[0];
  return path === '/login' || path.startsWith('/login/');
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly router = inject(Router);
  private readonly sessions = inject(SessionApi);

  protected readonly account = signal<SessionView | null>(null);
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

  ngOnInit(): void {
    this.sessions.current().subscribe({
      next: (value) => {
        this.account.set(value);
        this.sessionReady.set(true);
      },
      error: () => {
        this.account.set(null);
        this.sessionReady.set(true);
      },
    });
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
        this.account.set(null);
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
