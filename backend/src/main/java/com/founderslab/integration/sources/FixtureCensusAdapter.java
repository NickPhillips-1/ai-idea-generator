package com.founderslab.integration.sources;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Component
@Primary
@ConditionalOnProperty(name = "founderslab.e2e.fixtures", havingValue = "true")
public class FixtureCensusAdapter implements ResearchSourceAdapter {

    @Override
    public ResearchData collect(ResearchRequest request) {
        String payload = "[[\"NAME\",\"ESTAB\"],[\"California\",\"100\"]]";
        return new ResearchData(
                "https://api.census.gov/data/2022/cbp?get=NAME,ESTAB&for=state:06&NAICS2017=31-33",
                payload,
                "fixture-census"
        );
    }
}
