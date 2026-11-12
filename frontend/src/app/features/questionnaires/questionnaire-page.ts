import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LabApi } from '../../core/api/lab-api.service';

@Component({
  selector: 'app-questionnaire-page',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './questionnaire-page.html',
})
export class QuestionnairePage {
  private readonly lab = inject(LabApi);
  private readonly forms = inject(FormBuilder);
  protected readonly savedId = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly form = this.forms.nonNullable.group({
    interests: ['', Validators.required],
    skills: ['', Validators.required],
    resources: ['', Validators.required],
    goals: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.errorMessage.set(null);
    this.lab.submitQuestionnaire(this.form.getRawValue()).subscribe({
      next: (saved) => this.savedId.set(saved.id ?? null),
      error: () => this.errorMessage.set('The questionnaire was not saved.'),
    });
  }
}
