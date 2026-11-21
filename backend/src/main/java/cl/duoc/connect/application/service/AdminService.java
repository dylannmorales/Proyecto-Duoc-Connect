package cl.duoc.connect.application.service;

import cl.duoc.connect.application.dto.request.AdminUpdateApunteRequest;
import cl.duoc.connect.application.dto.request.AdminUpdateGrupoRequest;
import cl.duoc.connect.application.dto.request.AdminUpdateMensajeRequest;
import cl.duoc.connect.application.dto.request.AdminUpdatePreguntaRequest;
import cl.duoc.connect.application.dto.request.AdminUpdateRespuestaRequest;
import cl.duoc.connect.application.dto.request.UpdateEstadoRequest;
import cl.duoc.connect.application.dto.request.UpdateRolRequest;
import cl.duoc.connect.application.dto.response.AdminApunteResponse;
import cl.duoc.connect.application.dto.response.AdminFotoPerfilResponse;
import cl.duoc.connect.application.dto.response.AdminGrupoResponse;
import cl.duoc.connect.application.dto.response.AdminMensajeResponse;
import cl.duoc.connect.application.dto.response.AdminPreguntaResponse;
import cl.duoc.connect.application.dto.response.AdminRespuestaResponse;
import cl.duoc.connect.application.dto.response.AdminStatsResponse;
import cl.duoc.connect.application.dto.response.AdminUsuarioResponse;
import cl.duoc.connect.application.dto.response.ApunteDescarga;
import cl.duoc.connect.application.dto.response.PageResponse;
import cl.duoc.connect.application.port.out.FileStoragePort;
import cl.duoc.connect.domain.enums.RolUsuario;
import cl.duoc.connect.domain.exception.BusinessException;
import cl.duoc.connect.domain.exception.EntityNotFoundException;
import cl.duoc.connect.infrastructure.persistence.entity.ApunteEntity;
import cl.duoc.connect.infrastructure.persistence.entity.GrupoEstudioEntity;
import cl.duoc.connect.infrastructure.persistence.entity.MensajeGrupoEntity;
import cl.duoc.connect.infrastructure.persistence.entity.PreguntaEntity;
import cl.duoc.connect.infrastructure.persistence.entity.RespuestaEntity;
import cl.duoc.connect.infrastructure.persistence.entity.UsuarioEntity;
import cl.duoc.connect.infrastructure.persistence.repository.ApunteJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.GrupoEstudioJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.GrupoMiembroJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.MensajeGrupoJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.PreguntaJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.RespuestaJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.UsuarioJpaRepository;
import cl.duoc.connect.infrastructure.security.UserPrincipal;
import cl.duoc.connect.application.dto.request.AdminUpdatePerfilProyectoRequest;
import cl.duoc.connect.application.dto.response.AdminPerfilProyectoResponse;
import cl.duoc.connect.domain.enums.VisibilidadPerfil;
import cl.duoc.connect.infrastructure.persistence.entity.PerfilProyectoEntity;
import cl.duoc.connect.infrastructure.persistence.repository.PerfilProyectoJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UsuarioJpaRepository usuarioRepository;
    private final ApunteJpaRepository apunteRepository;
    private final PreguntaJpaRepository preguntaRepository;
    private final RespuestaJpaRepository respuestaRepository;
    private final GrupoEstudioJpaRepository grupoRepository;
    private final GrupoMiembroJpaRepository miembroRepository;
    private final MensajeGrupoJpaRepository mensajeRepository;
    private final PerfilProyectoJpaRepository perfilProyectoRepository;
    private final FileStoragePort fileStoragePort;

    @Transactional(readOnly = true)
    public AdminStatsResponse obtenerEstadisticas() {
        return AdminStatsResponse.builder()
                .totalUsuarios(usuarioRepository.count())
                .usuariosActivos(usuarioRepository.countByActivoTrue())
                .totalGrupos(grupoRepository.count())
                .totalApuntes(apunteRepository.count())
                .totalPreguntas(preguntaRepository.count())
                .totalRespuestas(respuestaRepository.count())
                .totalMensajes(mensajeRepository.count())
                .buscandoCompanero(perfilProyectoRepository.countByBuscandoCompaneroTrue())
                .build();
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminUsuarioResponse> listarUsuarios(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<UsuarioEntity> result = usuarioRepository.findAllWithRelations(pageable);
        return toPageResponse(result.map(this::toAdminUsuario));
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminApunteResponse> listarApuntes(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<ApunteEntity> result = apunteRepository.findAllForAdmin(pageable);
        return toPageResponse(result.map(this::toAdminApunte));
    }

    @Transactional(readOnly = true)
    public AdminApunteResponse obtenerApunte(UUID apunteId) {
        ApunteEntity apunte = apunteRepository.findByIdWithDetails(apunteId)
                .orElseThrow(() -> new EntityNotFoundException("Apunte no encontrado"));
        return toAdminApunte(apunte);
    }

    /** Descarga para revisión: no suma al contador de descargas del apunte. */
    @Transactional(readOnly = true)
    public ApunteDescarga descargarApunte(UUID apunteId) {
        ApunteEntity apunte = apunteRepository.findByIdWithDetails(apunteId)
                .orElseThrow(() -> new EntityNotFoundException("Apunte no encontrado"));
        return new ApunteDescarga(fileStoragePort.loadAsResource(apunte.getArchivoUrl()), apunte.getNombreArchivo());
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminPreguntaResponse> listarPreguntas(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<PreguntaEntity> result = preguntaRepository.findAllForAdmin(pageable);
        return toPageResponse(result.map(this::toAdminPregunta));
    }

    @Transactional(readOnly = true)
    public AdminPreguntaResponse obtenerPregunta(UUID preguntaId) {
        PreguntaEntity pregunta = preguntaRepository.findByIdWithDetails(preguntaId)
                .orElseThrow(() -> new EntityNotFoundException("Pregunta no encontrada"));
        return toAdminPregunta(pregunta);
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminRespuestaResponse> listarRespuestas(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<RespuestaEntity> result = respuestaRepository.findAllForAdmin(pageable);
        return toPageResponse(result.map(this::toAdminRespuesta));
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminGrupoResponse> listarGrupos(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<GrupoEstudioEntity> result = grupoRepository.findAllForAdmin(pageable);
        return toPageResponse(result.map(this::toAdminGrupo));
    }

    @Transactional(readOnly = true)
    public AdminGrupoResponse obtenerGrupo(UUID grupoId) {
        GrupoEstudioEntity grupo = grupoRepository.findByIdWithDetails(grupoId)
                .orElseThrow(() -> new EntityNotFoundException("Grupo no encontrado"));
        return toAdminGrupo(grupo);
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminMensajeResponse> listarMensajes(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<MensajeGrupoEntity> result = mensajeRepository.findAllForAdmin(pageable);
        return toPageResponse(result.map(this::toAdminMensaje));
    }

    @Transactional(readOnly = true)
    public AdminMensajeResponse obtenerMensaje(UUID mensajeId) {
        MensajeGrupoEntity mensaje = mensajeRepository.findByIdWithDetails(mensajeId)
                .orElseThrow(() -> new EntityNotFoundException("Mensaje no encontrado"));
        return toAdminMensaje(mensaje);
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminFotoPerfilResponse> listarFotosPerfil(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
        Page<UsuarioEntity> result = usuarioRepository.findUsuariosConFoto(pageable);
        return toPageResponse(result.map(this::toAdminFotoPerfil));
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

    @Transactional
    public AdminApunteResponse actualizarApunte(UUID apunteId, AdminUpdateApunteRequest request) {
        ApunteEntity apunte = apunteRepository.findByIdWithDetails(apunteId)
                .orElseThrow(() -> new EntityNotFoundException("Apunte no encontrado"));

        apunte.setTitulo(request.getTitulo().trim());
        apunte.setDescripcion(StringUtils.hasText(request.getDescripcion()) ? request.getDescripcion().trim() : null);

        return toAdminApunte(apunteRepository.save(apunte));
    }

    @Transactional
    public AdminPreguntaResponse actualizarPregunta(UUID preguntaId, AdminUpdatePreguntaRequest request) {
        PreguntaEntity pregunta = preguntaRepository.findByIdWithDetails(preguntaId)
                .orElseThrow(() -> new EntityNotFoundException("Pregunta no encontrada"));

        pregunta.setTitulo(request.getTitulo().trim());
        pregunta.setContenido(request.getContenido().trim());

        return toAdminPregunta(preguntaRepository.save(pregunta));
    }

    @Transactional
    public AdminRespuestaResponse actualizarRespuesta(UUID respuestaId, AdminUpdateRespuestaRequest request) {
        RespuestaEntity respuesta = respuestaRepository.findByIdWithDetails(respuestaId)
                .orElseThrow(() -> new EntityNotFoundException("Respuesta no encontrada"));

        respuesta.setContenido(request.getContenido().trim());

        return toAdminRespuesta(respuestaRepository.save(respuesta));
    }

    @Transactional
    public AdminGrupoResponse actualizarGrupo(UUID grupoId, AdminUpdateGrupoRequest request) {
        GrupoEstudioEntity grupo = grupoRepository.findByIdWithDetails(grupoId)
                .orElseThrow(() -> new EntityNotFoundException("Grupo no encontrado"));

        grupo.setNombre(request.getNombre().trim());
        grupo.setDescripcion(StringUtils.hasText(request.getDescripcion()) ? request.getDescripcion().trim() : null);

        return toAdminGrupo(grupoRepository.save(grupo));
    }

    @Transactional
    public AdminMensajeResponse actualizarMensaje(UUID mensajeId, AdminUpdateMensajeRequest request) {
        MensajeGrupoEntity mensaje = mensajeRepository.findByIdWithDetails(mensajeId)
                .orElseThrow(() -> new EntityNotFoundException("Mensaje no encontrado"));

        mensaje.setContenido(request.getContenido().trim());

        return toAdminMensaje(mensajeRepository.save(mensaje));
    }

    @Transactional
    public void eliminarApunte(UUID apunteId) {
        ApunteEntity apunte = apunteRepository.findByIdWithDetails(apunteId)
                .orElseThrow(() -> new EntityNotFoundException("Apunte no encontrado"));

        fileStoragePort.deleteStoredFile(apunte.getArchivoUrl());
        apunteRepository.delete(apunte);
    }

    @Transactional
    public void eliminarPregunta(UUID preguntaId) {
        PreguntaEntity pregunta = preguntaRepository.findByIdWithDetails(preguntaId)
                .orElseThrow(() -> new EntityNotFoundException("Pregunta no encontrada"));

        if (StringUtils.hasText(pregunta.getImagenUrl())) {
            fileStoragePort.deleteStoredFile(pregunta.getImagenUrl());
        }
        preguntaRepository.delete(pregunta);
    }

    @Transactional
    public void eliminarRespuesta(UUID respuestaId) {
        RespuestaEntity respuesta = respuestaRepository.findByIdWithDetails(respuestaId)
                .orElseThrow(() -> new EntityNotFoundException("Respuesta no encontrada"));

        respuestaRepository.delete(respuesta);
    }

    @Transactional
    public void eliminarGrupo(UUID grupoId) {
        if (!grupoRepository.existsById(grupoId)) {
            throw new EntityNotFoundException("Grupo no encontrado");
        }
        grupoRepository.deleteById(grupoId);
    }

    @Transactional
    public void eliminarMensaje(UUID mensajeId) {
        MensajeGrupoEntity mensaje = mensajeRepository.findByIdWithDetails(mensajeId)
                .orElseThrow(() -> new EntityNotFoundException("Mensaje no encontrado"));

        mensajeRepository.delete(mensaje);
    }

    @Transactional
    public void eliminarFotoPerfil(UUID usuarioId) {
        UsuarioEntity usuario = findUsuario(usuarioId);
        if (!StringUtils.hasText(usuario.getFotoUrl())) {
            throw new EntityNotFoundException("El usuario no tiene foto de perfil");
        }

        fileStoragePort.deleteStoredFile(usuario.getFotoUrl());
        usuario.setFotoUrl(null);
        usuarioRepository.save(usuario);
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

    private AdminApunteResponse toAdminApunte(ApunteEntity apunte) {
        return AdminApunteResponse.builder()
                .id(apunte.getId())
                .titulo(apunte.getTitulo())
                .descripcion(apunte.getDescripcion())
                .usuarioId(apunte.getUsuario().getId())
                .usuarioNombre(apunte.getUsuario().getNombre())
                .usuarioEmail(apunte.getUsuario().getEmail())
                .carreraNombre(apunte.getCarrera().getNombre())
                .asignaturaNombre(apunte.getAsignatura().getNombre())
                .nombreArchivo(apunte.getNombreArchivo())
                .createdAt(apunte.getCreatedAt())
                .build();
    }

    private AdminPreguntaResponse toAdminPregunta(PreguntaEntity pregunta) {
        return AdminPreguntaResponse.builder()
                .id(pregunta.getId())
                .titulo(pregunta.getTitulo())
                .contenido(pregunta.getContenido())
                .usuarioId(pregunta.getUsuario().getId())
                .usuarioNombre(pregunta.getUsuario().getNombre())
                .usuarioEmail(pregunta.getUsuario().getEmail())
                .asignaturaNombre(pregunta.getAsignatura() != null ? pregunta.getAsignatura().getNombre() : "Temática general")
                .votos(pregunta.getVotos())
                .totalRespuestas(respuestaRepository.countByPreguntaId(pregunta.getId()))
                .createdAt(pregunta.getCreatedAt())
                .build();
    }

    private AdminRespuestaResponse toAdminRespuesta(RespuestaEntity respuesta) {
        return AdminRespuestaResponse.builder()
                .id(respuesta.getId())
                .preguntaId(respuesta.getPregunta().getId())
                .preguntaTitulo(respuesta.getPregunta().getTitulo())
                .usuarioId(respuesta.getUsuario().getId())
                .usuarioNombre(respuesta.getUsuario().getNombre())
                .usuarioEmail(respuesta.getUsuario().getEmail())
                .contenido(respuesta.getContenido())
                .votos(respuesta.getVotos())
                .aceptada(Boolean.TRUE.equals(respuesta.getAceptada()))
                .createdAt(respuesta.getCreatedAt())
                .build();
    }

    private AdminGrupoResponse toAdminGrupo(GrupoEstudioEntity grupo) {
        return AdminGrupoResponse.builder()
                .id(grupo.getId())
                .nombre(grupo.getNombre())
                .descripcion(grupo.getDescripcion())
                .creadorId(grupo.getCreador().getId())
                .creadorNombre(grupo.getCreador().getNombre())
                .creadorEmail(grupo.getCreador().getEmail())
                .carreraNombre(grupo.getCarrera().getNombre())
                .asignaturaNombre(grupo.getAsignatura() != null ? grupo.getAsignatura().getNombre() : null)
                .privado(Boolean.TRUE.equals(grupo.getPrivado()))
                .maxMiembros(grupo.getMaxMiembros())
                .totalMiembros(miembroRepository.countByGrupoId(grupo.getId()))
                .codigoInvitacion(grupo.getCodigoInvitacion())
                .createdAt(grupo.getCreatedAt())
                .build();
    }

    private AdminMensajeResponse toAdminMensaje(MensajeGrupoEntity mensaje) {
        return AdminMensajeResponse.builder()
                .id(mensaje.getId())
                .grupoId(mensaje.getGrupo().getId())
                .grupoNombre(mensaje.getGrupo().getNombre())
                .usuarioId(mensaje.getUsuario().getId())
                .usuarioNombre(mensaje.getUsuario().getNombre())
                .usuarioEmail(mensaje.getUsuario().getEmail())
                .contenido(mensaje.getContenido())
                .createdAt(mensaje.getCreatedAt())
                .build();
    }

    private AdminFotoPerfilResponse toAdminFotoPerfil(UsuarioEntity usuario) {
        return AdminFotoPerfilResponse.builder()
                .usuarioId(usuario.getId())
                .usuarioNombre(usuario.getNombre())
                .usuarioEmail(usuario.getEmail())
                .carreraNombre(usuario.getCarrera().getNombre())
                .fotoUrl(usuario.getFotoUrl())
                .updatedAt(usuario.getUpdatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminPerfilProyectoResponse> listarPerfilesProyecto(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
        Page<PerfilProyectoEntity> result = perfilProyectoRepository.findAllForAdmin(pageable);
        return toPageResponse(result.map(this::toAdminPerfilProyecto));
    }

    @Transactional
    public AdminPerfilProyectoResponse actualizarPerfilProyecto(
            UUID usuarioId,
            AdminUpdatePerfilProyectoRequest request) {
        PerfilProyectoEntity perfil = perfilProyectoRepository.findByUsuarioIdForAdmin(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Perfil de proyecto no encontrado"));

        if (request.getBio() != null) {
            perfil.setBio(StringUtils.hasText(request.getBio()) ? request.getBio().trim() : null);
        }
        if (request.getBuscandoCompanero() != null) {
            perfil.setBuscandoCompanero(request.getBuscandoCompanero());
        }
        if (request.getVisibilidad() != null) {
            perfil.setVisibilidad(request.getVisibilidad());
        }

        return toAdminPerfilProyecto(perfilProyectoRepository.save(perfil));
    }

    @Transactional
    public void eliminarPerfilProyecto(UUID usuarioId) {
        PerfilProyectoEntity perfil = perfilProyectoRepository.findByUsuarioIdForAdmin(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Perfil de proyecto no encontrado"));

        perfilProyectoRepository.delete(perfil);
    }

    private AdminPerfilProyectoResponse toAdminPerfilProyecto(PerfilProyectoEntity perfil) {
        UsuarioEntity usuario = perfil.getUsuario();
        return AdminPerfilProyectoResponse.builder()
                .usuarioId(usuario.getId())
                .usuarioNombre(usuario.getNombre())
                .usuarioEmail(usuario.getEmail())
                .carreraNombre(usuario.getCarrera().getNombre())
                .bio(perfil.getBio())
                .buscandoCompanero(Boolean.TRUE.equals(perfil.getBuscandoCompanero()))
                .visibilidad(perfil.getVisibilidad() != null ? perfil.getVisibilidad() : VisibilidadPerfil.SOLO_CARRERA)
                .updatedAt(perfil.getUpdatedAt())
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
