package cl.duoc.connect.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class MensajeGrupoResponse {

    private final UUID id;
    private final UUID grupoId;
    private final UUID usuarioId;
    private final String usuarioNombre;
    private final String usuarioFotoUrl;
    private final String contenido;
    private final Instant createdAt;
}
