package cl.duoc.connect.application.dto.request;

import cl.duoc.connect.domain.enums.NivelHabilidad;
import cl.duoc.connect.domain.enums.VisibilidadPerfil;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class UpdatePerfilProyectoRequest {

    @Size(max = 1000, message = "La bio no puede superar 1000 caracteres")
    private String bio;

    @NotNull(message = "Debe indicar si busca compañero")
    private Boolean buscandoCompanero;

    @NotNull(message = "La visibilidad es obligatoria")
    private VisibilidadPerfil visibilidad;

    private List<UUID> asignaturaIds;

    @Valid
    private List<HabilidadPerfilRequest> habilidades;

    @Valid
    private List<DisponibilidadRequest> disponibilidades;

    @Getter
    @Setter
    public static class HabilidadPerfilRequest {

        @NotNull(message = "La habilidad es obligatoria")
        private UUID habilidadId;

        @NotNull(message = "El nivel es obligatorio")
        private NivelHabilidad nivel;
    }

    @Getter
    @Setter
    public static class DisponibilidadRequest {

        @NotNull(message = "El día es obligatorio")
        @Min(value = 0, message = "Día inválido")
        @Max(value = 6, message = "Día inválido")
        private Short diaSemana;

        @NotNull(message = "Hora de inicio obligatoria")
        private LocalTime horaInicio;

        @NotNull(message = "Hora de fin obligatoria")
        private LocalTime horaFin;
    }
}
