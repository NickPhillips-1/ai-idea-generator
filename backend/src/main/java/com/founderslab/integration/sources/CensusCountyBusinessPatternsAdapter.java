package com.founderslab.integration.sources;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@Component
public class CensusCountyBusinessPatternsAdapter implements ResearchSourceAdapter {

    public static final String CENSUS_LIMIT =
            "US Census County Business Patterns reports establishment structure for a geography and NAICS code. "
                    + "It cannot support willingness to pay, a specific customer problem, manufacturing feasibility, "
                    + "unit cost, differentiation, or that a buyer wants a new product.";

    private final RestClient restClient;
    private final String apiKey;

    public CensusCountyBusinessPatternsAdapter(@Value("${CENSUS_API_KEY:}") String apiKey) {
        this.restClient = RestClient.create();
        this.apiKey = apiKey == null ? "" : apiKey;
    }

    @Override
    public ResearchData collect(ResearchRequest request) {
        if (apiKey.isBlank()) {
            throw new IllegalStateException("CENSUS_API_KEY is not configured.");
        }
        if (request.baseUrl() == null || !request.baseUrl().startsWith("https://api.census.gov/")) {
            throw new IllegalArgumentException("Census requests must use the catalogued Census host.");
        }
        String reference = request.baseUrl() + request.year() + "/cbp?get=NAME,ESTAB&for=state:"
                + request.state() + "&NAICS2017=" + request.naics();
        URI uri = URI.create(reference + "&key=" + apiKey);
        String payload = restClient.get().uri(uri).retrieve().body(String.class);
        if (payload == null || payload.isBlank()) {
            throw new IllegalStateException("Census returned an empty payload.");
        }
        return new ResearchData(reference, payload, sha256(payload));
    }

    private static String sha256(String payload) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(payload.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }
}
