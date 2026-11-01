package cl.duoc.connect.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class RespuestaResponse {

    private final UUID id;
    private final UUID preguntaId;
    private final UUID usuarioId;
    private final String usuarioNombre;
    private final String contenido;
    private final int votos;
    private final boolean votado;
    private final boolean aceptada;
    private final Instant createdAt;
}
