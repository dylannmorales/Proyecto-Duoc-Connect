package cl.duoc.connect.application.dto.response;

import cl.duoc.connect.domain.enums.RolGrupo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class MiembroGrupoResponse {

    private final UUID usuarioId;
    private final String nombre;
    private final String fotoUrl;
    private final RolGrupo rol;
    private final Instant joinedAt;
}
