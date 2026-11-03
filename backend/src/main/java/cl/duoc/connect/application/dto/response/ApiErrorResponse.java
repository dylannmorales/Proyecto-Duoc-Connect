package cl.duoc.connect.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class ApiErrorResponse {

    private final boolean success;
    private final ErrorBody error;
    private final Instant timestamp;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class ErrorBody {
        private final String code;
        private final String message;
        private final List<FieldError> details;
    }

    @Getter
    @Builder
    @AllArgsConstructor
    public static class FieldError {
        private final String field;
        private final String message;
    }

    public static ApiErrorResponse of(String code, String message) {
        return ApiErrorResponse.builder()
                .success(false)
                .error(ErrorBody.builder()
                        .code(code)
                        .message(message)
                        .details(List.of())
                        .build())
                .timestamp(Instant.now())
                .build();
    }

    public static ApiErrorResponse of(String code, String message, List<FieldError> details) {
        return ApiErrorResponse.builder()
                .success(false)
                .error(ErrorBody.builder()
                        .code(code)
                        .message(message)
                        .details(details)
                        .build())
                .timestamp(Instant.now())
                .build();
    }
}
