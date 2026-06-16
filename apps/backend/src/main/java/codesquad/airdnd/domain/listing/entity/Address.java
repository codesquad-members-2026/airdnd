package codesquad.airdnd.domain.listing.entity;

import org.locationtech.jts.geom.Point;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Embeddable
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties("latLng")
public class Address {
	private String roadAddress;
	private String detailAddress;
	private String postalCode;
	private Point latLng;
	private String sidoCode;
	private String sigunguCode;

	@JsonProperty("latitude")
	public Double getLatitude() {
		return latLng == null ? null : latLng.getY();
	}

	@JsonProperty("longitude")
	public Double getLongitude() {
		return latLng == null ? null : latLng.getX();
	}

	public String getDetail() {
		return String.format("%s %s %s", roadAddress, detailAddress, postalCode);

	}
}
