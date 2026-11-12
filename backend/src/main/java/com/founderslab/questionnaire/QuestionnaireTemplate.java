package com.founderslab.questionnaire;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(name = "questionnaire_template")
public class QuestionnaireTemplate {

    @Id
    private UUID id;

    @Column(name = "version_number", nullable = false)
    private int versionNumber;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false)
    private String definition;

    protected QuestionnaireTemplate() {
    }

    public UUID getId() {
        return id;
    }

    public int getVersionNumber() {
        return versionNumber;
    }

    public String getDefinition() {
        return definition;
    }
}
