package cl.duoc.connect.application.service;

import cl.duoc.connect.application.dto.response.AsignaturaResponse;
import cl.duoc.connect.application.dto.response.CarreraResponse;
import cl.duoc.connect.application.dto.response.SedeResponse;
import cl.duoc.connect.application.mapper.CatalogoMapper;
import cl.duoc.connect.domain.exception.EntityNotFoundException;
import cl.duoc.connect.infrastructure.persistence.repository.AsignaturaJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.CarreraJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.SedeJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CatalogoService {

    private final CarreraJpaRepository carreraRepository;
    private final SedeJpaRepository sedeRepository;
    private final AsignaturaJpaRepository asignaturaRepository;
    private final CatalogoMapper catalogoMapper;

    public List<CarreraResponse> listarCarreras() {
        return carreraRepository.findAll().stream()
                .map(catalogoMapper::toResponse)
                .toList();
    }

    public List<SedeResponse> listarSedes() {
        return sedeRepository.findAll().stream()
                .map(catalogoMapper::toResponse)
                .toList();
    }

    public List<AsignaturaResponse> listarAsignaturasPorCarrera(UUID carreraId) {
        if (!carreraRepository.existsById(carreraId)) {
            throw new EntityNotFoundException("Carrera no encontrada");
        }

        return asignaturaRepository.findByCarreraIdOrderByNombreAsc(carreraId).stream()
                .map(catalogoMapper::toResponse)
                .toList();
    }
}
