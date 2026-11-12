import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LabApi } from '../../core/api/lab-api.service';
import { pathState } from '../../core/research/path-state';

@Component({
  selector: 'app-direction-page',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './direction-page.html',
})
export class DirectionPage {
  private readonly lab = inject(LabApi);
  private readonly forms = inject(FormBuilder);
  protected readonly directionId = signal<string | null>(pathState.directionId());
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly form = this.forms.nonNullable.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
  });

  create(): void {
    const alignmentId = pathState.alignmentId();
    if (!alignmentId || this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set(alignmentId ? 'Title and description are required.' : 'Generate an alignment first.');
      return;
    }
    this.lab.createDirection(alignmentId, this.form.controls.title.value, this.form.controls.description.value).subscribe({
      next: (direction) => {
        if (direction.id) {
          pathState.setDirectionId(direction.id);
          this.directionId.set(direction.id);
        }
        this.errorMessage.set(null);
      },
      error: () => this.errorMessage.set('The direction was not saved.'),
    });
  }
}
