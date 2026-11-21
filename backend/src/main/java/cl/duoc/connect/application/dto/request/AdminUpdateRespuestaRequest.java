package cl.duoc.connect.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminUpdateRespuestaRequest {

    @NotBlank(message = "El contenido es obligatorio")
    @Size(max = 5000, message = "El contenido no puede superar 5000 caracteres")
    private String contenido;
}
