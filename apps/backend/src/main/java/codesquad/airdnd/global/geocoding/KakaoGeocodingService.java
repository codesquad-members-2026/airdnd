package codesquad.airdnd.global.geocoding;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.fasterxml.jackson.annotation.JsonProperty;

import codesquad.airdnd.global.exception.BusinessException;
import codesquad.airdnd.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class KakaoGeocodingService {

	private final RestClient kakaoRestClient;

	public KakaoRegionInfo reverseGeocode(double latitude, double longitude) {
		Coord2RegionResponse response = kakaoRestClient.get()
			.uri("/v2/local/geo/coord2regioncode.json?x={lon}&y={lat}", longitude, latitude)
			.retrieve()
			.body(Coord2RegionResponse.class);

		if (response == null || response.documents() == null || response.documents().isEmpty()) {
			throw new BusinessException(ErrorCode.GEOCODING_FAILED);
		}

		return response.documents().stream()
			.filter(doc -> "B".equals(doc.regionType()))
			.findFirst()
			.map(doc -> new KakaoRegionInfo(
				doc.code().substring(0, 2),
				doc.code().substring(0, 5)
			))
			.orElseThrow(() -> new BusinessException(ErrorCode.GEOCODING_FAILED));
	}

	private record Coord2RegionResponse(List<Document> documents) {
		private record Document(
			@JsonProperty("region_type") String regionType,
			@JsonProperty("code") String code
		) {
		}
	}
}
