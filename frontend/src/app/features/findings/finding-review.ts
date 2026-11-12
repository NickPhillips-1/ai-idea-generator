import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Schemas } from '../../core/api/lab-api.service';

@Component({
  selector: 'app-finding-review',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './finding-review.html',
})
export class FindingReview {
  readonly findings = input.required<Schemas['FindingResponse'][]>();
}
