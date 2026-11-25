# Evidence Bar and Evaluation Criteria

**Status:** Proposed first draft

## 1. Purpose and scope

The purpose of this rubric is to establish a consistent process for researching and evaluating physical-product business opportunities. The agent should identify genuine customer problems, investigate existing solutions, assess manufacturing feasibility, and gather evidence of commercial potential.

The objective is not to maximize the number of ideas generated, but to identify opportunities that warrant further investment of time and resources. The agent provides research and analysis; founders retain decision-making authority.

## 2. Evidence standards

Every research finding must distinguish between:

- **Fact (`factual_summary`, `supporting_evidence`):** Information directly supported by an identified source, including its `original_reference` and `retrieved_at`.
- **Interpretation (`ai_interpretation`):** A conclusion, estimate, or hypothesis derived from available information.
- **Unknown (`unknowns`):** Information that available evidence cannot establish.

Evidence must be relevant to the specific claim, sufficiently current for its purpose, and traceable to its original source. The agent should seek independent corroboration when practical and report conflicting evidence, sample limitations, and potential bias. Repeated copies of the same underlying source do not constitute independent evidence.

### Evidence hierarchy

| Evidence type | Examples | Appropriate use |
|---|---|---|
| Direct commercial evidence | Purchases, paid pilots, orders, actual supplier quotations | Establish observed commercial behavior or quoted costs within their scope |
| Direct customer evidence | Interviews, documented workflows, customer complaints | Establish reported problems and preferences |
| Indirect evidence | Product reviews, industry surveys, competitor listings | Identify patterns and support further investigation |
| Contextual evidence | Census counts, industry classifications, geography | Describe market structure, not demand |
| Speculation | Unsourced estimates, AI-generated assumptions | Generate hypotheses only |

Evidence strength depends on the claim being evaluated. For example, a supplier quotation may be strong evidence of quoted manufacturing cost but says nothing about customer demand.

Only a founder may change `verification_status` from `UNREVIEWED` to `CONFIRMED` or `REJECTED` after checking the citation. Confirmation establishes that the factual summary matches the source; it does not establish that the source is representative or that the AI interpretation is correct. New or refreshed findings and rewritten interpretations remain or return to `UNREVIEWED`. Confidence scores do not substitute for verification.

### Current research limitations

US Census County Business Patterns is the only authorized research source for the current milestone. Interviews, product reviews, supplier quotations, competitor teardowns, and other sources described below are proposed future inputs and must not be collected automatically until authorized. Do not scrape the web to fill current evidence gaps.

Every Census finding must include the following in `unknowns`:

