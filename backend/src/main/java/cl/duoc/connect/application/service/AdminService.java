package cl.duoc.connect.application.service;

import cl.duoc.connect.application.dto.request.UpdateEstadoRequest;
import cl.duoc.connect.application.dto.request.UpdateRolRequest;
import cl.duoc.connect.application.dto.response.AdminStatsResponse;
import cl.duoc.connect.application.dto.response.AdminUsuarioResponse;
import cl.duoc.connect.application.dto.response.PageResponse;
import cl.duoc.connect.domain.enums.RolUsuario;
import cl.duoc.connect.domain.exception.BusinessException;
import cl.duoc.connect.domain.exception.EntityNotFoundException;
import cl.duoc.connect.infrastructure.persistence.entity.UsuarioEntity;
import cl.duoc.connect.infrastructure.persistence.repository.ApunteJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.GrupoEstudioJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.MensajeGrupoJpaRepository;
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

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UsuarioJpaRepository usuarioRepository;
    private final ApunteJpaRepository apunteRepository;
    private final GrupoEstudioJpaRepository grupoRepository;
    private final MensajeGrupoJpaRepository mensajeRepository;

    @Transactional(readOnly = true)
    public AdminStatsResponse obtenerEstadisticas() {
        return AdminStatsResponse.builder()
                .totalUsuarios(usuarioRepository.count())
                .usuariosActivos(usuarioRepository.countByActivoTrue())
                .totalGrupos(grupoRepository.count())
                .totalApuntes(apunteRepository.count())
                .totalMensajes(mensajeRepository.count())
                .build();
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminUsuarioResponse> listarUsuarios(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<UsuarioEntity> result = usuarioRepository.findAllWithRelations(pageable);
        return toPageResponse(result.map(this::toAdminUsuario));
    }

    @Transactional
    public AdminUsuarioResponse actualizarRol(UUID usuarioId, UpdateRolRequest request) {
        UsuarioEntity usuario = findUsuario(usuarioId);
        assertNotSelf(usuarioId, "No puedes cambiar tu propio rol");

        if (request.getRol() == RolUsuario.ESTUDIANTE && usuario.getRol() == RolUsuario.ADMINISTRADOR) {
            assertOtherActiveAdminExists();
        }

        usuario.setRol(request.getRol());
        return toAdminUsuario(usuarioRepository.save(usuario));
    }

    @Transactional
    public AdminUsuarioResponse actualizarEstado(UUID usuarioId, UpdateEstadoRequest request) {
        UsuarioEntity usuario = findUsuario(usuarioId);
        assertNotSelf(usuarioId, "No puedes desactivar tu propia cuenta");

        if (Boolean.FALSE.equals(request.getActivo())
                && usuario.getRol() == RolUsuario.ADMINISTRADOR) {
            assertOtherActiveAdminExists();
        }

        usuario.setActivo(request.getActivo());
        return toAdminUsuario(usuarioRepository.save(usuario));
    }

    private void assertOtherActiveAdminExists() {
        long adminsActivos = usuarioRepository.findAll().stream()
                .filter(u -> u.getRol() == RolUsuario.ADMINISTRADOR && Boolean.TRUE.equals(u.getActivo()))
                .count();
        if (adminsActivos <= 1) {
            throw new BusinessException("LAST_ADMIN", "Debe existir al menos un administrador activo");
        }
    }

    private UsuarioEntity findUsuario(UUID usuarioId) {
        return usuarioRepository.findByIdWithRelations(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
    }

    private void assertNotSelf(UUID usuarioId, String message) {
        UUID currentUserId = getCurrentUserId();
        if (currentUserId.equals(usuarioId)) {
            throw new BusinessException("SELF_MODIFICATION", message);
        }
    }

    private UUID getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserPrincipal userPrincipal) {
            return userPrincipal.getId();
        }
        throw new BusinessException("UNAUTHORIZED", "Sesión no válida");
    }

    private AdminUsuarioResponse toAdminUsuario(UsuarioEntity usuario) {
        return AdminUsuarioResponse.builder()
                .id(usuario.getId())
                .nombre(usuario.getNombre())
                .email(usuario.getEmail())
                .carreraNombre(usuario.getCarrera().getNombre())
                .sedeNombre(usuario.getSede().getNombre())
                .rol(usuario.getRol())
                .activo(Boolean.TRUE.equals(usuario.getActivo()))
                .createdAt(usuario.getCreatedAt())
                .build();
    }

    private <T> PageResponse<T> toPageResponse(Page<T> page) {
        return PageResponse.<T>builder()
                .content(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }
}
