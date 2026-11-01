package cl.duoc.connect.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CrearRespuestaRequest {

    @NotBlank(message = "La respuesta no puede estar vacía")
    @Size(max = 5000, message = "La respuesta no puede superar 5000 caracteres")
    private String contenido;
}
