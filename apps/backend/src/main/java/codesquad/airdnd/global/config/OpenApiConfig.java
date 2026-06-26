package codesquad.airdnd.global.config;

import org.springdoc.core.utils.SpringDocUtils;
import org.springframework.context.annotation.Configuration;

import codesquad.airdnd.global.auth.CurrentMember;

@Configuration
public class OpenApiConfig {

	static {
		// @CurrentMember는 LoginArgumentResolver가 인증으로 주입하는 파라미터. 쿼리 파라미터로 노출하지 않도록 무시 처리.
		SpringDocUtils.getConfig().addAnnotationsToIgnore(CurrentMember.class);
	}
}
