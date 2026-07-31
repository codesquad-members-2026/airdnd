package com.airdnd.room;

import com.airdnd.config.AwsProperties;
import com.airdnd.room.dto.PresignRequest;
import com.airdnd.room.dto.PresignResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class S3PresignService {

    private static final Map<String, String> EXT_BY_CONTENT_TYPE = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/webp", "webp"
    );

    private final S3Presigner s3Presigner;
    private final AwsProperties  awsProperties;

    public PresignResponse createUploadUrl(Long hostId, PresignRequest request) {
        String ext = EXT_BY_CONTENT_TYPE.get(request.contentType());
        String objectKey = "rooms/%d/%s.%s".formatted(hostId, UUID.randomUUID(), ext);

        PutObjectRequest objectRequest = PutObjectRequest.builder()
                .bucket(awsProperties.s3().bucket())
                .key(objectKey)
                .contentType(request.contentType())
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofSeconds(awsProperties.s3().presignExpirySeconds()))
                .putObjectRequest(objectRequest)
                .build();

        PresignedPutObjectRequest presigned = s3Presigner.presignPutObject(presignRequest);
        String publicUrl = "%s/%s".formatted(awsProperties.s3().publicBaseUrl(), objectKey);

        return new PresignResponse(presigned.url().toString(), objectKey, publicUrl);
    }
}
