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
5. **Quality threshold:** Include strong and moderate connections, and weaker connections only if their rationale is genuinely defensible. Exclude extremely weak, arbitrary, or forced matches. No numerical ranking system is required.
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

## Boundaries and handoffs
- **Paul owns:** Alignment meaning, relevance, evidence requirements, output quality, and acceptance tests.
- **Nick owns:** Data contracts, technical implementation/integration standards, GitHub review workflow, safe deployment, and production protections.
- **Zach owns:** Market-gap investigation, commercial evidence, competitor/customer analysis, and product evaluation.
- The next stage may use reviewed alignments to create research directions through three paths: AI proposals, founder proposals, and external clues. Do not treat an alignment as a business opportunity.

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

## First implementation request for Claude Code
Inspect the existing questionnaire, alignment logic, dashboard, data model, and update triggers **without modifying anything first**. Compare current behavior with this specification. Propose a minimal, staged implementation plan, example input/output records, test cases, estimated AI usage/cost, and any questions about existing IDs or data formats. Have Nick review schema and integration changes before coding. Implement on a separate branch with tests and a reviewed pull request. Preserve the live website, authentication, synchronization, and all existing founder records.
