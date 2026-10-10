package cl.duoc.connect.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class FormSecurityTokenResponse {

    private final String token;
    private final long expiresInSeconds;
}
