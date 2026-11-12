package com.founderslab.opportunity;

import com.founderslab.common.exception.ApiException;
import com.founderslab.common.response.FieldErrorDetail;
import com.founderslab.direction.DirectionService;
import com.founderslab.evidence.ResearchFinding;
import com.founderslab.evidence.ResearchFindingRepository;
import com.founderslab.founder.CurrentFounder;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class OpportunityService {

    private static final Set<String> BUSINESS_TYPES = Set.of("PHYSICAL_PRODUCT", "SERVICE", "SOFTWARE", "OTHER");
    private static final Set<String> DECISIONS = Set.of("ADVANCE", "INVESTIGATE", "REDESIGN", "ARCHIVE");

    private final OpportunityRepository opportunities;
    private final ProductConceptRepository products;
    private final FounderDecisionRepository decisions;
    private final ResearchFindingRepository findings;
    private final DirectionService directions;
    private final CurrentFounder currentFounder;
    private final JdbcTemplate jdbc;

    public OpportunityService(
            OpportunityRepository opportunities,
            ProductConceptRepository products,
            FounderDecisionRepository decisions,
            ResearchFindingRepository findings,
            DirectionService directions,
            CurrentFounder currentFounder,
            JdbcTemplate jdbc
    ) {
        this.opportunities = opportunities;
        this.products = products;
        this.decisions = decisions;
        this.findings = findings;
        this.directions = directions;
        this.currentFounder = currentFounder;
        this.jdbc = jdbc;
    }

    @Transactional
    public Opportunity create(
            String title,
            String customerProblem,
            String targetCustomer,
            String businessType,
            String evaluationSummary,
            List<UUID> findingIds
    ) {
        requireText(title, "title");
        requireText(customerProblem, "customerProblem");
        requireText(targetCustomer, "targetCustomer");
        String type = businessType == null || businessType.isBlank() ? "PHYSICAL_PRODUCT" : businessType;
        if (!BUSINESS_TYPES.contains(type)) {
            throw ApiException.badRequest("Business type is not allowed.", List.of(new FieldErrorDetail("businessType", "invalid")));
        }
        if (findingIds == null) {
            throw ApiException.badRequest("Finding ids are required.", List.of(new FieldErrorDetail("findingIds", "required")));
        }
        if (new HashSet<>(findingIds).size() != findingIds.size()) {
            throw ApiException.badRequest("Finding ids must be unique.", List.of(new FieldErrorDetail("findingIds", "duplicate")));
        }
        for (UUID findingId : findingIds) {
            ResearchFinding finding = findings.findById(findingId)
                    .orElseThrow(() -> ApiException.notFound("Research finding was not found."));
            directions.get(finding.getDirectionId());
        }
        Opportunity opportunity = opportunities.saveAndFlush(new Opportunity(
                currentFounder.requireMembership().getId().getWorkspaceId(),
                title.trim(),
                customerProblem.trim(),
                targetCustomer.trim(),
                evaluationSummary == null ? "" : evaluationSummary,
                type
        ));
        int position = 0;
        for (UUID findingId : findingIds) {
            jdbc.update(
                    "insert into opportunity_finding (opportunity_id, research_finding_id, position) values (?, ?, ?)",
                    opportunity.getId(),
                    findingId,
                    position++
            );
        }
        return opportunity;
    }

    @Transactional(readOnly = true)
    public Opportunity get(UUID id) {
        Opportunity opportunity = opportunities.findById(id)
                .orElseThrow(() -> ApiException.notFound("Opportunity was not found."));
        if (!opportunity.getWorkspaceId().equals(currentFounder.requireMembership().getId().getWorkspaceId())) {
            throw ApiException.notFound("Opportunity was not found.");
        }
        return opportunity;
    }

    @Transactional(readOnly = true)
    public List<UUID> findingIds(UUID opportunityId) {
        get(opportunityId);
        return jdbc.query(
                "select research_finding_id from opportunity_finding where opportunity_id = ? order by position",
                (row, rowNumber) -> row.getObject(1, UUID.class),
                opportunityId
        );
    }

    @Transactional
    public ProductConcept addProduct(
            UUID opportunityId,
            String description,
            String targetBuyers,
            String differentiation,
            String estimatedCosts,
            String feasibility,
            String businessType
    ) {
        get(opportunityId);
        requireText(description, "description");
        requireText(targetBuyers, "targetBuyers");
        requireText(differentiation, "differentiation");
        requireText(estimatedCosts, "estimatedCosts");
        requireText(feasibility, "feasibility");
        String type = businessType == null || businessType.isBlank() ? "PHYSICAL_PRODUCT" : businessType;
        if (!BUSINESS_TYPES.contains(type)) {
            throw ApiException.badRequest("Business type is not allowed.", List.of(new FieldErrorDetail("businessType", "invalid")));
        }
        return products.save(new ProductConcept(
                opportunityId,
                description.trim(),
                targetBuyers.trim(),
                differentiation.trim(),
                estimatedCosts.trim(),
                feasibility.trim(),
                type
        ));
    }

    @Transactional(readOnly = true)
    public List<ProductConcept> products(UUID opportunityId) {
        get(opportunityId);
        return products.findByOpportunityIdOrderByCreatedAtAsc(opportunityId);
    }

    @Transactional
    public FounderDecision decide(UUID opportunityId, String decision, String rationale) {
        Opportunity opportunity = get(opportunityId);
        if (decision == null || !DECISIONS.contains(decision)) {
            throw ApiException.badRequest("Decision is not allowed.", List.of(new FieldErrorDetail("decision", "invalid")));
        }
        requireText(rationale, "rationale");
        FounderDecision saved = decisions.save(new FounderDecision(
                opportunity.getId(),
                currentFounder.requireFounder().getId(),
                decision,
                rationale.trim()
        ));
        return saved;
    }

    @Transactional(readOnly = true)
    public List<FounderDecision> decisions(UUID opportunityId) {
        get(opportunityId);
        return decisions.findByOpportunityIdOrderByCreatedAtAsc(opportunityId);
    }

    private static void requireText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw ApiException.badRequest("A required field is blank.", List.of(new FieldErrorDetail(field, "required")));
        }
    }
}
