package com.founderslab.integration.sources;

public interface ResearchSourceAdapter {

    String CENSUS_LIMIT =
            "US Census County Business Patterns reports establishment structure for a geography and NAICS code. "
                    + "It cannot support willingness to pay, a specific customer problem, manufacturing feasibility, "
                    + "unit cost, differentiation, or that a buyer wants a new product.";

    ResearchData collect(ResearchRequest request);
}
