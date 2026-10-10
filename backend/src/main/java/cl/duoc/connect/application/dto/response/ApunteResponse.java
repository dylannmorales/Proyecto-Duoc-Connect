package cl.duoc.connect.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class ApunteResponse {

    private final UUID id;
    private final String titulo;
    private final String descripcion;
    private final UUID usuarioId;
    private final String usuarioNombre;
    private final UUID carreraId;
    private final String carreraNombre;
    private final UUID asignaturaId;
    private final String asignaturaNombre;
    private final String nombreArchivo;
    private final Long tamanoBytes;
    private final BigDecimal promedioValoracion;
    private final Integer totalValoraciones;
    private final Integer descargas;
    private final Short miValoracion;
    private final Instant createdAt;
}
