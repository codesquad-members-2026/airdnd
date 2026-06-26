package codesquad.airdnd.domain.wishlist;

import codesquad.airdnd.domain.listing.repository.ListingRepository;
import codesquad.airdnd.domain.listing.entity.Listing;
import codesquad.airdnd.domain.member.Member;
import codesquad.airdnd.domain.member.MemberRepository;
import codesquad.airdnd.domain.wishlist.dto.query.ListingCoverImageProjection;
import codesquad.airdnd.domain.wishlist.dto.query.WishlistDetailItemQueryResult;
import codesquad.airdnd.domain.wishlist.dto.query.WishlistDetailQueryResult;
import codesquad.airdnd.domain.wishlist.dto.query.WishlistSummaryProjection;
import codesquad.airdnd.domain.wishlist.dto.request.ExistingWishlistAddRequest;
import codesquad.airdnd.domain.wishlist.dto.request.NewWishlistAddRequest;
import codesquad.airdnd.domain.wishlist.dto.request.WishlistItemPatchRequest;
import codesquad.airdnd.domain.wishlist.dto.request.WishlistPatchRequest;
import codesquad.airdnd.domain.wishlist.dto.response.*;
import codesquad.airdnd.domain.wishlist.entity.Wishlist;
import codesquad.airdnd.domain.wishlistItem.WishlistItem;
import codesquad.airdnd.domain.wishlistItem.WishlistItemRepository;
import codesquad.airdnd.global.exception.BusinessException;
import codesquad.airdnd.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final MemberRepository memberRepository;
    private final ListingRepository listingRepository;
    private final WishlistItemRepository wishlistItemRepository;

    public List<WishlistResponse> getWishlists(Long memberId){
        List<WishlistSummaryProjection> summaries = wishlistRepository.findWishlistSummaries(memberId);

        List<Long> coverListingIds = summaries.stream()
                .map(WishlistSummaryProjection::getCoverListingId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        Map<Long, String> imageByListing = coverListingIds.isEmpty()
                ? Map.of()
                : wishlistRepository.findCoverImages(coverListingIds).stream()
                        .collect(Collectors.toMap(
                                ListingCoverImageProjection::getListingId,
                                ListingCoverImageProjection::getImageUrl,
                                (a, b) -> a));

        // 조립: 요약 + 대표 이미지.
        return summaries.stream()
                .map(s -> new WishlistResponse(
                        s.getId(),
                        s.getName(),
                        s.getItemCount(),
                        s.getCoverListingId() == null ? null : imageByListing.get(s.getCoverListingId())))
                .toList();
    }

    // TODO: 반환 DTO 규격대로 한 번에 가져와 이미지만 파싱한다면?
    public WishlistDetailResponse getWishlist(Long wishlistId){
        List<WishlistDetailQueryResult> detailList = wishlistRepository.findDetail(wishlistId);

        if(detailList.isEmpty()){
            throw new BusinessException(ErrorCode.WISHLIST_NOT_FOUND);
        }

        Long id = detailList.getFirst().id();
        String name = detailList.getFirst().name();
        Map<Long, String> noteByListing = extractNote(detailList);

        List<Long> listingIds = extractListingIds(detailList);
        List<WishlistDetailItemQueryResult> itemRows =
                listingIds.isEmpty() ? List.of() : wishlistRepository.findDetailItem(listingIds);
        Map<Long, List<String>> imageByListing = extractImages(itemRows);
        Map<Long, WishlistDetailItemQueryResult> infoByListing = extractListingInfo(itemRows);
        List<WishlistDetailItemResponse> items = assembleDetailItems(listingIds, infoByListing, noteByListing, imageByListing);

        return new WishlistDetailResponse(id, name, items);
    }
    private Map<Long, String> extractNote(List<WishlistDetailQueryResult> detailList){
        Map<Long, String> result = new HashMap<>();

        for(WishlistDetailQueryResult detail : detailList){
            if(detail.listingId() != null){
                result.put(detail.listingId(), detail.note());
            }
        }

        return result;
    }
    private List<Long> extractListingIds(List<WishlistDetailQueryResult> detailList){
        return detailList.stream()
                .map(WishlistDetailQueryResult::listingId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
    }
    private Map<Long, List<String>> extractImages(List<WishlistDetailItemQueryResult> itemRows){
        return itemRows.stream()
                .filter(r -> r.imageUrl() != null)
                .collect(Collectors.groupingBy(
                    WishlistDetailItemQueryResult::listingId,
                    LinkedHashMap::new,
                    Collectors.mapping(WishlistDetailItemQueryResult::imageUrl, Collectors.toList())));
    }
    private Map<Long, WishlistDetailItemQueryResult> extractListingInfo(List<WishlistDetailItemQueryResult> itemRows){
        return itemRows.stream()
                .collect(Collectors.toMap(
                        WishlistDetailItemQueryResult::listingId,
                        r -> r,
                        (a, b) -> a));
    }
    private List<WishlistDetailItemResponse> assembleDetailItems(
            List<Long> listingIds, Map<Long,
            WishlistDetailItemQueryResult> infoByListing,
            Map<Long, String> noteByListing,
            Map<Long, List<String>> imageByListing
    ){

        return listingIds.stream()
                .map(lid -> {
                    WishlistDetailItemQueryResult info = infoByListing.get(lid);
                    return new WishlistDetailItemResponse(
                            lid,
                            info.listingName(),
                            info.pricePerNight(),
                            noteByListing.get(lid),
                            imageByListing.getOrDefault(lid, List.of())
                    );
                }).toList();
    }

    @Transactional
    public NewWishlistAddResponse addItemInNewWishlist(Long memberId, NewWishlistAddRequest newWishlistAddRequest){
        Listing listing = listingRepository.findById(newWishlistAddRequest.listingId())
                .orElseThrow(() -> new BusinessException(ErrorCode.LISTING_NOT_FOUND));

        if(wishlistItemRepository.existsByMemberIdAndListingId(memberId, listing.getId())){
            throw new BusinessException(ErrorCode.WISHLIST_ITEM_ALREADY_EXISTS);
        }

        Member currentMember = memberRepository.getReferenceById(memberId);
        Wishlist wishlist = wishlistRepository.save(
                Wishlist.builder().member(currentMember).name(newWishlistAddRequest.name()).build());
        wishlistItemRepository.save(WishlistItem.builder().wishlist(wishlist).listing(listing).build());

        return NewWishlistAddResponse.of(wishlist, listing);
    }

    @Transactional
    public ExistingWishlistAddResponse addItemInExistingWishlist(Long memberId, Long wishlistId, ExistingWishlistAddRequest request){
        Listing listing = listingRepository.findById(request.listingId())
                .orElseThrow(() -> new BusinessException(ErrorCode.LISTING_NOT_FOUND));
        Wishlist wishlist = wishlistRepository.findByIdAndMember_Id(wishlistId, memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.WISHLIST_NOT_FOUND));

        if(wishlistItemRepository.existsByMemberIdAndListingId(memberId, listing.getId())){
            throw new BusinessException(ErrorCode.WISHLIST_ITEM_ALREADY_EXISTS);
        }

        wishlistItemRepository.save(WishlistItem.builder().wishlist(wishlist).listing(listing).build());

        return ExistingWishlistAddResponse.of(wishlist, listing);
    }

    @Transactional
    public void deleteWishlist(Long memberId, Long wishlistId){
        Wishlist wishlist = wishlistRepository.findByIdAndMember_Id(wishlistId, memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.WISHLIST_NOT_FOUND));

        wishlistRepository.delete(wishlist);
    }

    @Transactional
    public void deleteItemInWishlist(Long memberId, Long wishlistId, Long listingId){
        Wishlist wishlist = wishlistRepository.findByIdAndMember_Id(wishlistId, memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.WISHLIST_NOT_FOUND));

        WishlistItem wishlistItem = wishlistItemRepository.findByWishlist_IdAndListing_Id(wishlist.getId(), listingId)
                .orElseThrow(() -> new BusinessException(ErrorCode.WISHLIST_ITEM_NOT_FOUND));
        wishlistItemRepository.delete(wishlistItem);
    }

    @Transactional
    public WishlistPatchResponse patchWishlist(Long memberId, Long wishlistId, WishlistPatchRequest request){
        Wishlist wishlist = wishlistRepository.findByIdAndMember_Id(wishlistId, memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.WISHLIST_NOT_FOUND));

        wishlist.updateName(request.name());

        return WishlistPatchResponse.from(wishlist);
    }

    @Transactional
    public WishlistItemPatchResponse patchItemInWishlist(Long memberId, Long wishlistId, Long listingId, WishlistItemPatchRequest request){
        Wishlist wishlist = wishlistRepository.findByIdAndMember_Id(wishlistId, memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.WISHLIST_NOT_FOUND));
        WishlistItem wishlistItem = wishlistItemRepository.findByWishlist_IdAndListing_Id(wishlist.getId(), listingId)
                .orElseThrow(() -> new BusinessException(ErrorCode.WISHLIST_ITEM_NOT_FOUND));

        wishlistItem.updateNote(request.note());

        return WishlistItemPatchResponse.from(wishlistItem);
    }
}
