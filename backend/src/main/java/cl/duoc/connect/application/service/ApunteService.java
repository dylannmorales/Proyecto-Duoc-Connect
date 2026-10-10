package cl.duoc.connect.application.service;

import cl.duoc.connect.application.dto.response.ApunteResponse;
import cl.duoc.connect.application.dto.response.PageResponse;
import cl.duoc.connect.application.mapper.ApunteMapper;
import cl.duoc.connect.application.port.out.FileStoragePort;
import cl.duoc.connect.domain.exception.BusinessException;
import cl.duoc.connect.domain.exception.EntityNotFoundException;
import cl.duoc.connect.infrastructure.persistence.entity.ApunteEntity;
import cl.duoc.connect.infrastructure.persistence.entity.AsignaturaEntity;
import cl.duoc.connect.infrastructure.persistence.entity.CarreraEntity;
import cl.duoc.connect.infrastructure.persistence.entity.UsuarioEntity;
import cl.duoc.connect.infrastructure.persistence.repository.ApunteJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.AsignaturaJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.CarreraJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.UsuarioJpaRepository;
import cl.duoc.connect.infrastructure.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ApunteService {

    private final ApunteJpaRepository apunteRepository;
    private final CarreraJpaRepository carreraRepository;
    private final AsignaturaJpaRepository asignaturaRepository;
    private final UsuarioJpaRepository usuarioRepository;
    private final FileStoragePort fileStoragePort;
    private final ApunteMapper apunteMapper;

    @Transactional
    public ApunteResponse subirApunte(
            String titulo,
            String descripcion,
            UUID carreraId,
            UUID asignaturaId,
            MultipartFile file) {

        UsuarioEntity usuario = getCurrentUsuario();

        if (!StringUtils.hasText(titulo)) {
            throw new BusinessException("VALIDATION_ERROR", "El título es obligatorio");
        }

        CarreraEntity carrera = carreraRepository.findById(carreraId)
                .orElseThrow(() -> new BusinessException("CARRERA_NOT_FOUND", "Carrera no encontrada"));

        AsignaturaEntity asignatura = asignaturaRepository.findByIdWithCarrera(asignaturaId)
                .orElseThrow(() -> new BusinessException("ASIGNATURA_NOT_FOUND", "Asignatura no encontrada"));

        if (!asignatura.getCarrera().getId().equals(carreraId)) {
            throw new BusinessException("ASIGNATURA_INVALID", "La asignatura no pertenece a la carrera seleccionada");
        }

        String archivoUrl = fileStoragePort.storeApuntePdf(file);
        String nombreArchivo = StringUtils.cleanPath(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "apunte.pdf");

        ApunteEntity apunte = new ApunteEntity();
        apunte.setTitulo(titulo.trim());
        apunte.setDescripcion(StringUtils.hasText(descripcion) ? descripcion.trim() : null);
        apunte.setUsuario(usuario);
        apunte.setCarrera(carrera);
        apunte.setAsignatura(asignatura);
        apunte.setArchivoUrl(archivoUrl);
        apunte.setNombreArchivo(nombreArchivo);
        apunte.setTamanoBytes(file.getSize());

        ApunteEntity saved = apunteRepository.save(apunte);
        saved.setUsuario(usuario);
        saved.setCarrera(carrera);
        saved.setAsignatura(asignatura);

        return apunteMapper.toResponse(saved, null);
    }

    @Transactional(readOnly = true)
    public PageResponse<ApunteResponse> buscarApuntes(
            UUID carreraId,
            UUID asignaturaId,
            String q,
            int page,
            int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        String query = StringUtils.hasText(q) ? q.trim() : null;

        Page<ApunteEntity> result = query == null
                ? apunteRepository.buscarApuntes(carreraId, asignaturaId, pageable)
                : apunteRepository.buscarApuntesConTexto(carreraId, asignaturaId, query, pageable);

        List<ApunteResponse> content = result.getContent().stream()
                .map(apunte -> apunteMapper.toResponse(apunte, null))
                .toList();

        return PageResponse.<ApunteResponse>builder()
                .content(content)
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public ApunteResponse obtenerApunte(UUID id) {
        ApunteEntity apunte = findApunteWithDetails(id);
        return apunteMapper.toResponse(apunte, null);
    }

    private ApunteEntity findApunteWithDetails(UUID id) {
        return apunteRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new EntityNotFoundException("Apunte no encontrado"));
    }

    private UsuarioEntity getCurrentUsuario() {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();
        return usuarioRepository.findById(principal.getId())
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
    }
}
