import { shouldPoll } from './poll-status';

describe('shouldPoll', () => {
  it('keeps polling while a job is pending or running', () => {
    expect(shouldPoll('PENDING')).toBe(true);
    expect(shouldPoll('RUNNING')).toBe(true);
  });

  it('stops polling on a terminal status', () => {
    expect(shouldPoll('SUCCEEDED')).toBe(false);
    expect(shouldPoll('FAILED')).toBe(false);
    expect(shouldPoll('CANCELLED')).toBe(false);
    expect(shouldPoll(undefined)).toBe(false);
  });
});
