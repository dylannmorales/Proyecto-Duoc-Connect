package cl.duoc.connect.application.mapper;

import cl.duoc.connect.application.dto.response.AsignaturaResponse;
import cl.duoc.connect.application.dto.response.CarreraResponse;
import cl.duoc.connect.application.dto.response.SedeResponse;
import cl.duoc.connect.infrastructure.persistence.entity.AsignaturaEntity;
import cl.duoc.connect.infrastructure.persistence.entity.CarreraEntity;
import cl.duoc.connect.infrastructure.persistence.entity.SedeEntity;
import org.springframework.stereotype.Component;

@Component
public class CatalogoMapper {

    public CarreraResponse toResponse(CarreraEntity entity) {
        return CarreraResponse.builder()
                .id(entity.getId())
                .nombre(entity.getNombre())
                .codigo(entity.getCodigo())
                .build();
    }

    public SedeResponse toResponse(SedeEntity entity) {
        return SedeResponse.builder()
                .id(entity.getId())
                .nombre(entity.getNombre())
                .ciudad(entity.getCiudad())
                .build();
    }

    public AsignaturaResponse toResponse(AsignaturaEntity entity) {
        return AsignaturaResponse.builder()
                .id(entity.getId())
                .nombre(entity.getNombre())
                .codigo(entity.getCodigo())
                .carreraId(entity.getCarrera().getId())
                .build();
    }
}
