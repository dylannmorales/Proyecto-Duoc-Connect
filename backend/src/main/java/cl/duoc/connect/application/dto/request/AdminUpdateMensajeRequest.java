package cl.duoc.connect.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminUpdateMensajeRequest {

    @NotBlank(message = "El contenido es obligatorio")
    private String contenido;
}
