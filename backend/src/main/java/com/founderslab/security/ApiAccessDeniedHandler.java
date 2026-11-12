package com.founderslab.security;

import com.founderslab.common.response.ApiErrorWriter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.List;

@Component
public class ApiAccessDeniedHandler implements AccessDeniedHandler {

    private final ApiErrorWriter errors;

    public ApiAccessDeniedHandler(ApiErrorWriter errors) {
        this.errors = errors;
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException accessDeniedException)
            throws IOException {
        errors.write(response, errors.create(
                HttpStatus.FORBIDDEN,
                "This account is not allowed to use Founders.",
                request.getRequestURI(),
                List.of()
        ));
    }
}
