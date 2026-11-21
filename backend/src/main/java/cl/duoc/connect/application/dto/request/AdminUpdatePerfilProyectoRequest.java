package cl.duoc.connect.application.dto.request;

import cl.duoc.connect.domain.enums.VisibilidadPerfil;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminUpdatePerfilProyectoRequest {

    @Size(max = 2000, message = "La bio no puede superar 2000 caracteres")
    private String bio;

    private Boolean buscandoCompanero;

    private VisibilidadPerfil visibilidad;
}
