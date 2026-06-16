package codesquad.airdnd.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {

	@Value("${kakao.rest-api.key}")
	private String kakaoRestApiKey;

	@Bean
	public RestClient kakaoRestClient() {
		return RestClient.builder()
			.baseUrl("https://dapi.kakao.com")
			.defaultHeader("Authorization", "KakaoAK " + kakaoRestApiKey)
			.build();
	}
}
