package cl.duoc.connect.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.UUID;

@Getter
@AllArgsConstructor
public class RespuestaInvitacionResponse {

    private final UUID grupoId;
    private final String grupoNombre;
    private final String estado;
}
