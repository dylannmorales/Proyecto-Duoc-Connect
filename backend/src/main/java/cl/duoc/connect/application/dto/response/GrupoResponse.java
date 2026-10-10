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
public class GrupoResponse {

    private final UUID id;
    private final String nombre;
    private final String descripcion;
    private final UUID carreraId;
    private final String carreraNombre;
    private final UUID asignaturaId;
    private final String asignaturaNombre;
    private final UUID creadorId;
    private final String creadorNombre;
    private final Short maxMiembros;
    private final long miembrosActuales;
    private final boolean privado;
    private final String codigoInvitacion;
    private final boolean esMiembro;
    private final RolGrupo rolEnGrupo;
    private final Instant createdAt;
}
