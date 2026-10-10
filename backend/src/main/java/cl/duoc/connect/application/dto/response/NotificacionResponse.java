package cl.duoc.connect.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class NotificacionResponse {

    private final UUID id;
    private final String tipo;
    private final String titulo;
    private final String mensaje;
    private final String enlace;
    private final boolean leida;
    private final Instant createdAt;
}
