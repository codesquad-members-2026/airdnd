package codesquad.airdnd.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

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

    @Bean
    public RestClient tossRestClient(TossProperties props, RestClient.Builder builder) {
        // TODO: 추후 타임아웃/로깅/모니터링 구현
        
        String basic = Base64.getEncoder()
                .encodeToString((props.secretKey() + ":").getBytes(StandardCharsets.UTF_8));

        return builder
                .baseUrl(props.baseUrl())
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Basic " + basic)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, "application/json")
                .build();
    }
}
