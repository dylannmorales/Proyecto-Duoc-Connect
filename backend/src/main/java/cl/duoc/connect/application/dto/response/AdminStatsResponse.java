package cl.duoc.connect.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class AdminStatsResponse {

    private final long totalUsuarios;
    private final long usuariosActivos;
    private final long totalGrupos;
    private final long totalApuntes;
    private final long totalMensajes;
}
