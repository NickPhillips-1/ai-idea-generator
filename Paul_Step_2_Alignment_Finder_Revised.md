# Founders Lab — Paul Step 2: AI Alignment Finder

## Purpose
Identify meaningful connections among the genuine interests of Paul, Nick, and Zach, using their actual questionnaire answers. This component discovers founder alignments; it does **not** assess market attractiveness, customer demand, or commercial potential. Those belong to later research and Zach's work.

## Approved rules
1. **At least two founders:** An alignment must involve two or all three founders. Three-founder connections should be visibly marked, but not given an artificial priority over two-founder connections.
2. **Genuine interests only:** Base alignment on interests explicitly confirmed in questionnaire responses. Do not score skills, professional experience, or expertise as interests. Do not infer enthusiasm merely from exposure or experience.
3. **Types of connections:**
   - Direct: founders explicitly share a specific interest.
   - Complementary: distinct expressed interests have a clear, defensible connection.
   - Exploratory: a less obvious but still well-supported connection worth discussing; clearly label its tentative nature.
4. **Specificity:** Favor specific and cross-disciplinary connections. Avoid generic pairings such as “health + technology” without a precise explanation anchored in the founders' answers.
5. **Quality threshold:** Include strong and moderate connections, and weaker connections only if their rationale is genuinely defensible. Exclude extremely weak, arbitrary, or forced matches. Do **not** rank founder interests by market potential or use a numerical commercial score at this stage.
6. **Novel discovery:** AI may surface connections the founders did not explicitly recognize, but must not invent interests or questionnaire evidence.
7. **Scope:** The main alignment view shows connections involving at least two founders. A separate optional inventory of solo interests may be retained for reference, but must not be labeled an alignment or mixed into the main results.
8. **Human judgment:** Founders decide what to explore; AI does not automatically advance directions based on an alignment.

## Required output for each alignment
- Stable alignment ID and current status.
- Founders involved (two or three), with a visible three-founder indicator where relevant.
- Connection type: direct, complementary, or exploratory.
- Specific interests contributed by each founder.
- Exact questionnaire answer references (stable question/answer identifiers, with short supporting excerpts or links to original answers).
- Concise but substantive explanation of **why** the interests connect, distinguishing direct statements from AI interpretation.
- A few possible research areas or questions for later discussion, explicitly labeled as **possibilities**, not product ideas or validated opportunities.
- Clear uncertainty note when a connection is tentative.
- Founder discussion notes and review decisions, stored separately from generated text.

## Automatic update behavior
- When a founder changes a questionnaire answer, automatically trigger a fresh alignment analysis **after the change is saved**. Avoid redundant runs for unrelated edits or unchanged answers; debounce or queue rapid edits where appropriate.
- Compare results with existing alignments using stable identities and supporting-answer references. Mark connections as **new**, **updated**, **unchanged**, or **no longer supported**.
- Preserve historical versions, previous supporting evidence, founder comments, and decisions. Never silently delete or overwrite them.
- Do not duplicate existing connections when reanalyzing.
- Display current results while an update is pending; make failures and stale analyses visible, with a safe retry path.
- Do not rewrite original questionnaire responses or alter production data without explicit approval.
- Any paid AI calls, new services, or changes to live integration require the team's agreed approval process; estimate usage and cost before implementation.

## Boundaries and handoffs — shared review, distinct ownership
- **Paul leads alignment quality:** Defines genuine-interest rules, meaningful connection examples, evidence requirements, readable output, and acceptance tests. Paul approves whether alignment results reflect founder responses faithfully.
- **Nick leads technical implementation:** Defines and reviews stable IDs, schemas, answer references, automatic reanalysis triggers, persistence/history, GitHub workflow, integration tests, performance, AI-call limits, security, and deployments. Nick and Paul agree on the data contract before implementation.
- **Zach is involved before implementation and at output review:** Reviews the proposed alignment output format and sample cases with Paul and Nick so results can feed the next research/market-gap stages. Flags connections that are too vague to support a specific research question; advises on useful downstream data fields and evidence handoffs. Reviews the actual dashboard outputs for clarity and downstream usefulness. Zach **does not** reject an otherwise valid interest alignment because an industry seems commercially weak.
- **Joint checkpoint (Paul + Zach + Nick):** Approve one sample questionnaire → sourced alignment → candidate research question handoff before integrating it. Paul checks interest fidelity; Zach checks downstream question quality and commercial-evaluation readiness; Nick checks schema, data integrity, technical feasibility, and safe integration. All three can request revisions.
- **After handoff:** Reviewed alignments may inform research directions through AI proposals, founder proposals, and external clues. Nick's evidence pipeline supplies sourced findings; Zach leads evaluation of customer needs, competitor alternatives, feasibility, and commercial potential. An alignment alone is **not** a validated business opportunity.

## Scoring: distinguish alignment quality from opportunity potential
**Two separate stages, not a single combined score:**

