------------------------------ MODULE ResearchJob ------------------------------
\* One direction. One TLC step is one transaction in ResearchService.start,
\* ResearchWorker.claim, or ResearchWorker.execute, or a cancel.
\* execute passes the RUNNING check (PassCheck) and later writes the outcome
\* (FinishSuccess or FinishFailure) without reading status again.
EXTENDS Integers, FiniteSets

CONSTANTS Keys, Workers, MaxAttempts

VARIABLES present, status, attempts, published, phase, cancelled, holder, attemptsAtCancel

vars == <<present, status, attempts, published, phase, cancelled, holder, attemptsAtCancel>>

Status == {"ABSENT", "PENDING", "RUNNING", "SUCCEEDED", "FAILED", "CANCELLED"}

TypeOK ==
  /\ present \in [Keys -> BOOLEAN]
  /\ status \in [Keys -> Status]
  /\ attempts \in [Keys -> 0..MaxAttempts]
  /\ published \in [Keys -> BOOLEAN]
  /\ phase \in [Keys -> {"idle", "checked"}]
  /\ cancelled \in [Keys -> BOOLEAN]
  /\ holder \in [Workers -> Keys \cup {"none"}]
  /\ attemptsAtCancel \in [Keys -> -1..MaxAttempts]

Init ==
  /\ present = [k \in Keys |-> FALSE]
  /\ status = [k \in Keys |-> "ABSENT"]
  /\ attempts = [k \in Keys |-> 0]
  /\ published = [k \in Keys |-> FALSE]
  /\ phase = [k \in Keys |-> "idle"]
  /\ cancelled = [k \in Keys |-> FALSE]
  /\ holder = [w \in Workers |-> "none"]
  /\ attemptsAtCancel = [k \in Keys |-> -1]

RunningKeys == {k \in Keys : status[k] = "RUNNING"}

Start(k) ==
  \/ /\ present[k]
     /\ UNCHANGED vars
  \/ /\ ~present[k]
     /\ RunningKeys = {}
     /\ present' = [present EXCEPT ![k] = TRUE]
     /\ status' = [status EXCEPT ![k] = "PENDING"]
     /\ UNCHANGED <<attempts, published, phase, cancelled, holder, attemptsAtCancel>>
  \/ /\ ~present[k]
     /\ RunningKeys # {}
     /\ UNCHANGED vars

Claim(w) ==
  /\ holder[w] = "none"
  /\ RunningKeys = {} \* CLAIM_ONE_RUNNING
  /\ \E k \in Keys :
       /\ status[k] = "PENDING"
       /\ attempts[k] < MaxAttempts
       /\ \A other \in Workers : holder[other] # k
       /\ holder' = [holder EXCEPT ![w] = k]
       /\ status' = [status EXCEPT ![k] = "RUNNING"]
       /\ attempts' = [attempts EXCEPT ![k] = attempts[k] + 1]
       /\ UNCHANGED <<present, published, phase, cancelled, attemptsAtCancel>>

PassCheck(w) ==
  /\ holder[w] \in Keys
  /\ phase[holder[w]] = "idle"
  /\ status[holder[w]] = "RUNNING"
  /\ phase' = [phase EXCEPT ![holder[w]] = "checked"]
  /\ UNCHANGED <<present, status, attempts, published, cancelled, holder, attemptsAtCancel>>

Abandon(w) ==
  /\ holder[w] \in Keys
  /\ phase[holder[w]] = "idle"
  /\ status[holder[w]] # "RUNNING"
  /\ holder' = [holder EXCEPT ![w] = "none"]
  /\ UNCHANGED <<present, status, attempts, published, phase, cancelled, attemptsAtCancel>>

FinishSuccess(w) ==
  /\ holder[w] \in Keys
  /\ phase[holder[w]] = "checked"
  /\ published' = [published EXCEPT ![holder[w]] = TRUE]
  /\ status' = [status EXCEPT ![holder[w]] = "SUCCEEDED"]
  /\ phase' = [phase EXCEPT ![holder[w]] = "idle"]
  /\ holder' = [holder EXCEPT ![w] = "none"]
  /\ UNCHANGED <<present, attempts, cancelled, attemptsAtCancel>>

FinishFailure(w) ==
  /\ holder[w] \in Keys
  /\ phase[holder[w]] = "checked"
  /\ status' = [status EXCEPT ![holder[w]] =
       IF attempts[holder[w]] >= MaxAttempts THEN "FAILED" ELSE "PENDING"]
  /\ phase' = [phase EXCEPT ![holder[w]] = "idle"]
  /\ holder' = [holder EXCEPT ![w] = "none"]
  /\ UNCHANGED <<present, attempts, published, cancelled, attemptsAtCancel>>

Cancel(k) ==
  /\ present[k]
  /\ status[k] \in {"PENDING", "RUNNING"}
  /\ status' = [status EXCEPT ![k] = "CANCELLED"]
  /\ cancelled' = [cancelled EXCEPT ![k] = TRUE]
  /\ attemptsAtCancel' = [attemptsAtCancel EXCEPT ![k] = attempts[k]]
  /\ UNCHANGED <<present, attempts, published, phase, holder>>

Next ==
  \/ \E k \in Keys : Start(k)
  \/ \E w \in Workers : Claim(w)
  \/ \E w \in Workers : PassCheck(w)
  \/ \E w \in Workers : Abandon(w)
  \/ \E w \in Workers : FinishSuccess(w)
  \/ \E w \in Workers : FinishFailure(w)
  \/ \E k \in Keys : Cancel(k)

Spec == Init /\ [][Next]_vars

OneJobPerKey ==
  \A k \in Keys : present[k] <=> status[k] # "ABSENT"

AtMostOneRunning ==
  Cardinality(RunningKeys) <= 1

NotClaimedWhenCancelled ==
  \A k \in Keys : status[k] = "CANCELLED" => attempts[k] = attemptsAtCancel[k]

OneWorkerPerJob ==
  \A w1, w2 \in Workers : holder[w1] \in Keys /\ holder[w1] = holder[w2] => w1 = w2

AttemptBound ==
  \A k \in Keys :
    /\ attempts[k] <= MaxAttempts
    /\ (status[k] = "FAILED" => attempts[k] = MaxAttempts)
    /\ (status[k] = "PENDING" => attempts[k] < MaxAttempts)
    /\ (status[k] \in {"RUNNING", "SUCCEEDED", "FAILED"} => attempts[k] >= 1)

\* Documented race control. FinishSuccess does not re-read status, so TLC finds
\* a counterexample. Do not delete this invariant to make the run pass.
CancelDoesNotPublish ==
  \A k \in Keys : cancelled[k] => ~published[k] /\ status[k] # "SUCCEEDED"

=============================================================================
