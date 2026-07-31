package com.airdnd.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;


@Configuration
public class S3Config {
    @Bean
    public S3Presigner s3Presigner(AwsProperties props) {
        AwsBasicCredentials credentials = AwsBasicCredentials.create(
                props.credentials().accessKey(),
                props.credentials().secretKey()
        );
        return S3Presigner.builder()
                .region(Region.of(props.region()))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .build();
    }
}