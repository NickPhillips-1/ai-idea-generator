namespace Founders

inductive Status where
  | pending
  | running
  | succeeded
  | failed
  | cancelled
  deriving DecidableEq, Repr

def retryAfterFailure (attemptCount : Nat) : Status :=
  match attemptCount with
  | 0 => .pending
  | 1 => .pending
  | 2 => .pending
  | _ => .failed

def hasRetryEdge (status : Status) : Bool :=
  match status with
  | .pending => true
  | .running => true
  | .succeeded => false
  | .failed => false
  | .cancelled => false

theorem retryBelowLimit (n : Nat) (h : n < 3) : retryAfterFailure n = .pending := by
  match n, h with
  | 0, _ => rfl
  | 1, _ => rfl
  | 2, _ => rfl
  | n + 3, h => nomatch h

theorem thirdFailureIsFailed (n : Nat) (h : 3 ≤ n) : retryAfterFailure n = .failed := by
  match n, h with
  | 0, h => nomatch h
  | 1, h => nomatch h
  | 2, h => nomatch h
  | _ + 3, _ => rfl

theorem terminalsHaveNoRetryEdge :
    hasRetryEdge .succeeded = false ∧
    hasRetryEdge .failed = false ∧
    hasRetryEdge .cancelled = false := by
  decide

end Founders
