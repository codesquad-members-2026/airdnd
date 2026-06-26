package codesquad.airdnd.global.config;

import org.hibernate.engine.jdbc.internal.FormatStyle;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import com.p6spy.engine.logging.Category;
import com.p6spy.engine.spy.P6SpyOptions;
import com.p6spy.engine.spy.appender.MessageFormattingStrategy;
import com.p6spy.engine.spy.appender.Slf4JLogger;

import jakarta.annotation.PostConstruct;

/**
 * p6spy 로그 포맷 + 슬로우 쿼리 전용 로깅.
 * <p>
 * gavlyukovskiy starter 엔 slow-query 프로퍼티가 없어서, 임계값을 초과하는 쿼리만
 * WARN 으로 기록하는 커스텀 appender({@link SlowQueryAwareLogger})를 직접 등록한다.
 * appender 는 p6spy 가 리플렉션(no-arg)으로 생성하므로 임계값은 static 으로 주입한다.
 *
 * <p><b>설계 메모 — 왜 로그 레벨로 거르지 않는가</b><br>
 * p6spy 는 쿼리를 appender 로 넘기기 전에 {@code isCategoryEnabled(category)} 로
 * "이 카테고리 로깅이 켜져 있나"를 먼저 확인한다. 부모 {@link Slf4JLogger} 의 구현은
 * STATEMENT 카테고리를 {@code log.isInfoEnabled()} 기준으로 판단하기 때문에,
 * {@code logging.level.p6spy=warn} 으로 올리면 INFO 게이트가 닫혀 {@code logSQL} 자체가
 * 호출되지 않는다 → 슬로우 쿼리(WARN)까지 전부 사라진다.
 * <br>
 * 그래서 (1) {@code isCategoryEnabled} 를 항상 true 로 열어 레벨 의존성을 끊고,
 * (2) 실제 출력 여부는 {@code logSQL} 안의 {@code elapsed >= thresholdMs} 한 곳에서만
 * 결정한다. 이러면 yaml 레벨이 info/warn 어느 쪽이든 동일하게 "느린 쿼리만" 찍힌다.
 */
@Profile("local")
@Configuration
public class P6SpyConfig {

	@Value("${decorator.datasource.p6spy.slow-query-threshold-ms:100}")
	private long slowQueryThresholdMs;

	@PostConstruct
	public void configure() {
		P6SpyOptions.getActiveInstance().setLogMessageFormat(P6SpyPrettyFormat.class.getName());
		SlowQueryAwareLogger.thresholdMs = slowQueryThresholdMs;
	}

	/** 임계값(thresholdMs) 이상 걸린 쿼리만 WARN 으로 기록. 그 미만은 기록하지 않음. */
	public static class SlowQueryAwareLogger extends Slf4JLogger {

		private static final Logger log = LoggerFactory.getLogger("p6spy");
		static volatile long thresholdMs = 100;

		/**
		 * 카테고리 게이트를 항상 열어둔다.
		 * 부모 구현은 STATEMENT 를 isInfoEnabled() 로 막아버려서, 레벨을 warn 으로 올리면
		 * logSQL 호출 자체가 차단된다. 출력 판단은 logSQL 의 elapsed 비교에 전적으로 맡긴다.
		 */
		@Override
		public boolean isCategoryEnabled(Category category) {
			return true;
		}

		@Override
		public void logSQL(int connectionId, String now, long elapsed, Category category,
			String prepared, String sql, String url) {

			if (sql == null || sql.trim().isEmpty()) {
				return;
			}

			// 느린 쿼리만 본다: 임계값 미만은 아예 기록하지 않음.
			if (elapsed < thresholdMs) {
				return;
			}

			String message = P6SpyOptions.getActiveInstance()
				.getLogMessageFormatInstance()
				.formatMessage(connectionId, now, elapsed, category.getName(), prepared, sql, url);

			log.warn(message);
		}
	}

	/** geometry(Point) 바인딩 깨짐 방지: STATEMENT 만 hibernate 포매터로 정렬. */
	public static class P6SpyPrettyFormat implements MessageFormattingStrategy {

		@Override
		public String formatMessage(int connectionId, String now, long elapsed,
			String category, String prepared, String sql, String url) {

			if (sql == null || sql.trim().isEmpty()) {
				return "";
			}

			return String.format("[%dms] | %s | connection %d%n%s",
				elapsed, category, connectionId, formatSql(category, sql));
		}

		private String formatSql(String category, String sql) {
			if (!Category.STATEMENT.getName().equals(category)) {
				return sql;
			}

			String trimmed = sql.trim().toLowerCase();
			if (trimmed.startsWith("create") || trimmed.startsWith("alter") || trimmed.startsWith("comment")) {
				return FormatStyle.DDL.getFormatter().format(sql);
			}
			return FormatStyle.BASIC.getFormatter().format(sql);
		}
	}
}