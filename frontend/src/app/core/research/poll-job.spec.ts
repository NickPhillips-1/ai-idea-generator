import { firstValueFrom, of } from 'rxjs';
import { LabApi } from '../api/lab-api.service';
import { pollJob } from './poll-job';

describe('pollJob', () => {
  it('emits a terminal job from the lab client', async () => {
    const lab = { job: () => of({ status: 'SUCCEEDED' }) } as Pick<LabApi, 'job'>;

    const job = await firstValueFrom(pollJob(lab, 'job-id'));

    expect(job.status).toBe('SUCCEEDED');
  });
});
