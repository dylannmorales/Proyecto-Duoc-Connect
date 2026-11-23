package cl.duoc.connect.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

/** Invitación directa recibida. No incluye correos: solo nombre y foto de quien invita. */
@Getter
@Builder
@AllArgsConstructor
public class InvitacionDirectaResponse {

    private final UUID id;
    private final UUID grupoId;
    private final String grupoNombre;
    private final String grupoDescripcion;
    private final String carreraNombre;
    private final String asignaturaNombre;
    private final long miembros;
    private final int maxMiembros;
    private final UUID invitadorId;
    private final String invitadorNombre;
    private final String invitadorFotoUrl;
    private final String mensaje;
    private final String estado;
    private final Instant createdAt;
}
