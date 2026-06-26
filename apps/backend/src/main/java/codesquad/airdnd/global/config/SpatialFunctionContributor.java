package codesquad.airdnd.global.config;

import org.hibernate.boot.model.FunctionContributions;
import org.hibernate.boot.model.FunctionContributor;
import org.hibernate.type.StandardBasicTypes;

/**
 * MBRContains 를 boolean 반환 함수로 등록한다.
 * <p>
 * 미등록 상태면 HQL 이 비-boolean 으로 추론해 predicate 자리에서 거부한다
 * (SemanticException: Non-boolean expression used in predicate context).
 * 그렇다고 {@code MBRContains(...) = 1} 로 감싸면 MySQL 옵티마이저가 SPATIAL
 * 인덱스를 못 타 풀스캔이 된다. boolean 함수로 등록하면 HQL 이 그대로 predicate 로
 * 받아 {@code WHERE MBRContains(...)} 로 렌더링 → 인덱스 사용.
 * <p>
 * META-INF/services/org.hibernate.boot.model.FunctionContributor 로 등록된다.
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
