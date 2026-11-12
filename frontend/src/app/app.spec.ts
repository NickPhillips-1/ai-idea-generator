import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

@Component({ selector: 'app-blank', template: '' })
class BlankPage {}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([{ path: 'login', component: BlankPage }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  afterEach(() => {
    const http = TestBed.inject(HttpTestingController);
    http.match('/api/v1/session').forEach((request) => {
      request.flush({}, { status: 401, statusText: 'Unauthorized' });
    });
    http.verify();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should name Founders in the shell', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController)
      .expectOne('/api/v1/session')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const header = compiled.querySelector('header');
    expect(header?.querySelector('.product-name')?.textContent).toContain('Founders');
    expect(header?.querySelector('.sign-in')?.textContent).toContain('Sign in');
  });

  it('shows the Google picture when the session has one', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne('/api/v1/session').flush({
      founderId: '11111111-1111-1111-1111-111111111111',
      email: 'ada@example.com',
      name: 'Ada',
      workspaceId: '22222222-2222-2222-2222-222222222222',
      role: 'FOUNDER',
      pictureUrl: 'https://example.com/ada.png',
    });
    await fixture.whenStable();
    fixture.detectChanges();
    const image = fixture.nativeElement.querySelector('.profile img') as HTMLImageElement;
    expect(image.src).toBe('https://example.com/ada.png');
    expect(fixture.nativeElement.querySelector('.profile')?.getAttribute('aria-label')).toBe('Ada');
    expect(fixture.nativeElement.querySelector('.sign-in')).toBeNull();
    expect(fixture.nativeElement.querySelector('.logout')).toBeNull();

    (fixture.nativeElement.querySelector('.profile') as HTMLButtonElement).click();
    fixture.detectChanges();
    const logout = fixture.nativeElement.querySelector('.logout') as HTMLButtonElement;
    expect(logout.textContent).toContain('Log out');

    logout.click();
    fixture.detectChanges();
    expect(logout.disabled).toBe(true);
    expect(logout.querySelector('.spin')).not.toBeNull();
    const request = TestBed.inject(HttpTestingController).expectOne('/logout');
    expect(request.request.method).toBe('POST');
    request.flush('', { status: 204, statusText: 'No Content' });
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.logout')).toBeNull();
  });
});
