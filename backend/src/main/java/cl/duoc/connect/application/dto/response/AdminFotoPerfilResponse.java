package cl.duoc.connect.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class AdminFotoPerfilResponse {

    private final UUID usuarioId;
    private final String usuarioNombre;
    private final String usuarioEmail;
    private final String carreraNombre;
    private final String fotoUrl;
    private final Instant updatedAt;
}
