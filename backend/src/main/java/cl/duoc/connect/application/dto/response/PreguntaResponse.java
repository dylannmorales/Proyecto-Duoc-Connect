package cl.duoc.connect.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class PreguntaResponse {

    private final UUID id;
    private final String titulo;
    private final String contenido;
    private final UUID usuarioId;
    private final String usuarioNombre;
    private final UUID carreraId;
    private final String carreraNombre;
    private final UUID asignaturaId;
    private final String asignaturaNombre;
    private final boolean tematicaGeneral;
    private final String imagenUrl;
    private final int votos;
    private final boolean votado;
    private final int totalRespuestas;
    private final boolean resuelta;
    private final Instant createdAt;
    /** Solo se rellena en el detalle de la pregunta. */
    private final List<RespuestaResponse> respuestas;
}
