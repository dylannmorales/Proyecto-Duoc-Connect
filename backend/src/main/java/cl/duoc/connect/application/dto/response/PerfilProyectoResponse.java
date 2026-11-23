package cl.duoc.connect.application.dto.response;

import cl.duoc.connect.domain.enums.NivelHabilidad;
import cl.duoc.connect.domain.enums.VisibilidadPerfil;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
public class PerfilProyectoResponse {

    private final UUID usuarioId;
    private final String nombre;
    private final String fotoUrl;
    private final String carreraNombre;
    private final String sedeNombre;
    private final Short semestre;
    private final boolean buscandoCompanero;
    private final String bio;
    private final VisibilidadPerfil visibilidad;
    private final List<AsignaturaItem> asignaturas;
    private final List<HabilidadItem> habilidades;
    private final List<DisponibilidadItem> disponibilidades;
    /** Solo al ver el perfil de otro estudiante: compatibilidad con quien consulta (0-100). */
    private final Integer matchScore;
    /** Solo al ver el perfil de otro estudiante: asignaturas que ambos cursan. */
    private final Integer asignaturasEnComun;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class AsignaturaItem {
        private final UUID id;
        private final String nombre;
    }

    @Getter
    @Builder
    @AllArgsConstructor
    public static class HabilidadItem {
        private final UUID id;
        private final String nombre;
        private final NivelHabilidad nivel;
    }

    @Getter
    @Builder
    @AllArgsConstructor
    public static class DisponibilidadItem {
        private final Short diaSemana;
        private final LocalTime horaInicio;
        private final LocalTime horaFin;
    }
}
