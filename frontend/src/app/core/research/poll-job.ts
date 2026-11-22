import { Observable, switchMap, takeWhile, timer } from 'rxjs';
import { LabApi, Schemas } from '../api/lab-api.service';
import { shouldPoll } from './poll-status';

const POLL_INTERVAL_MS = 2000;

export function pollJob(lab: Pick<LabApi, 'job'>, jobId: string): Observable<Schemas['JobResponse']> {
  return timer(0, POLL_INTERVAL_MS).pipe(
    switchMap(() => lab.job(jobId)),
    takeWhile((job) => shouldPoll(job.status), true),
  );
}
