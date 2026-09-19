package cl.duoc.connect.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class StatusResponse {

    private final String application;
    private final String version;
    private final String status;
}
