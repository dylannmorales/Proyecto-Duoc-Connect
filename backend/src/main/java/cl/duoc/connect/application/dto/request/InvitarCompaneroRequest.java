package cl.duoc.connect.application.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class InvitarCompaneroRequest {

    @NotNull(message = "Elige el grupo al que quieres invitar")
    private UUID grupoId;

    @Size(max = 300, message = "El mensaje puede tener hasta 300 caracteres")
    private String mensaje;
}
