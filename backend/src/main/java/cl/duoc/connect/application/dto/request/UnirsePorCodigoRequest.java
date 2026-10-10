package cl.duoc.connect.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UnirsePorCodigoRequest {

    @NotBlank(message = "El código de invitación es obligatorio")
    private String codigoInvitacion;
}
