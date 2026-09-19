package cl.duoc.connect.application.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class RegisterRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 150, message = "El nombre no puede superar 150 caracteres")
    private String nombre;

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "El correo no es válido")
    @Pattern(regexp = ".+@duocuc\\.cl$", message = "Debe usar un correo institucional @duocuc.cl")
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, max = 100, message = "La contraseña debe tener entre 8 y 100 caracteres")
    private String password;

    @NotNull(message = "La carrera es obligatoria")
    private UUID carreraId;

    @NotNull(message = "La sede es obligatoria")
    private UUID sedeId;

    @NotNull(message = "El semestre es obligatorio")
    @Min(value = 1, message = "El semestre mínimo es 1")
    @Max(value = 12, message = "El semestre máximo es 12")
    private Short semestre;

    @NotBlank(message = "El token de seguridad es obligatorio")
    private String securityToken;
}
