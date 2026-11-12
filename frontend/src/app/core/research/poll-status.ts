export function shouldPoll(status: string | undefined): boolean {
  return status === 'PENDING' || status === 'RUNNING';
}
