package cl.duoc.connect.application.dto.response;

import cl.duoc.connect.domain.enums.NivelHabilidad;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class CompaneroRecomendacionResponse {

    private final UUID usuarioId;
    private final String nombre;
    private final String fotoUrl;
    private final String carreraNombre;
    private final String sedeNombre;
    private final Short semestre;
    private final String bio;
    private final int matchScore;
    private final int asignaturasEnComun;
    private final List<HabilidadDestacada> habilidadesDestacadas;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class HabilidadDestacada {
        private final String nombre;
        private final NivelHabilidad nivel;
    }
}
