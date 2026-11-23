package cl.duoc.connect.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

/**
 * Uno de mis grupos, visto como opción para invitar a un compañero. Si {@code disponible} es false,
 * {@code motivo} explica por qué (ya es integrante, ya tiene una invitación pendiente o el grupo está lleno).
 */
@Getter
@Builder
@AllArgsConstructor
public class GrupoInvitableResponse {

    private final UUID grupoId;
    private final String nombre;
    private final long miembros;
    private final int maxMiembros;
    private final boolean disponible;
    private final String motivo;
}
