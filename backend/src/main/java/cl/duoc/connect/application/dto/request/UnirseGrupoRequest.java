package cl.duoc.connect.application.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UnirseGrupoRequest {

    @Size(max = 10, message = "Código de invitación inválido")
    private String codigoInvitacion;
}
