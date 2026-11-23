package com.founderslab.security;

import com.founderslab.common.response.ApiErrorWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.AuthorizationFilter;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.context.SecurityContextHolderFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;

import java.time.Duration;
import java.util.List;

@Configuration
@EnableConfigurationProperties({AuthProperties.class, RateLimitProperties.class})
public class SecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            ApiAuthenticationEntryPoint authenticationEntryPoint,
            ApiAccessDeniedHandler accessDeniedHandler,
            ApiErrorWriter errors,
            MembershipFilter membershipFilter,
            RateLimitProperties rateLimitProperties
    ) throws Exception {
        CookieCsrfTokenRepository csrfRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        CsrfTokenRequestAttributeHandler csrfHandler = new CsrfTokenRequestAttributeHandler();
        csrfHandler.setCsrfRequestAttributeName(null);

        GlobalRateLimiter rateLimiter = new GlobalRateLimiter(
                rateLimitProperties.getRequestsPerMinute(),
                Duration.ofMinutes(1),
                System::nanoTime
        );

        http
                .addFilterBefore(new GlobalRateLimitFilter(rateLimiter, errors), SecurityContextHolderFilter.class)
                .csrf(csrf -> csrf
                        .csrfTokenRepository(csrfRepository)
                        .csrfTokenRequestHandler(csrfHandler))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/error",
                                "/v3/api-docs",
                                "/v3/api-docs/**",
                                "/swagger-ui.html",
                                "/swagger-ui/**"
                        ).permitAll()
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll())
                .formLogin(form -> form
                        .loginPage("/login")
                        .loginProcessingUrl("/api/v1/login")
                        .successHandler((request, response, authentication) ->
                                response.setStatus(HttpStatus.NO_CONTENT.value()))
                        .failureHandler((request, response, exception) -> {
                            log.warn("Sign-in failed: {}", exception.getMessage());
                            errors.write(response, errors.create(
                                    HttpStatus.UNAUTHORIZED,
                                    "The username or password is wrong.",
                                    request.getRequestURI(),
                                    List.of()
                            ));
                        }))
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler(HttpStatus.NO_CONTENT)))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .addFilterAfter(membershipFilter, AuthorizationFilter.class);
        return http.build();
    }

    @Bean
    @ConditionalOnMissingBean(SecurityContextRepository.class)
    SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }
}
