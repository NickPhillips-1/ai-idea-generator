import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {
  private readonly params = inject(ActivatedRoute).snapshot.queryParamMap;
  protected readonly denied = this.params.get('denied') === '1';
  protected readonly googleFailed = this.params.get('error') === 'google';
  protected readonly signingIn = signal(false);

  protected continueWithGoogle(event: MouseEvent): void {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    this.signingIn.set(true);
  }
}
