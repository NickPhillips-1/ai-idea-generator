import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
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
  private readonly narrow = signal(false);
  protected readonly theme = this.themes.mode;
  private readonly popup = viewChild<ElementRef<HTMLDialogElement>>('popup');
  private readonly prompt = viewChild<ElementRef<HTMLTextAreaElement>>('prompt');
  protected readonly session = signal<SessionView | null>(null);
  protected readonly loadError = signal(false);
  protected readonly findings = signal<Schemas['FindingResponse'][]>([]);
  protected readonly reading = signal<Schemas['IdeaReading'] | null>(null);
  protected readonly chats = signal<Schemas['IdeaChatSummary'][]>([]);
  protected readonly chatsError = signal(false);
  protected readonly openChatId = signal<string | null>(null);
  protected readonly model = signal('');
  protected readonly sending = signal(false);
  protected readonly sendError = signal('');
  protected readonly searchMaxLength = 1000;
  protected readonly draft = signal('');
  protected readonly hints = ['ZMS', "Zach's Meats", 'Ironman what', 'mushrooms'];
  private readonly hintIndex = signal(0);
  protected readonly hint = computed(() => this.hints[this.hintIndex()]);
  private readonly statusLines = ['Reading the idea...', 'Asking the model...', 'Checking the reading...'];
  private readonly statusIndex = signal(0);
  protected readonly statusLine = computed(() => this.statusLines[this.statusIndex()]);
  private readonly pendingPrompt = signal('');
  protected readonly threadPrompt = computed(() => {
    const saved = this.reading()?.prompt?.trim();
    if (saved) {
      return saved;
    }
    return this.pendingPrompt();
  });
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

  protected newChat(): void {
    this.draft.set('');
    this.pendingPrompt.set('');
    this.reading.set(null);
    this.sendError.set('');
    this.openChatId.set(null);
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
    if (!prompt || this.sending()) {
      return;
    }
    this.sending.set(true);
    this.statusIndex.set(0);
    this.sendError.set('');
    this.reading.set(null);
    this.pendingPrompt.set(prompt);
    this.draft.set('');
    const field = this.prompt()?.nativeElement;
    if (field) {
      field.value = '';
      field.style.height = 'auto';
    }
    this.lab.researchIdea(prompt).subscribe({
      next: (reading) => {
        this.reading.set(reading);
        this.sending.set(false);
        this.openChatId.set(reading.id ?? null);
        this.loadChats();
      },
      error: (error: unknown) => {
        this.sending.set(false);
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

  protected openChat(id: string | undefined): void {
    if (!id) {
      return;
    }
    this.lab.idea(id).subscribe({
      next: (reading) => {
        this.reading.set(reading);
        this.sendError.set('');
        this.pendingPrompt.set('');
        this.openChatId.set(id);
        this.draft.set('');
        const field = this.prompt()?.nativeElement;
        if (field) {
          field.value = '';
          field.style.height = 'auto';
        }
        if (this.narrow()) {
          this.closeSidebar();
        }
      },
      error: () => this.sendError.set('The chat could not be opened.'),
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

  private watchViewport(): void {
    if (typeof matchMedia !== 'function') {
      return;
    }
    const query = matchMedia(NARROW_SCREEN);
    const apply = () => {
      const narrow = query.matches;
      this.narrow.set(narrow);
      this.sidebarOpen.set(narrow ? false : this.desktopSidebarOpen);
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

  private loadChats(): void {
    this.lab.ideas().subscribe({
      next: (page) => {
        this.chats.set(page.items ?? []);
        this.chatsError.set(false);
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

function messageFrom(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'error' in error) {
    const body = (error as { error?: { message?: unknown } }).error;
    if (body && typeof body.message === 'string' && body.message) {
      return body.message;
    }
  }
  return 'The idea could not be researched.';
}
