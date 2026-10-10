package cl.duoc.connect.application.mapper;

import cl.duoc.connect.application.dto.response.ApunteResponse;
import cl.duoc.connect.infrastructure.persistence.entity.ApunteEntity;
import org.springframework.stereotype.Component;

@Component
public class ApunteMapper {

    public ApunteResponse toResponse(ApunteEntity entity, Short miValoracion) {
        return ApunteResponse.builder()
                .id(entity.getId())
                .titulo(entity.getTitulo())
                .descripcion(entity.getDescripcion())
                .usuarioId(entity.getUsuario().getId())
                .usuarioNombre(entity.getUsuario().getNombre())
                .carreraId(entity.getCarrera().getId())
                .carreraNombre(entity.getCarrera().getNombre())
                .asignaturaId(entity.getAsignatura().getId())
                .asignaturaNombre(entity.getAsignatura().getNombre())
                .nombreArchivo(entity.getNombreArchivo())
                .tamanoBytes(entity.getTamanoBytes())
                .promedioValoracion(entity.getPromedioValoracion())
                .totalValoraciones(entity.getTotalValoraciones())
                .descargas(entity.getDescargas())
                .miValoracion(miValoracion)
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
