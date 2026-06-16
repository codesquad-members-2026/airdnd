package codesquad.airdnd.domain.wishlist;

import codesquad.airdnd.domain.listing.ListingRepository;
import codesquad.airdnd.domain.listing.entity.Listing;
import codesquad.airdnd.domain.member.Member;
import codesquad.airdnd.domain.wishlist.dto.query.WishlistDetailItemQueryResult;
import codesquad.airdnd.domain.wishlist.dto.query.WishlistDetailQueryResult;
import codesquad.airdnd.domain.wishlist.dto.request.ExistingWishlistAddRequest;
import codesquad.airdnd.domain.wishlist.dto.request.NewWishlistAddRequest;
import codesquad.airdnd.domain.wishlist.dto.request.WishlistItemPatchRequest;
import codesquad.airdnd.domain.wishlist.dto.request.WishlistPatchRequest;
import codesquad.airdnd.domain.wishlist.dto.response.*;
import codesquad.airdnd.domain.wishlist.entity.Wishlist;
import codesquad.airdnd.domain.wishlistItem.WishlistItem;
import codesquad.airdnd.domain.wishlistItem.WishlistItemRepository;
import codesquad.airdnd.global.auth.AuthUtils;
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
    private final AuthUtils authUtils;
    private final ListingRepository listingRepository;
    private final WishlistItemRepository wishlistItemRepository;

    public List<WishlistResponse> getWishlists(){
        Member member = authUtils.getCurrentMember(); // TODO: Stub
        return wishlistRepository.findWishlistsByMember(member.getId());
    }

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
    public NewWishlistAddResponse addItemInNewWishlist(NewWishlistAddRequest newWishlistAddRequest){
        Member currentMember = authUtils.getCurrentMember();
        Listing listing = listingRepository.findById(newWishlistAddRequest.listingId())
                .orElseThrow(() -> new BusinessException(ErrorCode.LISTING_NOT_FOUND));

        if(wishlistItemRepository.existsByMemberIdAndListingId(currentMember.getId(), listing.getId())){
            throw new BusinessException(ErrorCode.WISHLIST_ITEM_ALREADY_EXISTS);
        }

        Wishlist wishlist = wishlistRepository.save(
                Wishlist.builder().member(currentMember).name(newWishlistAddRequest.name()).build());
        wishlistItemRepository.save(WishlistItem.builder().wishlist(wishlist).listing(listing).build());

        return NewWishlistAddResponse.of(wishlist, listing);
    }

    @Transactional
    public ExistingWishlistAddResponse addItemInExistingWishlist(Long wishlistId, ExistingWishlistAddRequest request){
        Member currentMember = authUtils.getCurrentMember();
        Listing listing = listingRepository.findById(request.listingId())
                .orElseThrow(() -> new BusinessException(ErrorCode.LISTING_NOT_FOUND));
        Wishlist wishlist = wishlistRepository.findByIdAndMember_Id(wishlistId, currentMember.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.WISHLIST_NOT_FOUND));

        if(wishlistItemRepository.existsByMemberIdAndListingId(currentMember.getId(), listing.getId())){
            throw new BusinessException(ErrorCode.WISHLIST_ITEM_ALREADY_EXISTS);
        }

        wishlistItemRepository.save(WishlistItem.builder().wishlist(wishlist).listing(listing).build());

        return ExistingWishlistAddResponse.of(wishlist, listing);
    }

    @Transactional
    public void deleteWishlist(Long wishlistId){
        Member currentMember = authUtils.getCurrentMember();

        Wishlist wishlist = wishlistRepository.findByIdAndMember_Id(wishlistId, currentMember.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.WISHLIST_NOT_FOUND));

        wishlistRepository.delete(wishlist);
    }

    @Transactional
    public void deleteItemInWishlist(Long wishlistId, Long listingId){
        Member currentMember = authUtils.getCurrentMember();

        Wishlist wishlist = wishlistRepository.findByIdAndMember_Id(wishlistId, currentMember.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.WISHLIST_NOT_FOUND));

        WishlistItem wishlistItem = wishlistItemRepository.findByWishlist_IdAndListing_Id(wishlist.getId(), listingId)
                .orElseThrow(() -> new BusinessException(ErrorCode.WISHLIST_ITEM_NOT_FOUND));
        wishlistItemRepository.delete(wishlistItem);
    }

    @Transactional
    public WishlistPatchResponse patchWishlist(Long wishlistId, WishlistPatchRequest request){
        Member currentMember = authUtils.getCurrentMember();

        Wishlist wishlist = wishlistRepository.findByIdAndMember_Id(wishlistId, currentMember.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.WISHLIST_NOT_FOUND));

        wishlist.updateName(request.name());

        return WishlistPatchResponse.from(wishlist);
    }

    @Transactional
    public WishlistItemPatchResponse patchItemInWishlist(Long wishlistId, Long listingId, WishlistItemPatchRequest request){
        Member currentMember = authUtils.getCurrentMember();

        Wishlist wishlist = wishlistRepository.findByIdAndMember_Id(wishlistId, currentMember.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.WISHLIST_NOT_FOUND));
        WishlistItem wishlistItem = wishlistItemRepository.findByWishlist_IdAndListing_Id(wishlist.getId(), listingId)
                .orElseThrow(() -> new BusinessException(ErrorCode.WISHLIST_ITEM_NOT_FOUND));

        wishlistItem.updateNote(request.note());

        return WishlistItemPatchResponse.from(wishlistItem);
    }
}
