package com.airdnd.config;

import com.airdnd.auth.OAuthService;
import jakarta.servlet.DispatcherType;
import org.springframework.boot.actuate.autoconfigure.security.servlet.EndpointRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.DelegatingSecurityContextRepository;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.RequestAttributeSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    private final OAuthService oauthService;
    private final String frontendBaseUrl;

    public SecurityConfig(
            OAuthService oauthService,
            @Value("${app.frontend-base-url:http://127.0.0.1:5173}") String frontendBaseUrl
    ) {
        this.oauthService = oauthService;
        this.frontendBaseUrl = frontendBaseUrl;
    }

    // Actuator endpoints live on the separate management port (8081, see application.yml).
    // This chain matches only those endpoints and permits them, since the port itself is
    // private (not exposed to the internet) — Prometheus scrapes it over the box network.
    @Bean
    @Order(0)
    public SecurityFilterChain actuatorSecurityFilterChain(HttpSecurity httpSecurity) throws Exception {
        httpSecurity
                .securityMatcher(EndpointRequest.toAnyEndpoint())
                .authorizeHttpRequests(authorize -> authorize.anyRequest().permitAll())
                .csrf(csrf -> csrf.disable());
        return httpSecurity.build();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity httpSecurity, SecurityContextRepository securityContextRepository) throws Exception{
        httpSecurity
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .securityContext(context -> context.securityContextRepository(securityContextRepository))
                .authorizeHttpRequests(authorize -> authorize
                        .dispatcherTypeMatchers(DispatcherType.ASYNC, DispatcherType.ERROR).permitAll()
                        .requestMatchers("/", "/oauth2/authorization/**", "/login/oauth2/code/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/auth/me", "/api/rooms/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/reservations/rooms/*/booked-dates").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/members/me/host-activation").hasRole("GUEST")
                        .requestMatchers(HttpMethod.GET, "/api/rooms").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/rooms/**").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/host/**").hasAnyRole("HOST", "ADMIN")
                        .anyRequest().authenticated()
                )
                .exceptionHandling(exceptions -> exceptions.defaultAuthenticationEntryPointFor(
                        new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                        request -> request.getRequestURI().startsWith("/api/")
                ))
                .oauth2Login(oauth -> oauth
                        .userInfoEndpoint(userInfo -> userInfo.oidcUserService(oauthService))
                        .defaultSuccessUrl(frontendBaseUrl + "/auth/callback", true)
                )
                .logout(logout -> logout
                        .logoutUrl("/api/auth/logout")
                        .invalidateHttpSession(true)
                        .clearAuthentication(true)
                        .deleteCookies("JSESSIONID")
                        .logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler(HttpStatus.NO_CONTENT))
                );

        return httpSecurity.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(frontendBaseUrl));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityContextRepository securityContextRepository(){
        return new DelegatingSecurityContextRepository(
                new RequestAttributeSecurityContextRepository(),
                        new HttpSessionSecurityContextRepository());
    };
}
