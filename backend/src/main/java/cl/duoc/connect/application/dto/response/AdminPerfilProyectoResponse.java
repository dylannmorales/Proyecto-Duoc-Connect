package cl.duoc.connect.application.dto.response;

import cl.duoc.connect.domain.enums.VisibilidadPerfil;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class AdminPerfilProyectoResponse {

    private final UUID usuarioId;
    private final String usuarioNombre;
    private final String usuarioEmail;
    private final String carreraNombre;
    private final String bio;
    private final boolean buscandoCompanero;
    private final VisibilidadPerfil visibilidad;
    private final Instant updatedAt;
}