> US Census County Business Patterns (https://api.census.gov/data/, adapter CensusCountyBusinessPatternsAdapter) reports establishment structure for a geography and NAICS code. It can support statements like how many establishments were published for that category. It cannot support willingness to pay, a specific customer problem, manufacturing feasibility, unit cost, differentiation, or that a buyer wants a new product. Those remain unknowns until another authorized source exists.

## 3. Customer problem

**Objective:** Establish whether an identifiable customer segment experiences a problem worth solving.

The agent should investigate:

- Who experiences the problem and under what circumstances.
- How frequently the problem occurs and how severe its consequences are.
- Time, money, effort, or convenience lost because of the problem.
- Existing products, manual workarounds, and spending used to address it.
- Whether customers are dissatisfied with current solutions.
- Who uses the product and who makes the purchasing decision.

**Acceptable evidence:** Authorized customer interviews, documented workflows, credible surveys, customer complaints, and records of existing workarounds or expenditures.

**Evidence bar:** Identify a specific customer segment, document an actual problem, and establish a meaningful consequence or incentive to solve it. Seek corroboration from independent customers or other relevant evidence; a single anecdote may identify a lead but does not establish widespread demand.

**Blocks ADVANCE:** The problem is inferred solely from establishment counts, general assumptions, or AI speculation; or its significance remains unsupported.

## 4. Market structure and demand

**Objective:** Determine who could purchase the product and whether there is evidence that they would do so.

The agent should investigate:

- Target customer segment, geography, and relevant industry classifications.
- Number of potential customer establishments or individuals, with units clearly identified.
- Relevant purchasing behavior, existing expenditures, and demand indicators.
- The portion of the market that could realistically be served through available distribution channels.
- Relevant market trends, seasonality, and limitations in available data.

**Acceptable evidence:** Authorized Census data for establishment structure; future authorized industry reports, customer research, purchasing records, and sales data for demand-related claims.

**Evidence bar:** Establish a sourced market structure and separate evidence of customer demand. Market size estimates must state assumptions, geography, period, and units. Evidence of demand for an existing product category must not be represented as proven demand for the proposed product.

**Blocks ADVANCE:** Establishment counts are treated as demand; market estimates are unsupported; material demand assumptions remain untested; or unreviewed Census findings are treated as confirmed.

## 5. Competition

**Objective:** Understand how customers currently solve the problem and what alternatives the proposed product would face.

The agent should investigate:

- Direct competitors selling comparable products.
- Indirect competitors, substitute products, manual workarounds, and the option of doing nothing.
- Product functionality, pricing, availability, and target customers.
- Recurring customer complaints and documented limitations of existing solutions.
- Relevant barriers to entry, distribution advantages, and established customer relationships.

**Acceptable evidence:** Future authorized competitor catalogs, product specifications, documented teardowns, pricing records, customer reviews, and interviews.

**Evidence bar:** Identify and document relevant existing alternatives and compare their capabilities and limitations against the customer problem. If no competitors are found, document the search scope and limitations rather than claiming that competition does not exist.

**Blocks ADVANCE:** Competition is unknown, alternatives are unsupported, or the opportunity depends on an unverified assumption that no adequate solution exists.

## 6. Differentiation

**Objective:** Establish a credible reason customers would choose the proposed product over existing alternatives.

The agent should investigate:

- Improvements in functionality, reliability, durability, usability, or convenience.
- Potential reductions in customer cost, time, or effort.
- Whether the proposed improvement addresses a documented customer need.
- Tradeoffs, switching costs, and ease of imitation.
- Whether customers value the proposed improvement enough to change their purchasing behavior.

**Acceptable evidence:** Future authorized customer interviews, comparative product testing, documented competitor limitations, prototype feedback, and purchasing behavior.

**Evidence bar:** Identify at least one specific, meaningful advantage over a relevant alternative and connect it to sourced customer needs or buyer comparisons. Untested product advantages must remain hypotheses until supported. A unique feature alone is not proof of customer value.

**Blocks ADVANCE:** Differentiation is only an AI interpretation, depends on unsupported performance claims, or lacks a sourced reason for customers to prefer the product.

## 7. Technical feasibility and manufacturing

**Objective:** Determine whether the proposed product can realistically be developed and manufactured within the founders' resources.

The agent should investigate:

- Required materials, components, manufacturing processes, and assembly methods.
- Technical complexity, equipment, expertise, and prototype requirements.
- Supplier availability, minimum order quantities, tooling, and production lead times.
- Relevant safety, regulatory, testing, and certification requirements.
- Quality control, maintenance, reliability, and production scalability.

**Acceptable evidence:** Future authorized manufacturer specifications, supplier quotations, engineering documentation, regulatory guidance, expert assessments, and prototype test results.

**Evidence bar:** Establish a credible, sourced manufacturing path with identified materials, processes, constraints, and major technical risks. Identify unresolved engineering questions and the resources required to resolve them. A finished prototype is not automatically required for preliminary advancement, but critical feasibility claims must have supporting evidence.

**Blocks ADVANCE:** No credible manufacturing path exists; critical technical or safety requirements remain unknown; or required resources demonstrably exceed agreed founder constraints without a viable alternative.

## 8. Pricing and cost

**Objective:** Establish whether the product could be sold at a price that customers will accept while covering its costs.

The agent should investigate:

- Comparable product prices and evidence of customer willingness to pay.
- Materials, components, labor, assembly, packaging, and manufacturing costs.
- Tooling, prototyping, certification, and other startup costs.
- Shipping, fulfillment, sales fees, returns, warranty, and customer acquisition costs where applicable.
- Expected selling price, contribution margin, and break-even sales volume.

**Acceptable evidence:** Future authorized supplier quotations, manufacturer pricing, competitor listings, actual purchasing records, customer pricing research, and documented cost estimates.

**Evidence bar:** Attach sources to material price and cost claims. Distinguish quoted costs from estimates, and listed competitor prices from actual willingness to pay for the proposed product. State production quantity, currency, date, and assumptions where relevant. Calculate a preliminary cost model using conservative and optimistic scenarios when inputs permit.

Useful calculations:

- Contribution per unit = net selling price minus variable cost per unit.
- Contribution margin = contribution per unit divided by net selling price.
- Break-even units = fixed costs divided by contribution per unit, rounded up, when contribution is positive.

The `estimated_costs` field on `product_concept` remains a collection of notes until sources are attached. Calculated projections are not observed financial results.

**Blocks ADVANCE:** Material cost or price claims have no attached source; no credible path to positive contribution exists; or major cost categories remain unresolved to the extent that profitability cannot reasonably be assessed.

## 9. Commercial viability

**Objective:** Determine whether the combined evidence justifies further investment in the opportunity.

Commercial viability is not a separate numerical model score. The agent should summarize the evidence across all preceding categories, identify material risks, present contrary evidence, and identify the next validation steps.

Before an opportunity advances, founders should be able to establish that:

- A genuine and meaningful customer problem exists.
- A reachable target market and credible demand indicators exist.
- Relevant alternatives have been investigated.
- A meaningful reason for customer preference is supported.
- A credible manufacturing path exists.
- Sourced pricing and cost information supports a plausible path to profitability.
- Remaining risks are identified and compatible with agreed founder constraints.

The founders must separately agree on capital limits, acceptable financial risk, target margins, available resources, and other business-specific thresholds. Until agreed, the agent must not invent these limits or claim they have been met.

## 10. Decision framework

Only founders record decisions. Decisions are append-only `founder_decision` records; subsequent decisions do not overwrite earlier ones.

| Decision | Meaning |
|---|---|
| `ADVANCE` | All mandatory evidence requirements are met and a founder judges further investment justified. |
| `INVESTIGATE` | Required evidence is missing or inconclusive; the opportunity remains open. |
| `REDESIGN` | A founder determines that the product concept should change to address identified limitations. |
| `ARCHIVE` | A founder determines that the opportunity should no longer be pursued. |

An opportunity cannot advance while any mandatory evidence requirement remains unmet. Missing evidence is not proof that an opportunity is bad. When Census is the only source, `INVESTIGATE` is the appropriate outcome for an opportunity that remains under consideration.

Phase 6 implements the founder decision endpoint (`POST /api/v1/opportunities/{id}/decisions`). Facts, interpretations, unknowns, and founder verification status must be displayed separately before ADVANCE is available, consistent with the existing project requirements.

## 11. Required research output

For each opportunity, the agent should provide:

- Proposed product and target customer segment.
- Research findings organized by evaluation category.
- Source references and retrieval dates for factual claims.
- Clearly separated interpretations and unknowns.
- Supporting and contradictory evidence.
- Unmet evidence requirements and suggested next research steps.
- Preliminary financial calculations where sufficient inputs exist, with assumptions identified.

The agent must not fabricate citations, disguise assumptions as facts, treat absence of evidence as proof of absence, or make founder decisions.

## 12. Review and refinement

This rubric is an initial proposal. The founders should test it against several physical-product opportunities, including promising, weak, and insufficiently researched examples. Revise criteria that are ambiguous, impractical, or fail to distinguish supported opportunities from speculation. Any changes to authorized sources or founder-specific thresholds require team agreement.
