import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { LoginPage } from './login-page';

@Component({ selector: 'app-blank', template: '' })
class BlankPage {}

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([{ path: 'dashboard', component: BlankPage }]),
        provideHttpClient(),
        provideHttpClientTesting(),
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

  it('shows a loading circle while sign-in is in progress', () => {
    fill('username', 'nick');
    fill('password', 'password');
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    expect(button.querySelector('.spin')).not.toBeNull();
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.disabled).toBe(true);
    const request = TestBed.inject(HttpTestingController).expectOne('/api/v1/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body.toString()).toBe('username=nick&password=password');
    request.flush('', { status: 204, statusText: 'No Content' });
    TestBed.inject(HttpTestingController)
      .expectOne('/api/v1/session')
      .flush({
        founderId: '11111111-1111-1111-1111-111111111111',
        email: 'nick@localhost',
        name: 'nick',
        workspaceId: '00000000-0000-0000-0000-000000000001',
        role: 'FOUNDER',
      });
  });

  it('shows an error when the password is wrong', async () => {
    fill('username', 'nick');
    fill('password', 'nope');
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    TestBed.inject(HttpTestingController)
      .expectOne('/api/v1/login')
      .flush({ status: 401, message: 'The username or password is wrong.' }, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('That username or password is wrong.');
    expect(TestBed.inject(Router).url).not.toBe('/dashboard');
  });
});
