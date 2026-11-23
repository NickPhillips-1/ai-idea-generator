import { afterEveryRender, ChangeDetectionStrategy, Component, computed, DestroyRef, effect, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { LabApi, Schemas } from '../../core/api/lab-api.service';
import { pathState } from '../../core/research/path-state';
import { SessionApi, SessionView } from '../../core/api/session-api.service';
import { Theme } from '../../core/theme';
import { FindingReview } from '../findings/finding-review';

const NARROW_SCREEN = '(max-width: 48rem)';

@Component({
  selector: 'app-dashboard-page',
  imports: [FindingReview],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.css',
})
export class DashboardPage implements OnInit {
  private readonly sessions = inject(SessionApi);
  private readonly lab = inject(LabApi);
  private readonly themes = inject(Theme);
  private readonly destroyRef = inject(DestroyRef);
  private desktopSidebarOpen = true;
  private resizeDrag: { move: (event: PointerEvent) => void; stop: () => void } | null = null;
  private lastPointerDown = 0;
  protected readonly narrow = signal(false);
  protected readonly sidebarMin = SIDEBAR_MIN;
  protected readonly sidebarMax = SIDEBAR_MAX;
  protected readonly sidebarWidth = signal(readSidebarWidth());
  protected readonly resizing = signal(false);
  protected readonly theme = this.themes.mode;
  private readonly popup = viewChild<ElementRef<HTMLDialogElement>>('popup');
  private readonly prompt = viewChild<ElementRef<HTMLTextAreaElement>>('prompt');
  private readonly thread = viewChild<ElementRef<HTMLElement>>('thread');
  private thumbDrag: { move: (event: PointerEvent) => void; stop: () => void } | null = null;
  protected readonly thumbOn = signal(false);
  protected readonly thumbHeight = signal(0);
  protected readonly thumbTop = signal(0);
  protected readonly thumbMax = signal(0);
  protected readonly thumbNow = signal(0);
  protected readonly session = signal<SessionView | null>(null);
  protected readonly loadError = signal(false);
  protected readonly findings = signal<Schemas['FindingResponse'][]>([]);
  protected readonly reading = signal<Schemas['IdeaReading'] | null>(null);
  protected readonly chats = signal<Schemas['IdeaChatSummary'][]>([]);
  protected readonly chatsError = signal(false);
  protected readonly deleteError = signal(false);
  protected readonly pendingDelete = signal<Schemas['IdeaChatSummary'] | null>(null);
  protected readonly openChatId = signal<string | null>(null);
  protected readonly model = signal('');
  protected readonly sendError = signal('');
  protected readonly searchMaxLength = 1000;
  protected readonly draft = signal('');
  protected readonly hints = ['ZMS', "Zach's Meats", 'Ironman what', 'mushrooms'];
  private readonly hintIndex = signal(0);
  protected readonly hint = computed(() => this.hints[this.hintIndex()]);
  private readonly statusLines = [
    'Reading the idea...',
    'Reading the questionnaires...',
    'Asking the model...',
    'Checking the reading...',
  ];
  private readonly statusIndex = signal(0);
  protected readonly statusLine = computed(() => this.statusLines[this.statusIndex()]);
  private readonly flights = signal<Record<string, string>>({});
  private readonly composerToken = signal(0);
  private openSerial = 0;
  private stickToLatest = false;
  private readonly deleting = new Set<string>();
  protected readonly sending = computed(() => this.flights()[this.viewKey()] !== undefined);
  protected readonly pendingPrompt = computed(() => this.flights()[this.viewKey()] ?? '');
  protected readonly turns = computed(() => this.reading()?.turns ?? []);
  protected readonly hasThread = computed(
    () => this.sending() || this.reading() !== null || this.sendError() !== '' || this.findings().length > 0,
  );
  protected readonly sidebarOpen = signal(true);
  protected readonly sidebarQuery = signal('');
  protected readonly questionnaires = [
    { id: 'paul', name: 'Paul', file: 'Paul_Questionnaire.md' },
    { id: 'nick', name: 'Nick', file: 'Nick_Questionnaire.md' },
    { id: 'zach', name: 'Zach', file: 'Zach_Questionnaire.md' },
  ];
  protected readonly visibleQuestionnaires = computed(() => {
    const query = this.sidebarQuery().trim().toLowerCase();
    if (!query) {
      return this.questionnaires;
    }
    return this.questionnaires.filter((item) => item.name.toLowerCase().includes(query));
  });
  protected readonly visibleChats = computed(() => {
    const query = this.sidebarQuery().trim().toLowerCase();
    const chats = this.chats();
    if (!query) {
      return chats;
    }
    return chats.filter((chat) => (chat.prompt ?? '').toLowerCase().includes(query));
  });
  protected readonly copies = signal<Record<string, QuestionnaireCopy>>({});
  protected readonly selectedId = signal<string | null>(null);
  protected readonly selected = computed(
    () => this.questionnaires.find((item) => item.id === this.selectedId()) ?? null,
  );
  protected readonly selectedCopy = computed(() => {
    const selected = this.selected();
    if (!selected) {
      return null;
    }
    return this.copies()[selected.id] ?? { status: 'loading' as const, text: '' };
  });

  constructor() {
    this.watchViewport();
    this.destroyRef.onDestroy(() => {
      this.finishResize();
      this.finishThumbDrag();
    });
    const placeThumb = () => this.placeThumb();
    window.addEventListener('resize', placeThumb);
    this.destroyRef.onDestroy(() => window.removeEventListener('resize', placeThumb));
    afterEveryRender(() => {
      const thread = this.thread()?.nativeElement;
      if (thread && this.stickToLatest) {
        thread.scrollTop = thread.scrollHeight;
        this.stickToLatest = false;
      }
      this.placeThumb();
    });
    effect(() => {
      const element = this.popup()?.nativeElement;
      if (element && !element.open) {
        element.showModal();
      }
    });
    effect(() => {
      this.selectedCopy();
      const body = this.popup()?.nativeElement.querySelector('.popup-body');
      if (body instanceof HTMLElement) {
        body.scrollTop = 0;
      }
    });
    effect((onCleanup) => {
      const field = this.prompt()?.nativeElement;
      const canvas = field?.closest('.canvas');
      if (!field || !(canvas instanceof HTMLElement) || typeof ResizeObserver !== 'function') {
        return;
      }
      const observer = new ResizeObserver(() => this.fitComposer(field));
      observer.observe(canvas);
      onCleanup(() => observer.disconnect());
    });
  }

  ngOnInit(): void {
    this.loadQuestionnaires();
    this.loadChats();
    this.lab.model().subscribe({
      next: (body) => this.model.set(body.model ?? ''),
    });
    this.sessions.current().subscribe({
      next: (value) => this.session.set(value),
      error: () => this.loadError.set(true),
    });
    const directionId = pathState.directionId();
    if (!directionId) {
      return;
    }
    this.lab.findings(directionId).subscribe({
      next: (page) => this.findings.set(page.items ?? []),
      error: () => this.loadError.set(true),
    });
  }

  protected nextHint(): void {
    this.hintIndex.update((index) => (index + 1) % this.hints.length);
  }

  protected nextStatus(): void {
    this.statusIndex.update((index) => (index + 1) % this.statusLines.length);
  }

  protected placeThumb(): void {
    const thread = this.thread()?.nativeElement;
    const canvas = thread?.closest('.canvas');
    if (!thread || !(canvas instanceof HTMLElement)) {
      this.thumbOn.set(false);
      return;
    }
    const overflow = thread.scrollHeight - thread.clientHeight;
    if (overflow <= 1) {
      this.thumbOn.set(false);
      return;
    }
    const canvasBox = canvas.getBoundingClientRect();
    const box = thread.getBoundingClientRect();
    canvas.style.setProperty('--rail-top', `${box.top - canvasBox.top}px`);
    canvas.style.setProperty('--rail-height', `${box.height}px`);
    const height = Math.max(36, Math.round((thread.clientHeight / thread.scrollHeight) * box.height));
    const travel = Math.max(1, box.height - height);
    const top = Math.min(travel, Math.round((thread.scrollTop / overflow) * travel));
    this.thumbHeight.set(height);
    this.thumbTop.set(top);
    this.thumbMax.set(overflow);
    this.thumbNow.set(Math.round(thread.scrollTop));
    this.thumbOn.set(true);
  }

  protected jumpThumb(event: PointerEvent): void {
    if (event.button !== 0 || event.target !== event.currentTarget) {
      return;
    }
    const thread = this.thread()?.nativeElement;
    const rail = event.currentTarget;
    if (!thread || !(rail instanceof HTMLElement) || rail.clientHeight <= 0) {
      return;
    }
    const overflow = thread.scrollHeight - thread.clientHeight;
    thread.scrollTop = (event.offsetY / rail.clientHeight) * overflow;
  }

  protected dragThumb(event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }
    const thread = this.thread()?.nativeElement;
    const thumb = event.currentTarget;
    if (!thread || !(thumb instanceof HTMLElement)) {
      return;
    }
    const rail = thumb.parentElement;
    if (!rail) {
      return;
    }
    event.preventDefault();
    const startY = event.clientY;
    const startScroll = thread.scrollTop;
    const overflow = thread.scrollHeight - thread.clientHeight;
    const travel = Math.max(1, rail.clientHeight - thumb.offsetHeight);
    const move = (ev: PointerEvent) => {
      thread.scrollTop = startScroll + ((ev.clientY - startY) / travel) * overflow;
    };
    const stop = () => this.finishThumbDrag();
    this.finishThumbDrag();
    this.thumbDrag = { move, stop };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', stop);
    document.addEventListener('pointercancel', stop);
  }

  protected slideThumb(event: KeyboardEvent): void {
    const thread = this.thread()?.nativeElement;
    if (!thread) {
      return;
    }
    const page = thread.clientHeight;
    if (event.key === 'Home') {
      thread.scrollTop = 0;
    } else if (event.key === 'End') {
      thread.scrollTop = thread.scrollHeight;
    } else if (event.key === 'ArrowDown') {
      thread.scrollTop += 48;
    } else if (event.key === 'ArrowUp') {
      thread.scrollTop -= 48;
    } else if (event.key === 'PageDown') {
      thread.scrollTop += page;
    } else if (event.key === 'PageUp') {
      thread.scrollTop -= page;
    } else {
      return;
    }
    event.preventDefault();
  }

  private finishThumbDrag(): void {
    const drag = this.thumbDrag;
    if (!drag) {
      return;
    }
    this.thumbDrag = null;
    document.removeEventListener('pointermove', drag.move);
    document.removeEventListener('pointerup', drag.stop);
    document.removeEventListener('pointercancel', drag.stop);
  }

  protected openSidebar(): void {
    this.sidebarOpen.set(true);
    if (!this.narrow()) {
      this.desktopSidebarOpen = true;
    }
  }

  protected closeSidebar(): void {
    this.sidebarOpen.set(false);
    if (!this.narrow()) {
      this.desktopSidebarOpen = false;
    }
  }

  protected toggleTheme(): void {
    this.themes.toggle();
  }

  protected onSidebarQuery(event: Event): void {
    this.sidebarQuery.set((event.target as HTMLInputElement).value);
  }

  protected startResize(event: PointerEvent): void {
    if (event.button !== 0 || this.narrow()) {
      return;
    }
    const now = Date.now();
    const doubleClick = event.detail > 1 || (this.lastPointerDown !== 0 && now - this.lastPointerDown < 400);
    this.lastPointerDown = doubleClick ? 0 : now;
    if (doubleClick) {
      this.finishResize();
      this.resetSidebarWidth();
      return;
    }
    event.preventDefault();
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.focus();
    }
    this.finishResize();
    const startX = event.clientX;
    const startWidth = this.sidebarWidth();
    this.resizing.set(true);
    const move = (ev: PointerEvent) => {
      this.setSidebarWidth(startWidth + ev.clientX - startX);
    };
    const stop = () => {
      this.finishResize();
      this.rememberSidebarWidth();
    };
    this.resizeDrag = { move, stop };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', stop);
    document.addEventListener('pointercancel', stop);
  }

  protected resizeFromKey(event: KeyboardEvent): void {
    const step = event.shiftKey ? 32 : 16;
    let next: number | null = null;
    if (event.key === 'ArrowRight') {
      next = this.sidebarWidth() + step;
    } else if (event.key === 'ArrowLeft') {
      next = this.sidebarWidth() - step;
    } else if (event.key === 'Home') {
      next = SIDEBAR_MIN;
    } else if (event.key === 'End') {
      next = SIDEBAR_MAX;
    }
    if (next === null) {
      return;
    }
    event.preventDefault();
    this.setSidebarWidth(next);
    this.rememberSidebarWidth();
  }

  protected resetSidebarWidth(): void {
    this.setSidebarWidth(SIDEBAR_DEFAULT);
    this.rememberSidebarWidth();
  }

  protected newChat(): void {
    this.composerToken.update((token) => token + 1);
    this.openSerial += 1;
    this.draft.set('');
    this.reading.set(null);
    this.sendError.set('');
    this.openChatId.set(null);
    this.pendingDelete.set(null);
    this.sidebarQuery.set('');
    this.selectedId.set(null);
    const field = this.prompt()?.nativeElement;
    if (field) {
      field.value = '';
      field.style.height = 'auto';
      field.focus();
    }
    if (this.narrow()) {
      this.closeSidebar();
    }
  }

  protected send(): void {
    const prompt = this.draft().trim();
    const key = this.viewKey();
    if (!prompt || this.flights()[key] !== undefined) {
      return;
    }
    const chatId = this.openChatId();
    this.statusIndex.set(0);
    this.stickToLatest = true;
    this.sendError.set('');
    this.pendingDelete.set(null);
    this.flights.update((current) => ({ ...current, [key]: prompt }));
    this.draft.set('');
    const field = this.prompt()?.nativeElement;
    if (field) {
      field.value = '';
      field.style.height = 'auto';
    }
    const request = chatId ? this.lab.continueIdea(chatId, prompt) : this.lab.researchIdea(prompt);
    request.subscribe({
      next: (reading) => {
        this.clearFlight(key);
        this.loadChats();
        if (this.viewKey() !== key) {
          return;
        }
        this.openSerial += 1;
        this.reading.set(reading);
        this.openChatId.set(reading.id ?? chatId);
      },
      error: (error: unknown) => {
        this.clearFlight(key);
        this.loadChats();
        if (this.viewKey() !== key) {
          return;
        }
        this.sendError.set(messageFrom(error));
      },
    });
  }

  protected onDraft(event: Event): void {
    const field = event.target as HTMLTextAreaElement;
    const value = field.value.slice(0, this.searchMaxLength);
    if (field.value !== value) {
      field.value = value;
    }
    this.draft.set(value);
    this.fitComposer(field);
  }

  protected askToDelete(chat: Schemas['IdeaChatSummary']): void {
    const id = chat.id;
    if (!id) {
      return;
    }
    this.deleteError.set(false);
    this.pendingDelete.set(chat);
  }

  protected cancelDelete(): void {
    this.pendingDelete.set(null);
    this.deleteError.set(false);
  }

  protected confirmDelete(): void {
    const chat = this.pendingDelete();
    if (!chat) {
      return;
    }
    this.deleteChat(chat);
  }

  protected deleteChat(chat: Schemas['IdeaChatSummary']): void {
    const id = chat.id;
    if (!id || this.deleting.has(id)) {
      return;
    }
    this.deleting.add(id);
    this.deleteError.set(false);
    this.lab.deleteIdea(id).subscribe({
      next: () => {
        this.deleting.delete(id);
        this.chats.update((items) => items.filter((item) => item.id !== id));
        if (this.pendingDelete()?.id === id) {
          this.pendingDelete.set(null);
        }
        if (this.openChatId() === id) {
          this.reading.set(null);
          this.sendError.set('');
          this.openChatId.set(null);
        }
        this.clearFlight(id);
      },
      error: () => {
        this.deleting.delete(id);
        this.deleteError.set(true);
      },
    });
  }

  protected openChat(id: string | undefined): void {
    if (!id) {
      return;
    }
    if (this.pendingDelete()?.id !== id) {
      this.pendingDelete.set(null);
    }
    const serial = ++this.openSerial;
    this.openChatId.set(id);
    this.reading.set(null);
    this.sendError.set('');
    this.draft.set('');
    const field = this.prompt()?.nativeElement;
    if (field) {
      field.value = '';
      field.style.height = 'auto';
    }
    this.lab.idea(id).subscribe({
      next: (reading) => {
        if (serial !== this.openSerial || this.openChatId() !== id) {
          return;
        }
        this.reading.set(reading);
        this.sendError.set('');
        if (this.narrow()) {
          this.closeSidebar();
        }
      },
      error: () => {
        if (serial !== this.openSerial || this.openChatId() !== id) {
          return;
        }
        this.sendError.set('The chat could not be opened.');
      },
    });
  }

  protected selectQuestionnaire(id: string): void {
    this.selectedId.set(id);
    if (this.narrow()) {
      this.closeSidebar();
    }
  }

  protected closeQuestionnaire(): void {
    this.selectedId.set(null);
  }

  protected onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeQuestionnaire();
    }
  }

  private setSidebarWidth(next: number): void {
    this.sidebarWidth.set(clampSidebarWidth(next));
  }

  private rememberSidebarWidth(): void {
    try {
      localStorage.setItem(SIDEBAR_WIDTH_KEY, String(this.sidebarWidth()));
    } catch {
      // Storage is unavailable in some private browsing modes.
    }
  }

  private finishResize(): void {
    const drag = this.resizeDrag;
    if (!drag) {
      this.resizing.set(false);
      return;
    }
    document.removeEventListener('pointermove', drag.move);
    document.removeEventListener('pointerup', drag.stop);
    document.removeEventListener('pointercancel', drag.stop);
    this.resizeDrag = null;
    this.resizing.set(false);
  }

  private watchViewport(): void {
    if (typeof matchMedia !== 'function') {
      return;
    }
    const query = matchMedia(NARROW_SCREEN);
    const apply = () => {
      const narrow = query.matches;
      this.narrow.set(narrow);
      this.sidebarOpen.set(narrow ? false : this.desktopSidebarOpen);
      if (!narrow) {
        this.setSidebarWidth(this.sidebarWidth());
      }
    };
    apply();
    query.addEventListener('change', apply);
    this.destroyRef.onDestroy(() => query.removeEventListener('change', apply));
  }

  private fitComposer(field: HTMLTextAreaElement): void {
    field.style.height = 'auto';
    if (field.scrollHeight > 0) {
      field.style.height = `${field.scrollHeight}px`;
    }
  }

  private viewKey(): string {
    return this.openChatId() ?? `new:${this.composerToken()}`;
  }

  private clearFlight(key: string): void {
    this.flights.update((current) => {
      if (current[key] === undefined) {
        return current;
      }
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  private loadChats(): void {
    this.lab.ideas().subscribe({
      next: (page) => {
        this.chats.set(page.items ?? []);
        this.chatsError.set(false);
        this.deleteError.set(false);
      },
      error: () => this.chatsError.set(true),
    });
  }

  private loadQuestionnaires(): void {
    for (const item of this.questionnaires) {
      void fetch(`/questionaires/${item.file}`)
        .then(async (response) => {
          if (!response.ok) {
            return { status: 'missing' as const, text: '' };
          }
          return { status: 'ready' as const, text: await response.text() };
        })
        .then((copy) => {
          this.copies.update((current) => ({ ...current, [item.id]: copy }));
        })
        .catch(() => {
          this.copies.update((current) => ({ ...current, [item.id]: { status: 'missing', text: '' } }));
        });
    }
  }
}

type QuestionnaireCopy = { status: 'loading' | 'ready' | 'missing'; text: string };

const SIDEBAR_WIDTH_KEY = 'founders-sidebar-width';
const SIDEBAR_DEFAULT = 264;
const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 480;

function sidebarLimit(): number {
  if (typeof window === 'undefined') {
    return SIDEBAR_MAX;
  }
  return Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, window.innerWidth - 360));
}

function clampSidebarWidth(next: number): number {
  return Math.round(Math.min(sidebarLimit(), Math.max(SIDEBAR_MIN, next)));
}

function readSidebarWidth(): number {
  try {
    const stored = Number(localStorage.getItem(SIDEBAR_WIDTH_KEY));
    if (Number.isFinite(stored) && stored > 0) {
      return Math.round(Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, stored)));
    }
  } catch {
    // Storage is unavailable in some private browsing modes.
  }
  return SIDEBAR_DEFAULT;
}

function messageFrom(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'error' in error) {
    const body = (error as { error?: { message?: unknown } }).error;
    if (body && typeof body.message === 'string' && body.message) {
      return body.message;
    }
  }
  return 'The idea could not be researched.';
}
