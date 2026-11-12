package com.founderslab.questionnaire;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface QuestionnaireRepository extends JpaRepository<Questionnaire, UUID> {

    List<Questionnaire> findByFounderIdOrderByCreatedAtDesc(UUID founderId);

    @Query("""
            select q from Questionnaire q
            where q.founderId in (
                select m.id.founderId from com.founderslab.founder.WorkspaceMember m
                where m.id.workspaceId = :workspaceId
            )
            order by q.createdAt desc
            """)
    List<Questionnaire> findForWorkspace(@Param("workspaceId") UUID workspaceId);
}
