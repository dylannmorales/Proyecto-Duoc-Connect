package cl.duoc.connect.application.dto.response;

import cl.duoc.connect.domain.enums.RolUsuario;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class AdminUsuarioResponse {

    private final UUID id;
    private final String nombre;
    private final String email;
    private final String carreraNombre;
    private final String sedeNombre;
    private final RolUsuario rol;
    private final boolean activo;
    private final Instant createdAt;
}
