package cl.duoc.connect.application.mapper;

import cl.duoc.connect.application.dto.response.UsuarioResponse;
import cl.duoc.connect.infrastructure.persistence.entity.UsuarioEntity;
import org.springframework.stereotype.Component;

@Component
public class UsuarioMapper {

    public UsuarioResponse toResponse(UsuarioEntity entity) {
        return UsuarioResponse.builder()
                .id(entity.getId())
                .nombre(entity.getNombre())
                .email(entity.getEmail())
//                .carreraId(entity.getCarrera().getId())
//                .carreraNombre(entity.getCarrera().getNombre())
//                .sedeId(entity.getSede().getId())
//                .sedeNombre(entity.getSede().getNombre())
                .semestre(entity.getSemestre())
                .fotoUrl(entity.getFotoUrl())
                .rol(entity.getRol())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
