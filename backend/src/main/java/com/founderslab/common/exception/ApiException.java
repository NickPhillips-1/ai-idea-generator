package com.founderslab.common.exception;

import com.founderslab.common.response.FieldErrorDetail;
import org.springframework.http.HttpStatus;

import java.util.List;

public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final List<FieldErrorDetail> fieldErrors;

    public ApiException(HttpStatus status, String message, List<FieldErrorDetail> fieldErrors) {
        super(message);
        this.status = status;
        this.fieldErrors = fieldErrors;
    }

    public static ApiException forbidden(String message) {
        return new ApiException(HttpStatus.FORBIDDEN, message, List.of());
    }

    public static ApiException notFound(String message) {
        return new ApiException(HttpStatus.NOT_FOUND, message, List.of());
    }

    public static ApiException conflict(String message) {
        return new ApiException(HttpStatus.CONFLICT, message, List.of());
    }

    public static ApiException unprocessable(String message, List<FieldErrorDetail> fieldErrors) {
        return new ApiException(HttpStatus.UNPROCESSABLE_CONTENT, message, fieldErrors);
    }

    public static ApiException badRequest(String message, List<FieldErrorDetail> fieldErrors) {
        return new ApiException(HttpStatus.BAD_REQUEST, message, fieldErrors);
    }

    public static ApiException tooManyRequests(String message) {
        return new ApiException(HttpStatus.TOO_MANY_REQUESTS, message, List.of());
    }

    public HttpStatus status() {
        return status;
    }

    public List<FieldErrorDetail> fieldErrors() {
        return fieldErrors;
    }
}
