package codesquad.airdnd.global.region;

import java.io.IOException;
import java.io.InputStream;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class RegionCodeService {

	private final ObjectMapper objectMapper;

	private Map<String, SidoEntry> sidoByCode;
	private Map<String, SigunguEntry> sigunguByCode;
	private Map<String, List<SigunguEntry>> sigunguBySidoCode;

	@PostConstruct
	void load() {
		try (InputStream is = new ClassPathResource("regions.json").getInputStream()) {
			RegionsData data = objectMapper.readValue(is, RegionsData.class);

			sidoByCode = data.sido().stream()
				.collect(Collectors.toUnmodifiableMap(SidoEntry::code, Function.identity()));

			sigunguByCode = data.sigungu().stream()
				.collect(Collectors.toUnmodifiableMap(SigunguEntry::code, Function.identity()));

			sigunguBySidoCode = data.sigungu().stream()
				.collect(Collectors.groupingBy(SigunguEntry::sidoCode,
					Collectors.collectingAndThen(Collectors.toList(), Collections::unmodifiableList)));

			log.info("지역 코드 로드 완료: 시도 {}개, 시군구 {}개", sidoByCode.size(), sigunguByCode.size());
		} catch (IOException e) {
			throw new IllegalStateException("regions.json 로드 실패", e);
		}
	}

	public String getSidoName(String sidoCode) {
		SidoEntry entry = sidoByCode.get(sidoCode);
		return entry != null ? entry.name() : sidoCode;
	}

	public String getSigunguName(String sigunguCode) {
		SigunguEntry entry = sigunguByCode.get(sigunguCode);
		return entry != null ? entry.name() : sigunguCode;
	}

	public String getAddressSummary(String sidoCode, String sigunguCode) {
		return getSigunguName(sigunguCode) + ", " + getSidoName(sidoCode);
	}

	public List<SidoEntry> getAllSido() {
		return List.copyOf(sidoByCode.values());
	}

	public List<SigunguEntry> getSigunguBySidoCode(String sidoCode) {
		return sigunguBySidoCode.getOrDefault(sidoCode, List.of());
	}

	public record SidoEntry(String code, String name) {
	}

	public record SigunguEntry(
		String code,
		String name,
		String sidoCode
	) {
	}

	private record RegionsData(List<SidoEntry> sido, List<SigunguEntry> sigungu) {
	}
}
