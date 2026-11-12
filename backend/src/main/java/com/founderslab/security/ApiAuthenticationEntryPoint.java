package com.founderslab.security;

import com.founderslab.common.response.ApiErrorWriter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.List;

@Component
public class ApiAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ApiErrorWriter errors;

    public ApiAuthenticationEntryPoint(ApiErrorWriter errors) {
        this.errors = errors;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
            throws IOException {
        errors.write(response, errors.create(
                HttpStatus.UNAUTHORIZED,
                "Authentication is required.",
                request.getRequestURI(),
                List.of()
        ));
    }
}
