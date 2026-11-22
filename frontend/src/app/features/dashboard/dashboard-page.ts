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
  protected readonly session = signal<SessionView | null>(null);
  protected readonly loadError = signal(false);
  protected readonly findings = signal<Schemas['FindingResponse'][]>([]);
  protected readonly draft = signal('');
  protected readonly questionnaires = [
    { id: 'paul', name: 'Paul', file: 'Paul_Questionnaire.md' },
    { id: 'nick', name: 'Nick', file: 'Nick_Questionnaire.md' },
    { id: 'zach', name: 'Zach', file: 'Zach_Questionnaire.md' },
  ];
  protected readonly copies = signal<Record<string, QuestionnaireCopy>>({});
  protected readonly selectedId = signal<string | null>(null);
  protected readonly visibleQuestionnaires = computed(() => {
    const query = this.draft().trim().toLowerCase();
    const copies = this.copies();
    if (!query) {
      return this.questionnaires;
    }
    return this.questionnaires.filter((item) => {
      if (item.name.toLowerCase().includes(query)) {
        return true;
      }
      const copy = copies[item.id];
      return copy?.status === 'ready' && copy.text.toLowerCase().includes(query);
    });
  });
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
    effect(() => {
      const element = this.popup()?.nativeElement;
      if (element && !element.open) {
        element.showModal();
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

  protected onDraft(event: Event): void {
    this.draft.set((event.target as HTMLTextAreaElement).value);
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
