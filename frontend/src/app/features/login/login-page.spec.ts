import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LoginPage } from './login-page';

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
  });

  it('shows a loading circle while Google sign-in starts', () => {
    const link = fixture.nativeElement.querySelector('.google') as HTMLAnchorElement;
    link.addEventListener('click', (event) => event.preventDefault());
    link.click();
    fixture.detectChanges();

    expect(link.querySelector('.spin')).not.toBeNull();
    expect(link.querySelector('.mark')).toBeNull();
    expect(link.getAttribute('aria-busy')).toBe('true');
    expect(link.getAttribute('href')).toBe('/oauth2/authorization/google');
    expect(link.textContent).toContain('Continue with Google');
  });
});
