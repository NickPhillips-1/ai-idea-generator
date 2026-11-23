import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import { LabApi, Schemas } from '../../core/api/lab-api.service';
import { SessionApi } from '../../core/api/session-api.service';
import { DashboardPage } from './dashboard-page';

function turn(prompt: string, factualSummary = 'A test idea.'): Schemas['IdeaTurn'] {
  return {
    prompt,
    createdAt: '2026-11-23T18:00:00Z',
    factualSummary,
    supportingEvidence: 'The founder wrote Test.',
    aiInterpretation: 'This is not evidence of demand.',
    unknowns: 'No customer interviews.',
  };
}

function chat(
  prompt: string,
  factualSummary = 'A test idea.',
  id = 'chat-1',
): Schemas['IdeaReading'] {
  return {
    id,
    prompt,
    createdAt: '2026-11-23T18:00:00Z',
    turns: [turn(prompt, factualSummary)],
  };
}

describe('DashboardPage', () => {
  let fixture: ComponentFixture<DashboardPage>;
  let research: (prompt: string) => Observable<Schemas['IdeaReading']>;
  let continueChat: (id: string, prompt: string) => Observable<Schemas['IdeaReading']>;
  let chatPage: Schemas['IdeaChatPage'];
  let listIdeas: () => Observable<Schemas['IdeaChatPage']>;
  let openIdea: (id: string) => Observable<Schemas['IdeaReading']>;
  let removeIdea: (id: string) => Observable<void>;
  const prompts: string[] = [];
  const continued: string[] = [];
  const removed: string[] = [];
  const reading = chat('Test');

  beforeEach(async () => {
    chatPage = { items: [] };
    listIdeas = () => of(chatPage);
    openIdea = () => of(reading);
    removed.length = 0;
    removeIdea = (id: string) => {
      removed.push(id);
      return of(undefined);
    };
    continued.length = 0;
    continueChat = () => {
      throw new Error('A follow-up was not expected.');
    };
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
            deleteIdea: (id: string) => removeIdea(id),
            researchIdea: (prompt: string) => research(prompt),
            continueIdea: (id: string, prompt: string) => continueChat(id, prompt),
            model: () => of({ model: 'gpt-5-mini' }),
          },
        },
      ],
    }).compileComponents();
    prompts.length = 0;
    localStorage.setItem('founders-theme', 'light');
    localStorage.removeItem('founders-sidebar-width');
    fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem('founders-theme');
    localStorage.removeItem('founders-sidebar-width');
    delete document.documentElement.dataset['theme'];
  });

  it('shows the model in the composer', () => {
    const label = fixture.nativeElement.querySelector('.model') as HTMLElement;
    expect(label.textContent?.replace(/\s+/g, ' ').trim()).toBe('Model gpt-5-mini');
  });

  it('rotates example ideas while the search is empty', () => {
    const hints = ['ZMS', "Zach's Meats", 'Ironman what', 'mushrooms'];
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

  it('lists the questionnaires read for a chat as sources', () => {
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.sources')).toBeNull();

    const field = root.querySelector('textarea') as HTMLTextAreaElement;
    field.value = 'Test';
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    (root.querySelector('[aria-label="Send"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    const sources = () => root.querySelector('.sources') as HTMLElement;
    const labels = () =>
      [...sources().querySelectorAll('button')].map((button) =>
        [...button.querySelectorAll('.source-name, .source-file')]
          .map((node) => node.textContent?.trim())
          .join(' '),
      );
    expect(sources().querySelector('h2')?.textContent?.trim()).toBe('Sources');
    expect(labels()).toEqual([
      'Paul Paul_Questionnaire.md',
      'Nick Nick_Questionnaire.md',
      'Zach Zach_Questionnaire.md',
    ]);
    expect(sources().querySelector('button')?.getAttribute('aria-label')).toBe(
      'Paul questionnaire, Paul_Questionnaire.md',
    );

    if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
      HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
        this.setAttribute('open', '');
      };
    }

    (sources().querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(root.querySelector('#questionnaire-title')?.textContent?.trim()).toBe('Paul');

    (root.querySelector('.new-chat') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(root.querySelector('.sources')).toBeNull();
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
    expect(root.querySelector('.activity-row .spin')).not.toBeNull();
    expect(note().textContent?.trim()).toBe('Reading the idea...');

    note().dispatchEvent(new Event('animationiteration'));
    fixture.detectChanges();
    expect(note().textContent?.trim()).toBe('Reading the questionnaires...');

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
    expect(root.querySelector('.activity-row')).toBeNull();
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
    expect(
      newChat &&
        questionnaires &&
        newChat.compareDocumentPosition(questionnaires) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(root.querySelector('.sidebar-list .file')).not.toBeNull();
    expect(root.textContent).toContain('Paul');
    expect(root.textContent).toContain('Recents');
    expect(root.textContent).toContain('No chats yet.');

    const search = root.querySelector('.sidebar-search input') as HTMLInputElement;
    search.value = 'paul';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const names = [...root.querySelectorAll('.sidebar-list button')].map((button) =>
      button.textContent?.trim(),
    );
    expect(names).toEqual(['Paul']);
  });

  it('lists recent chats, filters them, and opens one', () => {
    chatPage = {
      items: [
        { id: 'chat-mushrooms', prompt: 'mushrooms', createdAt: '2026-11-23T18:00:00Z' },
        { id: 'chat-fixtures', prompt: 'shop fixtures', createdAt: '2026-11-23T17:00:00Z' },
      ],
    };
    openIdea = (id: string) => {
      const prompt = id === 'chat-mushrooms' ? 'mushrooms' : 'shop fixtures';
      const factualSummary =
        id === 'chat-mushrooms' ? 'Mushrooms grow in the dark.' : 'Fixtures hold merchandise.';
      return of(chat(prompt, factualSummary, id));
    };

    const page = TestBed.createComponent(DashboardPage);
    page.detectChanges();
    const root = page.nativeElement as HTMLElement;
    const recents = () => root.querySelector('[aria-labelledby="recents-heading"]') as HTMLElement;
    const labels = () =>
      [...recents().querySelectorAll('button:not(.delete-chat)')].map((button) =>
        button.textContent?.trim(),
      );

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

    (recents().querySelector('button:not(.delete-chat)') as HTMLButtonElement).click();
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
      return of(chat(prompt, 'A test idea.', 'chat-1'));
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

  it('keeps a follow-up in the open chat', () => {
    const pending = new Subject<Schemas['IdeaReading']>();
    research = (prompt: string) => {
      prompts.push(prompt);
      chatPage = { items: [{ id: 'chat-1', prompt, createdAt: '2026-11-23T18:00:00Z' }] };
      return of(chat(prompt, 'First reading.', 'chat-1'));
    };
    continueChat = (id: string, prompt: string) => {
      continued.push(`${id}:${prompt}`);
      return pending;
    };

    const root = fixture.nativeElement as HTMLElement;
    const field = () => root.querySelector('textarea') as HTMLTextAreaElement;
    const send = () => root.querySelector('.send') as HTMLButtonElement;
    const userTurns = () =>
      [...root.querySelectorAll('.user-turn')].map((node) => node.textContent?.trim());

    field().value = 'hey test';
    field().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    send().click();
    fixture.detectChanges();

    field().value = 'testing again';
    field().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    send().click();
    fixture.detectChanges();

    expect(userTurns()).toEqual(['hey test', 'testing again']);
    expect(root.textContent).toContain('First reading.');
    expect(root.textContent).not.toContain('Second reading.');

    pending.next({
      id: 'chat-1',
      prompt: 'hey test',
      createdAt: '2026-11-23T18:00:00Z',
      turns: [
        turn('hey test', 'First reading.'),
        {
          prompt: 'testing again',
          createdAt: '2026-11-23T18:01:00Z',
          factualSummary: 'Second reading.',
          supportingEvidence: 'The founder wrote testing again.',
          aiInterpretation: 'Still not evidence of demand.',
          unknowns: 'No interviews.',
        },
      ],
    });
    fixture.detectChanges();

    expect(userTurns()).toEqual(['hey test', 'testing again']);
    expect(root.textContent).toContain('First reading.');
    expect(root.textContent).toContain('Second reading.');
    expect(continued).toEqual(['chat-1:testing again']);
    const recents = root.querySelector('[aria-labelledby="recents-heading"]') as HTMLElement;
    expect(recents.querySelectorAll('.recent').length).toBe(1);
    expect(recents.textContent).toContain('hey test');

    (root.querySelector('.new-chat') as HTMLButtonElement).click();
    fixture.detectChanges();
    field().value = 'fresh';
    field().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    (root.querySelector('[aria-label="Send"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(prompts).toEqual(['hey test', 'fresh']);
    expect(continued).toEqual(['chat-1:testing again']);
  });

  it('keeps an in-flight question on the chat that sent it', () => {
    const first = new Subject<Schemas['IdeaReading']>();
    const second = new Subject<Schemas['IdeaReading']>();
    chatPage = {
      items: [{ id: 'chat-fixtures', prompt: 'shop fixtures', createdAt: '2026-11-23T17:00:00Z' }],
    };
    openIdea = (id: string) => {
      if (id === 'chat-testing') {
        return of(chat('Testing', 'A fresh idea.', 'chat-testing'));
      }
      return of(chat('shop fixtures', 'Fixtures hold merchandise.', 'chat-fixtures'));
    };
    research = (prompt: string) => {
      prompts.push(prompt);
      return first;
    };
    continueChat = (id: string, prompt: string) => {
      continued.push(`${id}:${prompt}`);
      return second;
    };

    const page = TestBed.createComponent(DashboardPage);
    page.detectChanges();
    const root = page.nativeElement as HTMLElement;
    const field = () => root.querySelector('textarea') as HTMLTextAreaElement;
    const send = () => root.querySelector('.send') as HTMLButtonElement;
    const recents = () => root.querySelector('[aria-labelledby="recents-heading"]') as HTMLElement;
    const userTurns = () =>
      [...root.querySelectorAll('.user-turn')].map((node) => node.textContent?.trim());

    field().value = 'Testing';
    field().dispatchEvent(new Event('input'));
    page.detectChanges();
    send().click();
    page.detectChanges();

    expect(userTurns()).toEqual(['Testing']);
    expect(root.querySelector('.activity')).not.toBeNull();

    (recents().querySelector('button:not(.delete-chat)') as HTMLButtonElement).click();
    page.detectChanges();

    expect(userTurns()).toEqual(['shop fixtures']);
    expect(root.textContent).toContain('Fixtures hold merchandise.');
    expect(root.querySelector('.activity')).toBeNull();
    expect(recents().querySelector('button:not(.delete-chat)')?.getAttribute('aria-pressed')).toBe(
      'true',
    );

    field().value = 'another';
    field().dispatchEvent(new Event('input'));
    page.detectChanges();

    expect(send().disabled).toBe(false);
    expect(send().getAttribute('aria-label')).toBe('Send');
    send().click();
    page.detectChanges();

    expect(prompts).toEqual(['Testing']);
    expect(continued).toEqual(['chat-fixtures:another']);
    expect(userTurns()).toEqual(['shop fixtures', 'another']);
    expect(root.querySelector('.activity')).not.toBeNull();
    expect(root.textContent).not.toContain('A fresh idea.');

    chatPage = {
      items: [
        { id: 'chat-testing', prompt: 'Testing', createdAt: '2026-11-23T18:00:00Z' },
        { id: 'chat-fixtures', prompt: 'shop fixtures', createdAt: '2026-11-23T17:00:00Z' },
      ],
    };
    first.next(chat('Testing', 'A fresh idea.', 'chat-testing'));
    page.detectChanges();

    expect(userTurns()).toEqual(['shop fixtures', 'another']);
    expect(root.textContent).toContain('Fixtures hold merchandise.');
    expect(root.textContent).not.toContain('A fresh idea.');
    expect(recents().querySelector('[aria-pressed="true"]')?.textContent?.trim()).toBe(
      'shop fixtures',
    );
    expect(
      [...recents().querySelectorAll('button:not(.delete-chat)')].map((button) =>
        button.textContent?.trim(),
      ),
    ).toEqual(['Testing', 'shop fixtures']);

    (recents().querySelector('button:not(.delete-chat)') as HTMLButtonElement).click();
    page.detectChanges();

    expect(userTurns()).toEqual(['Testing']);
    expect(root.textContent).toContain('A fresh idea.');
    expect(root.querySelector('.activity')).toBeNull();
  });

  it('deletes a recent chat and closes it when that chat is open', () => {
    chatPage = {
      items: [
        { id: 'chat-mushrooms', prompt: 'mushrooms', createdAt: '2026-11-23T18:00:00Z' },
        { id: 'chat-fixtures', prompt: 'shop fixtures', createdAt: '2026-11-23T17:00:00Z' },
      ],
    };
    openIdea = () => of(chat('mushrooms', 'A test idea.', 'chat-mushrooms'));

    const page = TestBed.createComponent(DashboardPage);
    page.detectChanges();
    const root = page.nativeElement as HTMLElement;
    const recents = () => root.querySelector('[aria-labelledby="recents-heading"]') as HTMLElement;
    const labels = () =>
      [...recents().querySelectorAll('button:not(.delete-chat)')].map((button) =>
        button.textContent?.trim(),
      );

    (recents().querySelector('button:not(.delete-chat)') as HTMLButtonElement).click();
    page.detectChanges();
    expect(root.querySelector('.user-turn')?.textContent?.trim()).toBe('mushrooms');

    (recents().querySelector('[aria-label="Delete mushrooms"]') as HTMLButtonElement).click();
    page.detectChanges();

    expect(removed).toEqual([]);
    expect(recents().querySelector('.confirm')?.textContent).toContain('Are you sure?');
    expect(root.querySelector('.thread .confirm')).toBeNull();
    expect(labels()).toEqual(['Cancel', 'Delete', 'shop fixtures']);
    expect(root.querySelector('.user-turn')?.textContent?.trim()).toBe('mushrooms');

    (root.querySelector('.confirm-yes') as HTMLButtonElement).click();
    page.detectChanges();

    expect(removed).toEqual(['chat-mushrooms']);
    expect(labels()).toEqual(['shop fixtures']);
    expect(root.querySelector('.user-turn')).toBeNull();
    expect(root.querySelector('.thread')).toBeNull();
    expect(root.querySelector('.confirm')).toBeNull();
    expect(recents().querySelector('[aria-label="Delete shop fixtures"]')).not.toBeNull();
  });

  it('leaves the chat when delete is cancelled', () => {
    chatPage = {
      items: [{ id: 'chat-mushrooms', prompt: 'mushrooms', createdAt: '2026-11-23T18:00:00Z' }],
    };
    openIdea = () => of(chat('mushrooms', 'A test idea.', 'chat-mushrooms'));

    const page = TestBed.createComponent(DashboardPage);
    page.detectChanges();
    const root = page.nativeElement as HTMLElement;
    const recents = root.querySelector('[aria-labelledby="recents-heading"]') as HTMLElement;

    (recents.querySelector('button:not(.delete-chat)') as HTMLButtonElement).click();
    page.detectChanges();
    (recents.querySelector('[aria-label="Delete mushrooms"]') as HTMLButtonElement).click();
    page.detectChanges();
    const cancel = [...recents.querySelectorAll('.confirm button')].find(
      (button) => button.textContent?.trim() === 'Cancel',
    );
    (cancel as HTMLButtonElement).click();
    page.detectChanges();

    expect(removed).toEqual([]);
    expect(root.querySelector('.confirm')).toBeNull();
    expect(recents.textContent).toContain('mushrooms');
    expect(root.querySelector('.user-turn')?.textContent?.trim()).toBe('mushrooms');
  });

  it('keeps the chat when delete fails', () => {
    chatPage = {
      items: [{ id: 'chat-mushrooms', prompt: 'mushrooms', createdAt: '2026-11-23T18:00:00Z' }],
    };
    removeIdea = () => throwError(() => new Error('offline'));

    const page = TestBed.createComponent(DashboardPage);
    page.detectChanges();
    const root = page.nativeElement as HTMLElement;
    const recents = root.querySelector('[aria-labelledby="recents-heading"]') as HTMLElement;

    (recents.querySelector('[aria-label="Delete mushrooms"]') as HTMLButtonElement).click();
    page.detectChanges();
    (root.querySelector('.confirm-yes') as HTMLButtonElement).click();
    page.detectChanges();

    expect(recents.querySelectorAll('.recent').length).toBe(1);
    expect(recents.textContent).toContain('The chat could not be deleted.');
    expect(recents.querySelector('.confirm')?.textContent).toContain('Are you sure?');
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

  it('drags the sidebar wider and remembers the width', () => {
    const root = fixture.nativeElement as HTMLElement;
    const slot = root.querySelector('.sidebar-slot') as HTMLElement;
    const handle = root.querySelector('[aria-label="Resize sidebar"]') as HTMLElement;

    expect(slot.style.getPropertyValue('--sidebar-width')).toBe('264px');
    expect(handle.getAttribute('aria-valuenow')).toBe('264');

    handle.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 300, button: 0, bubbles: true }),
    );
    document.dispatchEvent(new PointerEvent('pointermove', { clientX: 380 }));
    document.dispatchEvent(new PointerEvent('pointerup', { clientX: 380 }));
    fixture.detectChanges();

    expect(slot.style.getPropertyValue('--sidebar-width')).toBe('344px');
    expect(handle.getAttribute('aria-valuenow')).toBe('344');
    expect(localStorage.getItem('founders-sidebar-width')).toBe('344');
    expect(slot.classList.contains('is-resizing')).toBe(false);

    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    fixture.detectChanges();

    expect(slot.style.getPropertyValue('--sidebar-width')).toBe('328px');

    handle.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 300, button: 0, bubbles: true, detail: 2 }),
    );
    fixture.detectChanges();

    expect(slot.style.getPropertyValue('--sidebar-width')).toBe('264px');
    expect(localStorage.getItem('founders-sidebar-width')).toBe('264');
  });

  it('restores a saved sidebar width', () => {
    localStorage.setItem('founders-sidebar-width', '320');
    const again = TestBed.createComponent(DashboardPage);
    again.detectChanges();
    const slot = again.nativeElement.querySelector('.sidebar-slot') as HTMLElement;

    expect(slot.style.getPropertyValue('--sidebar-width')).toBe('320px');
    again.destroy();
  });

  it('closes and reopens the sidebar', () => {
    const root = fixture.nativeElement as HTMLElement;
    const slot = () => root.querySelector('.sidebar-slot') as HTMLElement;

    (root.querySelector('[aria-label="Close sidebar"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(slot().classList.contains('is-closed')).toBe(true);
    expect(root.querySelector('aside')?.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelector('[aria-label="Open sidebar"]')?.hasAttribute('aria-hidden')).toBe(
      false,
    );

    (root.querySelector('[aria-label="Open sidebar"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(slot().classList.contains('is-closed')).toBe(false);
    expect(root.querySelector('aside')?.hasAttribute('aria-hidden')).toBe(false);
    expect(root.querySelector('[aria-label="Open sidebar"]')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
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
      return {
        matches: false,
        addEventListener() {},
        removeEventListener() {},
      } as unknown as MediaQueryList;
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
