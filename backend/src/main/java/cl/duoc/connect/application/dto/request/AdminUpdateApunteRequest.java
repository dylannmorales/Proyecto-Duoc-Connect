package cl.duoc.connect.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminUpdateApunteRequest {

    @NotBlank(message = "El título es obligatorio")
    @Size(max = 200, message = "El título no puede superar 200 caracteres")
    private String titulo;

    @Size(max = 2000, message = "La descripción no puede superar 2000 caracteres")
    private String descripcion;
}
