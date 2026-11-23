import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { LabApi, Schemas } from '../../core/api/lab-api.service';
import { pathState } from '../../core/research/path-state';
import { SessionApi, SessionView } from '../../core/api/session-api.service';
import { FindingReview } from '../findings/finding-review';

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
  private readonly popup = viewChild<ElementRef<HTMLDialogElement>>('popup');
  private readonly prompt = viewChild<ElementRef<HTMLTextAreaElement>>('prompt');
  protected readonly session = signal<SessionView | null>(null);
  protected readonly loadError = signal(false);
  protected readonly findings = signal<Schemas['FindingResponse'][]>([]);
  protected readonly searchMaxLength = 1000;
  protected readonly draft = signal('');
  protected readonly hints = ['ZMS', "Zach's Meats", 'Ironman what', 'mushrooms'];
  private readonly hintIndex = signal(0);
  protected readonly hint = computed(() => this.hints[this.hintIndex()]);
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
    if (typeof matchMedia === 'function' && matchMedia('(max-width: 40rem)').matches) {
      this.sidebarOpen.set(false);
    }
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
  }

  ngOnInit(): void {
    this.loadQuestionnaires();
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

  protected openSidebar(): void {
    this.sidebarOpen.set(true);
  }

  protected closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  protected onSidebarQuery(event: Event): void {
    this.sidebarQuery.set((event.target as HTMLInputElement).value);
  }

  protected newChat(): void {
    this.draft.set('');
    this.sidebarQuery.set('');
    this.selectedId.set(null);
    const field = this.prompt()?.nativeElement;
    if (field) {
      field.value = '';
      field.focus();
    }
    if (typeof matchMedia === 'function' && matchMedia('(max-width: 40rem)').matches) {
      this.sidebarOpen.set(false);
    }
  }

  protected onDraft(event: Event): void {
    const field = event.target as HTMLTextAreaElement;
    const value = field.value.slice(0, this.searchMaxLength);
    if (field.value !== value) {
      field.value = value;
    }
    this.draft.set(value);
  }

  protected selectQuestionnaire(id: string): void {
    this.selectedId.set(id);
  }

  protected closeQuestionnaire(): void {
    this.selectedId.set(null);
  }

  protected onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeQuestionnaire();
    }
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
