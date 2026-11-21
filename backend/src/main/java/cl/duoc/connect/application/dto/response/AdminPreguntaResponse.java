package cl.duoc.connect.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class AdminPreguntaResponse {

    private final UUID id;
    private final String titulo;
    private final String contenido;
    private final UUID usuarioId;
    private final String usuarioNombre;
    private final String usuarioEmail;
    private final String asignaturaNombre;
    private final int votos;
    private final long totalRespuestas;
    private final Instant createdAt;
}
