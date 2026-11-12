# Evaluation criteria

Zach owns this rubric. It is the bar the three founders use before any of them advances a physical-product opportunity. Paul owns whether the AI explanation is clear and does not smuggle interpretations into the factual summary. Nick owns that the database and API keep the fields separate.

Related documents:

- [RESEARCH_PIPELINE.md](RESEARCH_PIPELINE.md)
- [API_CONTRACTS.md](../api/API_CONTRACTS.md)
- [DATABASE_DESIGN.md](../architecture/DATABASE_DESIGN.md)
- [TEAM_WORKFLOW.md](../development/TEAM_WORKFLOW.md)
- [IMPLEMENTATION_PLAN.md](../development/IMPLEMENTATION_PLAN.md)

## Why this is an evidence path

The product goal is a repeatable evidence path. It is not to generate as many ideas as possible. A long list of concepts rewards volume. It does not tell a founder what a source actually said, what the model added, or what is still unknown. The same test applies to every opportunity: cite the source, separate the model's reading, name the gaps, and let a founder record the decision. ADVANCE is a claim that this bar was met. If the bar was not met, the honest record is INVESTIGATE.

Physical products are the default `business_type`: `PHYSICAL_PRODUCT`. `SERVICE`, `SOFTWARE`, and `OTHER` may be stored later on the same records. They do not require a new schema. This rubric is the ADVANCE bar for a physical-product opportunity. Storing another business type later does not relax the separation of fact, interpretation, and unknowns.

## Three layers on every research finding

Every `research_finding` has three layers. The UI must not collapse them into one paragraph, one card body, or one "summary" string. A founder who cannot see the split cannot tell a Census count from a model claim that a buyer wants a product.

| Layer | Fields | What it is |
| --- | --- | --- |
| What the source contains | `factual_summary`, `supporting_evidence` | Only what the cited `research_source` actually contains. `supporting_evidence` carries `original_reference` and `retrieved_at`. |
| The model's reading | `ai_interpretation` | The model's reading of that source. Not a fact. |
| What this source cannot establish | `unknowns` | Limits of this source. Gaps stay here until another authorized source exists. |

`factual_summary` restates the source. It does not add a customer problem, a demand claim, a competitor, a cost, or a reason the product would win. Those belong in `ai_interpretation` if the model offers them, or in `unknowns` if the source cannot establish them. Paul rejects an explanation that puts the model's reading inside `factual_summary`. Nick rejects a schema or API payload that merges the three layers into one text column or one response field.

`verification_status` is `UNREVIEWED` until a founder sets `CONFIRMED` or `REJECTED`. The model must not set it. Creating a finding, refreshing a source, or rewriting an interpretation leaves the status `UNREVIEWED`. There is no confidence score column. A confidence number must not be treated as verification. A model score, a "high confidence" label, or a probability is not `CONFIRMED` and must not be stored or shown as a substitute for `verification_status`.

A founder sets `CONFIRMED` only after checking the citation: the `factual_summary` matches the `research_source` at `original_reference`, and `retrieved_at` says when that copy was retrieved. `CONFIRMED` means the factual layer matches the source. It does not promote `ai_interpretation` into fact, and it does not close items listed in `unknowns`. `REJECTED` means the founder judged that the factual layer does not match the source.

## Census County Business Patterns

The first authorized source is US Census County Business Patterns, `https://api.census.gov/data/`, adapter `CensusCountyBusinessPatternsAdapter`. It reports establishment structure for a geography and a NAICS code. A factual summary may say how many establishments were published for that category, along with the other fields the payload actually published, with `original_reference` and `retrieved_at`.

Every Census finding's `unknowns` must include this limitation:

