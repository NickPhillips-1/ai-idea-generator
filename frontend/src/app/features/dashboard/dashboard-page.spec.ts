import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import { LabApi, Schemas } from '../../core/api/lab-api.service';
import { SessionApi } from '../../core/api/session-api.service';
import { DashboardPage } from './dashboard-page';

describe('DashboardPage', () => {
  let fixture: ComponentFixture<DashboardPage>;
  let research: (prompt: string) => Observable<Schemas['IdeaReading']>;
  let chatPage: Schemas['IdeaChatPage'];
  let listIdeas: () => Observable<Schemas['IdeaChatPage']>;
  let openIdea: (id: string) => Observable<Schemas['IdeaReading']>;
  const prompts: string[] = [];
  const reading: Schemas['IdeaReading'] = {
    factualSummary: 'A test idea.',
    supportingEvidence: 'The founder wrote Test.',
    aiInterpretation: 'This is not evidence of demand.',
    unknowns: 'No customer interviews.',
  };

  beforeEach(async () => {
    chatPage = { items: [] };
    listIdeas = () => of(chatPage);
    openIdea = () => of(reading);
    research = (prompt: string) => {
      prompts.push(prompt);
      return of(reading);
    };
    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        {
          provide: SessionApi,
          useValue: { current: () => of({ name: 'nick' }) },
        },
        {
          provide: LabApi,
          useValue: {
            findings: () => of({ items: [] }),
            ideas: () => listIdeas(),
            idea: (id: string) => openIdea(id),
            researchIdea: (prompt: string) => research(prompt),
            model: () => of({ model: 'gpt-5-mini' }),
          },
        },
      ],
    }).compileComponents();
    prompts.length = 0;
    localStorage.setItem('founders-theme', 'light');
    fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem('founders-theme');
    delete document.documentElement.dataset['theme'];
  });

  it('shows the model in the composer', () => {
    const label = fixture.nativeElement.querySelector('.model') as HTMLElement;
    expect(label.textContent?.replace(/\s+/g, ' ').trim()).toBe('Model gpt-5-mini');
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

  it('sends the idea when the arrow is clicked', () => {
    const root = fixture.nativeElement as HTMLElement;
    const send = () => root.querySelector('[aria-label="Send"]') as HTMLButtonElement;
    expect(send().disabled).toBe(true);

    const field = root.querySelector('textarea') as HTMLTextAreaElement;
    field.value = '  Test  ';
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(send().disabled).toBe(false);
    send().click();
    fixture.detectChanges();

    expect(prompts).toEqual(['Test']);
    expect(root.querySelector('.home')?.classList.contains('has-thread')).toBe(true);
    expect(root.querySelector('.thread')).not.toBeNull();
    expect(root.querySelector('.user-turn')?.textContent?.trim()).toBe('Test');
    expect(root.querySelector('.thread .layer')).toBeNull();
    expect((root.querySelector('textarea') as HTMLTextAreaElement).value).toBe('');
    expect(root.textContent).toContain('A test idea.');
    expect(root.textContent).toContain('This is not evidence of demand.');
  });

  it('shows a spinner and cycles status while the idea is researched', () => {
    const pending = new Subject<Schemas['IdeaReading']>();
    research = (prompt: string) => {
      prompts.push(prompt);
      return pending;
    };

    const root = fixture.nativeElement as HTMLElement;
    const field = root.querySelector('textarea') as HTMLTextAreaElement;
    field.value = 'Test';
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const send = () => root.querySelector('.send') as HTMLButtonElement;
    send().click();
    fixture.detectChanges();

    const note = () => root.querySelector('.activity') as HTMLElement;
    expect(send().getAttribute('aria-label')).toBe('Researching');
    expect(send().getAttribute('aria-busy')).toBe('true');
    expect(send().querySelector('.spinner')).not.toBeNull();
    expect(note().textContent?.trim()).toBe('Reading the idea...');

    note().dispatchEvent(new Event('animationiteration'));
    fixture.detectChanges();
    expect(note().textContent?.trim()).toBe('Asking the model...');

    note().dispatchEvent(new Event('animationiteration'));
    fixture.detectChanges();
    expect(note().textContent?.trim()).toBe('Checking the reading...');

    note().dispatchEvent(new Event('animationiteration'));
    fixture.detectChanges();
    expect(note().textContent?.trim()).toBe('Reading the idea...');

    pending.next(reading);
    fixture.detectChanges();

    expect(root.querySelector('[aria-label="Send"]')).not.toBeNull();
    expect(root.querySelector('.spinner')).toBeNull();
    expect(root.textContent).toContain('A test idea.');
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

  it('lists recent chats, filters them, and opens one', () => {
    chatPage = {
      items: [
        { id: 'chat-mushrooms', prompt: 'mushrooms', createdAt: '2026-11-23T18:00:00Z' },
        { id: 'chat-fixtures', prompt: 'shop fixtures', createdAt: '2026-11-23T17:00:00Z' },
      ],
    };
    openIdea = (id: string) =>
      of({
        ...reading,
        id,
        prompt: id === 'chat-mushrooms' ? 'mushrooms' : 'shop fixtures',
        factualSummary: id === 'chat-mushrooms' ? 'Mushrooms grow in the dark.' : 'Fixtures hold merchandise.',
      });

    const page = TestBed.createComponent(DashboardPage);
    page.detectChanges();
    const root = page.nativeElement as HTMLElement;
    const recents = () => root.querySelector('[aria-labelledby="recents-heading"]') as HTMLElement;
    const labels = () => [...recents().querySelectorAll('button')].map((button) => button.textContent?.trim());

    expect(labels()).toEqual(['mushrooms', 'shop fixtures']);
    expect(root.textContent).not.toContain('No chats yet.');

    const search = root.querySelector('.sidebar-search input') as HTMLInputElement;
    search.value = 'shop';
    search.dispatchEvent(new Event('input'));
    page.detectChanges();
    expect(labels()).toEqual(['shop fixtures']);

    search.value = 'zzzz';
    search.dispatchEvent(new Event('input'));
    page.detectChanges();
    expect(recents().textContent).toContain('No matches.');

    search.value = '';
    search.dispatchEvent(new Event('input'));
    page.detectChanges();

    (recents().querySelector('button') as HTMLButtonElement).click();
    page.detectChanges();

    expect(recents().querySelector('button')?.getAttribute('aria-pressed')).toBe('true');
    expect(root.textContent).toContain('Mushrooms grow in the dark.');
    expect(root.querySelector('.user-turn')?.textContent?.trim()).toBe('mushrooms');
    expect(root.querySelector('.thread .layer')).toBeNull();
    expect((root.querySelector('textarea') as HTMLTextAreaElement).value).toBe('');

    (root.querySelector('.new-chat') as HTMLButtonElement).click();
    page.detectChanges();

    expect(recents().querySelector('[aria-pressed="true"]')).toBeNull();
    expect(root.querySelector('.thread')).toBeNull();
    expect((root.querySelector('textarea') as HTMLTextAreaElement).value).toBe('');
  });

  it('adds a sent idea to recents', () => {
    research = (prompt: string) => {
      prompts.push(prompt);
      chatPage = {
        items: [{ id: 'chat-1', prompt, createdAt: '2026-11-23T18:00:00Z' }],
      };
      return of({ ...reading, id: 'chat-1', prompt });
    };

    const root = fixture.nativeElement as HTMLElement;
    const field = root.querySelector('textarea') as HTMLTextAreaElement;
    field.value = 'mushrooms';
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    (root.querySelector('[aria-label="Send"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    const recents = root.querySelector('[aria-labelledby="recents-heading"]') as HTMLElement;
    const button = recents.querySelector('button') as HTMLButtonElement;
    expect(button.textContent?.trim()).toBe('mushrooms');
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('says when chats cannot be loaded', () => {
    listIdeas = () => throwError(() => new Error('offline'));
    const page = TestBed.createComponent(DashboardPage);
    page.detectChanges();

    expect(page.nativeElement.textContent).toContain('Chats could not be loaded.');
    expect(page.nativeElement.querySelector('textarea')).not.toBeNull();
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

  it('keeps the sidebar in a drawer on a narrow window and docks it again when the window grows', () => {
    const listeners: Array<(event: MediaQueryListEvent) => void> = [];
    const query = {
      matches: true,
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.push(listener);
      },
      removeEventListener: () => undefined,
    };
    const original = window.matchMedia?.bind(window);
    window.matchMedia = (queryText: string) => {
      if (queryText === '(max-width: 48rem)') {
        return query as unknown as MediaQueryList;
      }
      if (original) {
        return original(queryText);
      }
      return { matches: false, addEventListener() {}, removeEventListener() {} } as unknown as MediaQueryList;
    };

    const phone = TestBed.createComponent(DashboardPage);
    phone.detectChanges();
    const slot = () => phone.nativeElement.querySelector('.sidebar-slot') as HTMLElement;
    expect(slot().classList.contains('is-closed')).toBe(true);

    query.matches = false;
    for (const listener of listeners) {
      listener({ matches: false } as MediaQueryListEvent);
    }
    phone.detectChanges();
    expect(slot().classList.contains('is-closed')).toBe(false);

    query.matches = true;
    for (const listener of listeners) {
      listener({ matches: true } as MediaQueryListEvent);
    }
    phone.detectChanges();
    expect(slot().classList.contains('is-closed')).toBe(true);

    phone.destroy();
    if (original) {
      window.matchMedia = original;
    } else {
      delete (window as { matchMedia?: typeof window.matchMedia }).matchMedia;
    }
  });
});