1. **Alignment Finder (this specification):** Use descriptive labels such as *direct / complementary / exploratory* and *strong / moderate / defensible but tentative*, with supporting answer references. These are evidence/clarity descriptions, **not** numerical rankings of founders or interest areas. Do not use sales estimates, market size, or profitability to suppress an alignment.
2. **Downstream market/product evaluation (Zach leads; separate module):** Support configurable, weighted scoring **only after research evidence exists**. The example below is a discussion starting point suggested in response to Nick's feedback, **not approved weights or proven measurements**:

   | Example criterion | Illustrative weight | What would count as evidence |
   | --- | ---: | --- |
   | Customer demand | 30% | Specific buyer pain, frequency, purchase behavior, interviews or credible demand signals |
   | Product–market fit hypothesis | 40% | Evidence that a *specific proposed product* meets a defined buyer need better than alternatives; not a claim of established fit |
   | Physical/technical and economic feasibility | 20% | Prototype path, supplier quotes, projected unit economics, safety constraints |
   | Differentiation | 10% | Competitor comparison and defensible improvement |
   | **Total** | **100%** | |

   - Zach proposes and owns the final criteria, evidence thresholds, and weights with team review; Nick implements configurable fields and validation, and Paul tests AI/output quality. Do not hard-code this illustrative example without approval.
   - A criterion marked **unknown / insufficient evidence** stays unknown, not zero. Clearly show evidence quality and assumptions beside any score. Do not calculate a definitive overall score when major categories are missing; show a provisional assessment or request more evidence.
   - Avoid double-counting: customer demand concerns evidence that buyers have and act on a problem; the product–market-fit *hypothesis* concerns whether the proposed solution is likely to satisfy it. True product–market fit requires real market testing.
   - Each scored claim must link to source evidence; preserve raw evidence separately from AI judgment. A numerical result does not override founder review or validation gates.

## Repository documentation and context reuse
Before proposing code changes, Claude Code / Codex should inspect the **current `main` branch** for relevant documentation and cite exact file paths/sections in their plan, instead of restating or duplicating existing standards. In the prior repository screenshots, the following paths were visible; **verify their existence and current content rather than assuming they remain unchanged**:

- `docs/ai/EVALUATION_CRITERIA.md` — check for existing evaluation/scoring criteria; reuse or reconcile with Zach's downstream weighted framework rather than introduce competing standards.
- `docs/ai/RESEARCH_PIPELINE.md` — check for research evidence, source provenance, and downstream handoff rules.
- `docs/architecture/CURRENT_STATE.md` — check the current app architecture and integration assumptions if this file still exists.

Also search for the current questionnaire documentation, any shared schemas/contracts, and the repo's contribution/CI guidance. If a referenced document is missing or contradictory, **flag the gap and ask the respective owner** instead of fabricating its content. Refer to existing docs with relative Markdown links only after verifying actual paths. Keep this spec focused on what differs from those shared sources, to save context and implementation tokens.

## Acceptance tests
1. Two founders name the same specific interest → one direct alignment with exact supporting answer references.
2. Two founders name distinct but plausibly complementary interests → a clearly explained complementary alignment, with each founder's original interest preserved.
3. A vague shared category without a meaningful specific link → excluded or clearly flagged for human review, not presented as strong.
4. An apparent interest inferred solely from a founder's job or skills → excluded.
5. An AI-suggested novel connection → allowed only with citations to both founders' actual answers and a defensible explanation.
6. Three founders share an interest → visible three-founder alignment, without artificially outranking two-founder results.
7. Questionnaire answer changes → affected alignments refresh automatically; unchanged alignments remain stable; removed support is archived, not deleted.
8. Existing comments, review decisions, original answers, and historical alignment versions survive refreshes.
9. Repeated analyses of unchanged answers do not create duplicates or unnecessary paid calls.
10. Failed analysis does not erase current results and visibly indicates the need to retry.
11. Zach reviews sample alignment outputs and confirms they can feed specific research questions without distorting the founders' interests; Nick confirms handoff schema and technical compatibility.
12. An alignment is preserved even when Zach's later commercial assessment is weak; downstream evaluations are linked but not conflated with alignment ratings.
13. If downstream weighted scoring is implemented, criteria and weights are configurable, sum to 100%, show source evidence and unknowns, and do not invent scores for missing data.
14. Existing repository docs are inspected and linked by verified paths; conflicting or absent rules are documented rather than silently overridden.

## First implementation request for Claude Code
Inspect the existing questionnaire, alignment logic, dashboard, data model, and update triggers **without modifying anything first**. Compare current behavior with this specification. Propose a minimal, staged implementation plan, example input/output records, test cases, estimated AI usage/cost, and any questions about existing IDs or data formats. Have Nick review schema and integration changes and Zach review output and downstream handoff quality before coding. Implement on a separate branch with tests and a reviewed pull request. Preserve the live website, authentication, synchronization, and all existing founder records.

## Proposed GitHub change workflow
- Create a **fresh branch from current `main`** for this specification revision, for example `paul/alignment-finder-feedback`. Do not amend the old PR or merge directly into `main` unless Nick explicitly requests that workflow.
- Add or edit this document at `docs/ai/Paul_Step_2_Alignment_Finder.md` only after checking whether it already exists on `main`; avoid duplicate copies in the same location.
- Submit a pull request to `main` describing the three feedback changes: separate weighted downstream scoring, verified links to existing docs, and Zach's explicit quality/technical handoff role. Request Nick and Zach to review.
