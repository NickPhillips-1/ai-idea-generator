package com.founderslab;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

@AnalyzeClasses(packages = "com.founderslab", importOptions = ImportOption.DoNotIncludeTests.class)
class ModuleBoundariesTest {

    @ArchTest
    static final ArchRule controllers_do_not_depend_on_external_adapters = noClasses()
            .that().haveSimpleNameEndingWith("Controller")
            .should().dependOnClassesThat().resideInAnyPackage(
                    "com.founderslab.integration.sources..",
                    "com.founderslab.integration.ai.."
            )
            .because("controllers call services. Census and the model stay behind adapters in integration.");

    @ArchTest
    static final ArchRule census_adapter_stays_in_integration_sources = noClasses()
            .that().resideOutsideOfPackages(
                    "com.founderslab.integration.sources..",
                    "com.founderslab.config.."
            )
            .should().dependOnClassesThat()
            .haveFullyQualifiedName("com.founderslab.integration.sources.CensusCountyBusinessPatternsAdapter")
            .because("jobs and features use ResearchSourceAdapter. Do not import CensusCountyBusinessPatternsAdapter.");

    @ArchTest
    static final ArchRule java_packages_do_not_depend_on_the_angular_app = noClasses()
            .should().dependOnClassesThat().resideInAnyPackage("frontend..", "com.founderslab.frontend..")
            .because("the Angular app lives in frontend/ and is not a Java dependency.");
}
