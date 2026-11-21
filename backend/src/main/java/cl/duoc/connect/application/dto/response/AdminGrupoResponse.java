package cl.duoc.connect.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class AdminGrupoResponse {

    private final UUID id;
    private final String nombre;
    private final String descripcion;
    private final UUID creadorId;
    private final String creadorNombre;
    private final String creadorEmail;
    private final String carreraNombre;
    private final String asignaturaNombre;
    private final boolean privado;
    private final short maxMiembros;
    private final long totalMiembros;
    private final String codigoInvitacion;
    private final Instant createdAt;
}