> US Census County Business Patterns (https://api.census.gov/data/, adapter CensusCountyBusinessPatternsAdapter) reports establishment structure for a geography and NAICS code. It can support statements like how many establishments were published for that category. It cannot support willingness to pay, a specific customer problem, manufacturing feasibility, unit cost, differentiation, or that a buyer wants a new product. Those remain unknowns until another authorized source exists.

That paragraph lives in `unknowns` on the finding. A general disclaimer elsewhere on the page does not satisfy it. Do not scrape the web to fill the gap in this milestone. Interviews and competitor teardowns are future authorized inputs. They are not this adapter, and they are not a reason to invent citations now.

## Rubric

Zach owns the sections below. For each one: what counts as evidence, what is only an interpretation, and what blocks ADVANCE.

### Customer problem

Evidence is a described pain tied to a real customer segment, in a source that actually contains that description. The `factual_summary` says what that source said about the pain and the segment. `supporting_evidence` cites it with `original_reference` and `retrieved_at`. A founder may set `verification_status` to `CONFIRMED` after checking that citation.

Census data does not satisfy this. Establishment counts and NAICS labels do not name a pain or a buyer. An `ai_interpretation` that invents a pain from those counts is the model's reading, not evidence.

ADVANCE is blocked while customer problem is only an AI interpretation.

### Market structure

Evidence is establishment counts and other published Census fields. After a founder checks the citation, those statements may be `CONFIRMED` as market-structure facts. The factual summary stays inside the payload: geography, NAICS, the published counts, and the other published fields, plus `original_reference` and `retrieved_at`.

They are not demand. Reading a count as willingness to pay, as a customer problem, or as proof that a buyer wants a new product is an interpretation. That reading goes in `ai_interpretation` or stays in `unknowns`. It is not promoted by confirming the count.

ADVANCE is blocked if market-structure facts are offered as demand, or if the Census factual layer is still `UNREVIEWED` and the decision treats it as confirmed. Confirmed market structure alone does not clear the customer-problem block.

### Competition

Evidence is named alternatives, what they sell, and how they differ, from an authorized source that contains those statements, cited with `original_reference` and `retrieved_at`.

That content is not in the Census payload. Competition is unknown until a later source exists. A model list of competitors with no `supporting_evidence` is an interpretation. Competitor teardowns are a future authorized input. They are not available from `CensusCountyBusinessPatternsAdapter`, and this milestone does not scrape the web to supply them.

ADVANCE is blocked while competition is unknown or only an interpretation.

### Differentiation

Evidence is a sourced reason a buyer would choose this product over the named alternatives. The source has to contain that comparison or buyer statement. The factual summary quotes or restates that statement and cites it.

Until that evidence exists, differentiation is interpretation. A model sentence about why the product would win is `ai_interpretation`, not a fact. Census cannot support differentiation. That limit stays in `unknowns`.

ADVANCE is blocked while differentiation is interpretation.

### Technical feasibility and manufacturing

Evidence is materials, process, and constraints stated by an authorized source and cited with `original_reference` and `retrieved_at`.

Unknown in the first slice. Census establishment structure does not state materials, process, or manufacturing constraints. The model must not fill this from general knowledge and present it as `factual_summary`.

ADVANCE is blocked while technical feasibility and manufacturing are unknown.

### Pricing and cost

Evidence is a cost or price claim with a source attached: the `research_finding` cites the document that states the figure, with `original_reference` and `retrieved_at`, and the factual summary says only what that document states.

`estimated_costs` on `product_concept` are notes, not evidence, until a source is attached. A note, a model estimate, or a confidence number next to a cost is not verification and is not a confirmed cost.

ADVANCE is blocked while pricing and cost have no attached source.

### Commercial viability

Commercial viability is the combination of the sections above. It is not a separate model score. The model does not output ADVANCE, INVESTIGATE, REDESIGN, or ARCHIVE.

A founder decision is a human record: an append-only `founder_decision`. Later decisions append. They do not overwrite earlier ones. The allowed values are `ADVANCE`, `INVESTIGATE`, `REDESIGN`, and `ARCHIVE`.

- `ADVANCE` records that the founder judged this rubric met, including a customer problem that is not only an AI interpretation.
- `INVESTIGATE` records that required evidence is still missing and the opportunity stays open.
- `REDESIGN` records that the founder wants the `product_concept` changed. The model does not file that decision.
- `ARCHIVE` records that the founder stops the opportunity. The model does not file that decision.

ADVANCE is blocked while any section above still blocks it. A confirmed Census count does not make the combination commercially viable.

## Decision rule

`POST /api/v1/opportunities/{id}/decisions` is phase 6. The UI in that phase must show facts, interpretation, and unknowns before a founder can submit `ADVANCE`. The three layers of each `research_finding` are visible as separate regions, Census `unknowns` include the required limitation, and `verification_status` is the founder's mark rather than a model score. The ADVANCE control stays unavailable until that split is on screen.

`INVESTIGATE` is the honest outcome when Census is the only source. County Business Patterns can support a market-structure fact after a founder confirms the citation. It cannot establish the customer problem, competition, differentiation, manufacturing feasibility, unit cost, or that a buyer wants a new product. Submitting `ADVANCE` on that record would store a human judgment the evidence does not support.
