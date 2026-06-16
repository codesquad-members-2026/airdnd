package codesquad.airdnd.domain.listing.entity;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Embeddable
@NoArgsConstructor
@AllArgsConstructor
public class Capacity {
	private int maxGuests;
	private int bedrooms;
	private int beds;
	private int bathrooms;
}
