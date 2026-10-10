package cl.duoc.connect.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class AsignaturaResponse {

    private final UUID id;
    private final String nombre;
    private final String codigo;
    private final UUID carreraId;
}
