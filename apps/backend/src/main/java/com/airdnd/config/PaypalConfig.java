package com.airdnd.config;


import org.springframework.boot.http.client.ClientHttpRequestFactoryBuilder;
import org.springframework.boot.http.client.ClientHttpRequestFactorySettings;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class PaypalConfig {

    @Bean
    public RestClient paypalRestClient(PaypalProperties props) {
        ClientHttpRequestFactorySettings settings = ClientHttpRequestFactorySettings.defaults()
                .withConnectTimeout(props.connectTimeout())
                .withReadTimeout(props.readTimeout());

        return RestClient.builder()
                .baseUrl(props.baseUrl())
                .requestFactory(ClientHttpRequestFactoryBuilder.detect().build(settings))
                .build();
    }
}
