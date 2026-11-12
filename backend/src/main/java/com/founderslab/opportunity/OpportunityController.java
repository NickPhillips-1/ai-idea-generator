package com.founderslab.opportunity;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
public class OpportunityController {

    private final OpportunityService opportunities;

    public OpportunityController(OpportunityService opportunities) {
        this.opportunities = opportunities;
    }

    @PostMapping("/api/v1/opportunities")
    @ResponseStatus(HttpStatus.CREATED)
    public OpportunityResponse create(@RequestBody CreateOpportunityRequest request) {
        Opportunity saved = opportunities.create(
                request.title(),
                request.customerProblem(),
                request.targetCustomer(),
                request.businessType(),
                request.evaluationSummary(),
                request.findingIds()
        );
        return OpportunityResponse.from(saved, opportunities.findingIds(saved.getId()));
    }

    @GetMapping("/api/v1/opportunities/{id}")
    public OpportunityResponse get(@PathVariable UUID id) {
        return OpportunityResponse.from(opportunities.get(id), opportunities.findingIds(id));
    }

    @PostMapping("/api/v1/opportunities/{id}/products")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse addProduct(@PathVariable UUID id, @RequestBody CreateProductRequest request) {
        return ProductResponse.from(opportunities.addProduct(
                id,
                request.description(),
                request.targetBuyers(),
                request.differentiation(),
                request.estimatedCosts(),
                request.feasibility(),
                request.businessType()
        ));
    }

    @GetMapping("/api/v1/opportunities/{id}/products")
    public ProductPage products(@PathVariable UUID id) {
        List<ProductResponse> items = opportunities.products(id).stream().map(ProductResponse::from).toList();
        return new ProductPage(items, items.size(), 0, items.size());
    }

    @PostMapping("/api/v1/opportunities/{id}/decisions")
    @ResponseStatus(HttpStatus.CREATED)
    public DecisionResponse decide(@PathVariable UUID id, @RequestBody CreateDecisionRequest request) {
        return DecisionResponse.from(opportunities.decide(id, request.decision(), request.rationale()));
    }

    @GetMapping("/api/v1/opportunities/{id}/decisions")
    public DecisionPage decisions(@PathVariable UUID id) {
        List<DecisionResponse> items = opportunities.decisions(id).stream().map(DecisionResponse::from).toList();
        return new DecisionPage(items, items.size(), 0, items.size());
    }

    public record CreateOpportunityRequest(
            String title,
            String customerProblem,
            String targetCustomer,
            String businessType,
            String evaluationSummary,
            List<UUID> findingIds
    ) {
    }

    public record OpportunityResponse(
            UUID id,
            String title,
            String customerProblem,
            String targetCustomer,
            String businessType,
            List<UUID> findingIds,
            String status,
            String evaluationSummary,
            int version
    ) {
        static OpportunityResponse from(Opportunity opportunity, List<UUID> findingIds) {
            return new OpportunityResponse(
                    opportunity.getId(),
                    opportunity.getTitle(),
                    opportunity.getCustomerProblem(),
                    opportunity.getTargetCustomer(),
                    opportunity.getBusinessType(),
                    findingIds,
                    opportunity.getStatus(),
                    opportunity.getEvaluationSummary(),
                    opportunity.getVersion()
            );
        }
    }

    public record CreateProductRequest(
            String description,
            String targetBuyers,
            String differentiation,
            String estimatedCosts,
            String feasibility,
            String businessType
    ) {
    }

    public record ProductResponse(
            UUID id,
            UUID opportunityId,
            String description,
            String targetBuyers,
            String differentiation,
            String estimatedCosts,
            String feasibility,
            String businessType,
            Instant createdAt
    ) {
        static ProductResponse from(ProductConcept product) {
            return new ProductResponse(
                    product.getId(),
                    product.getOpportunityId(),
                    product.getDescription(),
                    product.getTargetBuyers(),
                    product.getDifferentiation(),
                    product.getEstimatedCosts(),
                    product.getFeasibility(),
                    product.getBusinessType(),
                    product.getCreatedAt()
            );
        }
    }

    public record ProductPage(List<ProductResponse> items, int limit, int offset, int total) {
    }

    public record CreateDecisionRequest(String decision, String rationale) {
    }

    public record DecisionResponse(
            UUID id,
            UUID opportunityId,
            String decision,
            String rationale,
            UUID founderId,
            Instant createdAt
    ) {
        static DecisionResponse from(FounderDecision decision) {
            return new DecisionResponse(
                    decision.getId(),
                    decision.getOpportunityId(),
                    decision.getDecision(),
                    decision.getRationale(),
                    decision.getFounderId(),
                    decision.getCreatedAt()
            );
        }
    }

    public record DecisionPage(List<DecisionResponse> items, int limit, int offset, int total) {
    }
}
