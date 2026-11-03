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
public class UsuarioResponse {

    private final UUID id;
    private final String nombre;
    private final String email;
    private final UUID carreraId;
    private final String carreraNombre;
    private final UUID sedeId;
    private final String sedeNombre;
    private final Short semestre;
    private final String fotoUrl;
    private final RolUsuario rol;
    private final Instant createdAt;
}
