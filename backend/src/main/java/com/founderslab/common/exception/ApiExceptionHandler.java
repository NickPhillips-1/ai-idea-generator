package com.founderslab.common.exception;

import com.founderslab.common.response.ApiError;
import com.founderslab.common.response.ApiErrorWriter;
import com.founderslab.common.response.FieldErrorDetail;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

@RestControllerAdvice
public class ApiExceptionHandler {

    private final ApiErrorWriter errors;

    public ApiExceptionHandler(ApiErrorWriter errors) {
        this.errors = errors;
    }

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiError> handleApi(ApiException exception, HttpServletRequest request) {
        ApiError body = errors.create(exception.status(), exception.getMessage(), path(request), exception.fieldErrors());
        return ResponseEntity.status(exception.status()).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleInvalid(MethodArgumentNotValidException exception, HttpServletRequest request) {
        List<FieldErrorDetail> fields = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> new FieldErrorDetail(error.getField(), error.getDefaultMessage() == null ? "invalid" : error.getDefaultMessage()))
                .toList();
        ApiError body = errors.create(HttpStatus.BAD_REQUEST, "The request is invalid.", path(request), fields);
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleUnreadable(HttpMessageNotReadableException exception, HttpServletRequest request) {
        ApiError body = errors.create(HttpStatus.BAD_REQUEST, "The request body is not valid JSON.", path(request), List.of());
        return ResponseEntity.badRequest().body(body);
    }

    private static String path(HttpServletRequest request) {
        return request.getRequestURI();
    }
}
