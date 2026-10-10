package cl.duoc.connect.application.dto.request;

import cl.duoc.connect.domain.enums.RolUsuario;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateRolRequest {

    @NotNull(message = "El rol es obligatorio")
    private RolUsuario rol;
}
