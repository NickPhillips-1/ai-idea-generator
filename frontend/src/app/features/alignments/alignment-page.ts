import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LabApi, Schemas } from '../../core/api/lab-api.service';
import { pathState } from '../../core/research/path-state';

@Component({
  selector: 'app-alignment-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './alignment-page.html',
})
export class AlignmentPage implements OnInit {
  private readonly lab = inject(LabApi);
  protected readonly rows = signal<Schemas['QuestionnaireResponse'][]>([]);
  protected readonly selected = signal<string[]>([]);
  protected readonly explanation = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.lab.questionnaires().subscribe({
      next: (page) => this.rows.set(page.items ?? []),
      error: () => this.errorMessage.set('Questionnaires could not be loaded.'),
    });
  }

  toggle(id: string, checked: boolean): void {
    const current = this.selected();
    this.selected.set(checked ? [...current, id] : current.filter((item) => item !== id));
  }

  generate(): void {
    this.errorMessage.set(null);
    this.lab.generateAlignment(this.selected()).subscribe({
      next: (alignment) => {
        if (alignment.id) {
          pathState.setAlignmentId(alignment.id);
        }
        this.explanation.set(alignment.aiExplanation ?? null);
      },
      error: () => this.errorMessage.set('Alignment needs submitted questionnaires from at least two founders.'),
    });
  }
}
