package cl.duoc.connect.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class CrearPreguntaRequest {

    @NotBlank(message = "El título es obligatorio")
    @Size(max = 200, message = "El título no puede superar 200 caracteres")
    private String titulo;

    @NotBlank(message = "El contenido es obligatorio")
    @Size(max = 5000, message = "El contenido no puede superar 5000 caracteres")
    private String contenido;

    @NotNull(message = "La carrera es obligatoria")
    private UUID carreraId;

    private UUID asignaturaId;

    private boolean tematicaGeneral;
}
