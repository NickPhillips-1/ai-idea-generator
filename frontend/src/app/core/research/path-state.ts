const ALIGNMENT = 'founderslab.alignmentId';
const DIRECTION = 'founderslab.directionId';
const JOB = 'founderslab.jobId';
const OPPORTUNITY = 'founderslab.opportunityId';

export const pathState = {
  alignmentId: () => sessionStorage.getItem(ALIGNMENT),
  setAlignmentId: (id: string) => sessionStorage.setItem(ALIGNMENT, id),
  directionId: () => sessionStorage.getItem(DIRECTION),
  setDirectionId: (id: string) => sessionStorage.setItem(DIRECTION, id),
  jobId: () => sessionStorage.getItem(JOB),
  setJobId: (id: string) => sessionStorage.setItem(JOB, id),
  opportunityId: () => sessionStorage.getItem(OPPORTUNITY),
  setOpportunityId: (id: string) => sessionStorage.setItem(OPPORTUNITY, id),
};
