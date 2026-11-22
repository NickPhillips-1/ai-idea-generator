import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionApi } from '../../core/api/session-api.service';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {
  private readonly sessions = inject(SessionApi);
  private readonly router = inject(Router);
  private readonly params = inject(ActivatedRoute).snapshot.queryParamMap;

  protected readonly denied = this.params.get('denied') === '1';
  protected readonly username = signal('');
  protected readonly password = signal('');
  protected readonly failed = signal(false);
  protected readonly signingIn = signal(false);

  protected valueOf(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected signIn(event: Event): void {
    event.preventDefault();
    if (this.signingIn()) {
      return;
    }
    this.failed.set(false);
    this.signingIn.set(true);
    this.sessions.login(this.username().trim(), this.password()).subscribe({
      next: () => void this.router.navigateByUrl('/dashboard'),
      error: () => {
        this.signingIn.set(false);
        this.failed.set(true);
      },
    });
  }
}
