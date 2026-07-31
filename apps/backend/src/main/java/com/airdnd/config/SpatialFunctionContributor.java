package com.airdnd.config;

import org.hibernate.boot.model.FunctionContributions;
import org.hibernate.boot.model.FunctionContributor;
import org.hibernate.type.StandardBasicTypes;

/**
 * Registers MySQL's {@code MBRContains} as a boolean-returning HQL function so the
 * bounding-box predicate can be emitted <em>bare</em> (e.g. {@code WHERE MBRContains(?, location)}).
 *
 * <p>Why this exists: HQL requires a predicate to be a boolean expression, so a raw
 * {@code MBRContains(...)} is rejected ("Non-boolean expression in predicate context").
 * Wrapping it as {@code MBRContains(...) = 1} satisfies HQL but hides the spatial relation
 * from MySQL's range optimizer, which then refuses the SPATIAL index and full-scans the table.
 * Declaring the function as boolean here lets us write it bare, which MySQL recognizes and
 * resolves against idx_rooms_location.
 *
 * <p>Registered via {@code META-INF/services/org.hibernate.boot.model.FunctionContributor}.
 */
public class SpatialFunctionContributor implements FunctionContributor {

    @Override
    public void contributeFunctions(FunctionContributions functionContributions) {
        functionContributions.getFunctionRegistry().registerPattern(
                "mbrcontains",
                "MBRContains(?1, ?2)",
                functionContributions.getTypeConfiguration()
                        .getBasicTypeRegistry()
                        .resolve(StandardBasicTypes.BOOLEAN)
        );
    }
}
