import fc from 'fast-check';
import { shouldPoll } from './poll-status';

describe('shouldPoll properties', () => {
  it('is true only for PENDING and RUNNING', () => {
    const statusName = fc.oneof(
      fc.constantFrom('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED'),
      fc.string(),
    );
    fc.assert(
      fc.property(statusName, (status) => {
        return shouldPoll(status) === (status === 'PENDING' || status === 'RUNNING');
      }),
    );
  });
});
