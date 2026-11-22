import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { SessionApi } from '../../core/api/session-api.service';
import { LoginPage } from './login-page';

@Component({ selector: 'app-blank', template: '' })
class BlankPage {}

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;
  let result: Subject<void>;
  let submitted: { username: string; password: string } | null;

  beforeEach(async () => {
    result = new Subject<void>();
    submitted = null;
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([{ path: 'dashboard', component: BlankPage }]),
        {
          provide: SessionApi,
          useValue: {
            login: (username: string, password: string) => {
              submitted = { username, password };
              return result.asObservable();
            },
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
  });

  function fill(name: string, value: string): void {
    const input = fixture.nativeElement.querySelector(`input[name="${name}"]`) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  it('shows a loading circle while sign-in is in progress', async () => {
    fill('username', 'nick');
    fill('password', 'password');
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    expect(submitted).toEqual({ username: 'nick', password: 'password' });
    expect(button.querySelector('.spin')).not.toBeNull();
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.disabled).toBe(true);

    result.next();
    result.complete();
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/dashboard');
  });

  it('shows an error when the password is wrong', async () => {
    fill('username', 'nick');
    fill('password', 'nope');
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    result.error(new Error('The username or password is wrong.'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('That username or password is wrong.');
    expect(TestBed.inject(Router).url).not.toBe('/dashboard');
  });
});
