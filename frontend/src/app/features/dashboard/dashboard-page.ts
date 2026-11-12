import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { LabApi, Schemas } from '../../core/api/lab-api.service';
import { pathState } from '../../core/research/path-state';
import { SessionApi, SessionView } from '../../core/api/session-api.service';
import { FindingReview } from '../findings/finding-review';

@Component({
  selector: 'app-dashboard-page',
  imports: [FindingReview],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-page.html',
})
export class DashboardPage implements OnInit {
  private readonly sessions = inject(SessionApi);
  private readonly lab = inject(LabApi);
  protected readonly session = signal<SessionView | null>(null);
  protected readonly loadError = signal(false);
  protected readonly findings = signal<Schemas['FindingResponse'][]>([]);

  ngOnInit(): void {
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
}
