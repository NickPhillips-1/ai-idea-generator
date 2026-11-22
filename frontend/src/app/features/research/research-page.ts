import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LabApi, Schemas } from '../../core/api/lab-api.service';
import { pathState } from '../../core/research/path-state';
import { pollJob } from '../../core/research/poll-job';
import { shouldPoll } from '../../core/research/poll-status';
import { FindingReview } from '../findings/finding-review';

@Component({
  selector: 'app-research-page',
  imports: [FindingReview, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './research-page.html',
})
export class ResearchPage implements OnInit {
  private readonly lab = inject(LabApi);
  protected readonly status = signal<string | null>(null);
  protected readonly findings = signal<Schemas['FindingResponse'][]>([]);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly directionReady = signal(pathState.directionId() !== null);

  ngOnInit(): void {
    const jobId = pathState.jobId();
    const directionId = pathState.directionId();
    if (jobId && directionId) {
      this.watch(jobId, directionId);
    }
  }

  start(): void {
    const directionId = pathState.directionId();
    if (!directionId) {
      this.errorMessage.set('Save a research direction first.');
      return;
    }
    this.lab.startResearch(directionId, crypto.randomUUID()).subscribe({
      next: (started) => {
        pathState.setJobId(started.jobId);
        this.watch(started.jobId, directionId);
      },
      error: () => this.errorMessage.set('Research did not start.'),
    });
  }

  private watch(jobId: string, directionId: string): void {
    pollJob(this.lab, jobId).subscribe({
      next: (job) => {
        this.status.set(job.status ?? null);
        if (!shouldPoll(job.status)) {
          this.lab.findings(directionId).subscribe((page) => this.findings.set(page.items ?? []));
        }
      },
      error: () => this.errorMessage.set('The research job could not be read.'),
    });
  }
}
