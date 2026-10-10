package cl.duoc.connect.application.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class CreateGrupoRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 150, message = "El nombre no puede superar 150 caracteres")
    private String nombre;

    @Size(max = 2000, message = "La descripción no puede superar 2000 caracteres")
    private String descripcion;

    @NotNull(message = "La carrera es obligatoria")
    private UUID carreraId;

    private UUID asignaturaId;

    @Min(value = 2, message = "El mínimo de miembros es 2")
    @Max(value = 50, message = "El máximo de miembros es 50")
    private Short maxMiembros = 20;

    @NotNull(message = "Debe indicar si el grupo es privado")
    private Boolean privado;
}
