package cl.duoc.connect.application.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateEstadoRequest {

    @NotNull(message = "El estado es obligatorio")
    private Boolean activo;
}
