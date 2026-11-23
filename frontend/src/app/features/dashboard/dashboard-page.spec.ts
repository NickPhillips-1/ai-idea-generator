import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LabApi } from '../../core/api/lab-api.service';
import { SessionApi } from '../../core/api/session-api.service';
import { DashboardPage } from './dashboard-page';

describe('DashboardPage', () => {
  let fixture: ComponentFixture<DashboardPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        {
          provide: SessionApi,
          useValue: { current: () => of({ name: 'nick' }) },
        },
        {
          provide: LabApi,
          useValue: { findings: () => of({ items: [] }) },
        },
      ],
    }).compileComponents();
    localStorage.setItem('founders-theme', 'light');
    fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem('founders-theme');
    delete document.documentElement.dataset['theme'];
  });

  it('rotates example ideas while the search is empty', () => {
    const hints = ["ZMS", "Zach's Meats", 'Ironman what', 'mushrooms'];
    const hint = () => fixture.nativeElement.querySelector('.rotating') as HTMLElement;

    expect(hint().textContent?.trim()).toBe(hints[0]);

    for (let index = 1; index < hints.length; index += 1) {
      hint().dispatchEvent(new Event('animationiteration'));
      fixture.detectChanges();
      expect(hint().textContent?.trim()).toBe(hints[index]);
    }

    hint().dispatchEvent(new Event('animationiteration'));
    fixture.detectChanges();
    expect(hint().textContent?.trim()).toBe(hints[0]);
  });

  it('hides the example once the search has text', () => {
    const field = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    field.value = 'mushrooms';
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.rotating')).toBeNull();

    field.value = '';
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.rotating')?.textContent?.trim()).toBe('ZMS');
  });

  it('caps the search at 1000 characters', () => {
    const field = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    expect(field.getAttribute('maxlength')).toBe('1000');
    expect(fixture.nativeElement.textContent).toContain('0 / 1000');

    field.value = 'a'.repeat(1001);
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(field.value.length).toBe(1000);
    expect(fixture.nativeElement.textContent).toContain('1000 / 1000');
  });

  it('lists questionnaires in the sidebar and filters them', () => {
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.new-chat')?.textContent).toContain('New chat');
    expect(root.textContent).toContain('Questionnaires');
    const questionnaires = root.querySelector('#questionnaires-heading');
    const newChat = root.querySelector('.new-chat');
    expect(newChat && questionnaires && (newChat.compareDocumentPosition(questionnaires) & Node.DOCUMENT_POSITION_FOLLOWING)).toBeTruthy();
    expect(root.querySelector('.sidebar-list .file')).not.toBeNull();
    expect(root.textContent).toContain('Paul');
    expect(root.textContent).toContain('Recents');
    expect(root.textContent).toContain('No chats yet.');

    const search = root.querySelector('.sidebar-search input') as HTMLInputElement;
    search.value = 'paul';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const names = [...root.querySelectorAll('.sidebar-list button')].map((button) => button.textContent?.trim());
    expect(names).toEqual(['Paul']);
  });

  it('starts a new chat from the sidebar', () => {
    const root = fixture.nativeElement as HTMLElement;
    const field = root.querySelector('textarea') as HTMLTextAreaElement;
    field.value = 'mushrooms';
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    (root.querySelector('.new-chat') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(field.value).toBe('');
    expect(root.querySelector('.rotating')).not.toBeNull();
    expect(document.activeElement).toBe(field);
  });

  it('closes and reopens the sidebar', () => {
    const root = fixture.nativeElement as HTMLElement;
    const slot = () => root.querySelector('.sidebar-slot') as HTMLElement;

    (root.querySelector('[aria-label="Close sidebar"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(slot().classList.contains('is-closed')).toBe(true);
    expect(root.querySelector('aside')?.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelector('[aria-label="Open sidebar"]')?.hasAttribute('aria-hidden')).toBe(false);

    (root.querySelector('[aria-label="Open sidebar"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(slot().classList.contains('is-closed')).toBe(false);
    expect(root.querySelector('aside')?.hasAttribute('aria-hidden')).toBe(false);
    expect(root.querySelector('[aria-label="Open sidebar"]')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('switches color mode from the bottom of the sidebar', () => {
    const root = fixture.nativeElement as HTMLElement;
    const aside = root.querySelector('aside') as HTMLElement;
    const foot = root.querySelector('.sidebar-foot') as HTMLElement;
    const button = foot.querySelector('button') as HTMLButtonElement;

    expect(aside.lastElementChild).toBe(foot);
    expect(button.textContent).toContain('Dark mode');
    expect(button.getAttribute('aria-label')).toBe('Switch to dark mode');
    expect(document.documentElement.dataset['theme']).toBe('light');

    button.click();
    fixture.detectChanges();

    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(localStorage.getItem('founders-theme')).toBe('dark');
    expect(button.textContent).toContain('Light mode');
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.getAttribute('aria-label')).toBe('Switch to light mode');

    button.click();
    fixture.detectChanges();

    expect(document.documentElement.dataset['theme']).toBe('light');
    expect(button.textContent).toContain('Dark mode');
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });
});
