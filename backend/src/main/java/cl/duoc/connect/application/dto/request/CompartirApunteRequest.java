package cl.duoc.connect.application.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CompartirApunteRequest {

    @NotEmpty(message = "Agrega al menos un correo")
    @Size(max = 20, message = "Puedes compartir con hasta 20 correos a la vez")
    private List<String> emails;

    @Size(max = 500, message = "El mensaje no puede superar 500 caracteres")
    private String mensaje;
}
