package cl.duoc.connect.application.service;

import cl.duoc.connect.application.dto.request.CreateGrupoRequest;
import cl.duoc.connect.application.dto.request.EnviarMensajeRequest;
import cl.duoc.connect.application.dto.request.UnirseGrupoRequest;
import cl.duoc.connect.application.dto.response.GrupoResponse;
import cl.duoc.connect.application.dto.response.MensajeGrupoResponse;
import cl.duoc.connect.application.dto.response.MiembroGrupoResponse;
import cl.duoc.connect.application.dto.response.PageResponse;
import cl.duoc.connect.application.mapper.GrupoMapper;
import cl.duoc.connect.domain.enums.RolGrupo;
import cl.duoc.connect.domain.exception.BusinessException;
import cl.duoc.connect.domain.exception.EntityNotFoundException;
import cl.duoc.connect.infrastructure.persistence.entity.AsignaturaEntity;
import cl.duoc.connect.infrastructure.persistence.entity.CarreraEntity;
import cl.duoc.connect.infrastructure.persistence.entity.GrupoEstudioEntity;
import cl.duoc.connect.infrastructure.persistence.entity.GrupoMiembroEntity;
import cl.duoc.connect.infrastructure.persistence.entity.GrupoMiembroId;
import cl.duoc.connect.infrastructure.persistence.entity.MensajeGrupoEntity;
import cl.duoc.connect.infrastructure.persistence.entity.UsuarioEntity;
import cl.duoc.connect.infrastructure.persistence.repository.AsignaturaJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.CarreraJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.GrupoEstudioJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.GrupoMiembroJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.MensajeGrupoJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.UsuarioJpaRepository;
import cl.duoc.connect.infrastructure.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GrupoService {

    private static final String CODIGO_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final GrupoEstudioJpaRepository grupoRepository;
    private final GrupoMiembroJpaRepository miembroRepository;
    private final MensajeGrupoJpaRepository mensajeRepository;
    private final CarreraJpaRepository carreraRepository;
    private final AsignaturaJpaRepository asignaturaRepository;
    private final UsuarioJpaRepository usuarioRepository;
    private final GrupoMapper grupoMapper;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificacionService notificacionService;

    @Transactional
    public GrupoResponse crearGrupo(CreateGrupoRequest request) {
        UsuarioEntity creador = getCurrentUsuario();

        CarreraEntity carrera = carreraRepository.findById(request.getCarreraId())
                .orElseThrow(() -> new BusinessException("CARRERA_NOT_FOUND", "Carrera no encontrada"));

        AsignaturaEntity asignatura = null;
        if (request.getAsignaturaId() != null) {
            asignatura = asignaturaRepository.findById(request.getAsignaturaId())
                    .orElseThrow(() -> new BusinessException("ASIGNATURA_NOT_FOUND", "Asignatura no encontrada"));
        }

        GrupoEstudioEntity grupo = new GrupoEstudioEntity();
        grupo.setNombre(request.getNombre().trim());
        grupo.setDescripcion(StringUtils.hasText(request.getDescripcion()) ? request.getDescripcion().trim() : null);
        grupo.setCarrera(carrera);
        grupo.setAsignatura(asignatura);
        grupo.setCreador(creador);
        grupo.setMaxMiembros(request.getMaxMiembros() != null ? request.getMaxMiembros() : 20);
        grupo.setPrivado(Boolean.TRUE.equals(request.getPrivado()));
        grupo.setCodigoInvitacion(generarCodigoInvitacion());

        GrupoEstudioEntity saved = grupoRepository.save(grupo);
        agregarMiembro(saved, creador, RolGrupo.ADMIN_GRUPO);

        return grupoMapper.toResponse(saved, 1, true, RolGrupo.ADMIN_GRUPO);
    }

    @Transactional(readOnly = true)
    public PageResponse<GrupoResponse> buscarGrupos(UUID carreraId, String q, int page, int size) {
        UUID usuarioId = getCurrentUserId();
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        String query = StringUtils.hasText(q) ? q.trim() : null;
        Page<GrupoEstudioEntity> result = query == null
                ? grupoRepository.buscarGrupos(usuarioId, carreraId, pageable)
                : grupoRepository.buscarGruposConTexto(usuarioId, carreraId, query, pageable);

        List<GrupoResponse> content = result.getContent().stream()
                .map(grupo -> toGrupoResponse(grupo, usuarioId))
                .toList();

        return PageResponse.<GrupoResponse>builder()
                .content(content)
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public GrupoResponse obtenerGrupo(UUID grupoId) {
        UUID usuarioId = getCurrentUserId();
        GrupoEstudioEntity grupo = findGrupoWithDetails(grupoId);
        validarAccesoGrupo(grupo, usuarioId);
        return toGrupoResponse(grupo, usuarioId);
    }

    @Transactional(readOnly = true)
    public GrupoResponse buscarPorCodigo(String codigo) {
        String codigoNormalizado = codigo.trim().toUpperCase();
        GrupoEstudioEntity grupo = grupoRepository.findByCodigoInvitacionIgnoreCase(codigoNormalizado)
                .orElseThrow(() -> new BusinessException("INVALID_CODE", "Código de invitación inválido"));

        UUID usuarioId = getCurrentUserId();
        return toGrupoResponse(grupo, usuarioId);
    }

    @Transactional
    public GrupoResponse unirsePorCodigo(String codigo) {
        String codigoNormalizado = codigo.trim().toUpperCase();
        GrupoEstudioEntity grupo = grupoRepository.findByCodigoInvitacionIgnoreCase(codigoNormalizado)
                .orElseThrow(() -> new BusinessException("INVALID_CODE", "Código de invitación inválido"));

        UnirseGrupoRequest joinRequest = new UnirseGrupoRequest();
        joinRequest.setCodigoInvitacion(codigoNormalizado);
        return unirseGrupo(grupo.getId(), joinRequest);
    }

    @Transactional
    public GrupoResponse unirseGrupo(UUID grupoId, UnirseGrupoRequest request) {
        UsuarioEntity usuario = getCurrentUsuario();
        GrupoEstudioEntity grupo = findGrupoWithDetails(grupoId);

        if (miembroRepository.existsByGrupoIdAndUsuarioId(grupoId, usuario.getId())) {
            throw new BusinessException("ALREADY_MEMBER", "Ya eres miembro de este grupo");
        }

        long miembros = miembroRepository.countByGrupoId(grupoId);
        if (miembros >= grupo.getMaxMiembros()) {
            throw new BusinessException("GROUP_FULL", "El grupo ha alcanzado el máximo de miembros");
        }

        if (Boolean.TRUE.equals(grupo.getPrivado())) {
            String codigo = request != null ? request.getCodigoInvitacion() : null;
            if (!StringUtils.hasText(codigo) || !grupo.getCodigoInvitacion().equalsIgnoreCase(codigo.trim())) {
                throw new BusinessException("INVALID_CODE", "Código de invitación inválido");
            }
        }

        agregarMiembro(grupo, usuario, RolGrupo.MIEMBRO);
        return grupoMapper.toResponse(grupo, miembros + 1, true, RolGrupo.MIEMBRO);
    }

    @Transactional
    public void salirGrupo(UUID grupoId) {
        UsuarioEntity usuario = getCurrentUsuario();
        GrupoMiembroEntity membresia = miembroRepository.findByGrupoIdAndUsuarioId(grupoId, usuario.getId())
                .orElseThrow(() -> new BusinessException("NOT_MEMBER", "No eres miembro de este grupo"));

        long totalMiembros = miembroRepository.countByGrupoId(grupoId);

        if (totalMiembros == 1) {
            grupoRepository.deleteById(grupoId);
            return;
        }

        boolean esAdmin = membresia.getRol() == RolGrupo.ADMIN_GRUPO;
        miembroRepository.delete(membresia);

        if (esAdmin) {
            List<GrupoMiembroEntity> restantes = miembroRepository.findMiembrosOrdenados(grupoId);
            if (!restantes.isEmpty()) {
                GrupoMiembroEntity nuevoAdmin = restantes.get(0);
                nuevoAdmin.setRol(RolGrupo.ADMIN_GRUPO);
                miembroRepository.save(nuevoAdmin);
            }
        }
    }

    @Transactional(readOnly = true)
    public List<MiembroGrupoResponse> listarMiembros(UUID grupoId) {
        validarMembresia(grupoId, getCurrentUserId());
        return miembroRepository.findByGrupoIdWithUsuario(grupoId).stream()
                .map(grupoMapper::toMiembroResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<MensajeGrupoResponse> listarMensajes(UUID grupoId, int page, int size) {
        validarMembresia(grupoId, getCurrentUserId());

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt"));
        Page<MensajeGrupoEntity> result = mensajeRepository.findByGrupoId(grupoId, pageable);

        List<MensajeGrupoResponse> content = result.getContent().stream()
                .map(grupoMapper::toMensajeResponse)
                .toList();

        return PageResponse.<MensajeGrupoResponse>builder()
                .content(content)
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();
    }

    @Transactional
    public MensajeGrupoResponse enviarMensaje(UUID grupoId, EnviarMensajeRequest request) {
        UsuarioEntity usuario = getCurrentUsuario();
        validarMembresia(grupoId, usuario.getId());

        GrupoEstudioEntity grupo = grupoRepository.findById(grupoId)
                .orElseThrow(() -> new EntityNotFoundException("Grupo no encontrado"));

        MensajeGrupoEntity mensaje = new MensajeGrupoEntity();
        mensaje.setGrupo(grupo);
        mensaje.setUsuario(usuario);
        mensaje.setContenido(request.getContenido().trim());

        MensajeGrupoEntity saved = mensajeRepository.save(mensaje);
        saved.setUsuario(usuario);
        MensajeGrupoResponse response = grupoMapper.toMensajeResponse(saved);
        messagingTemplate.convertAndSend("/topic/grupos/" + grupoId, response);

        miembroRepository.findByGrupoIdWithUsuario(grupoId).stream()
                .filter(m -> !m.getUsuario().getId().equals(usuario.getId()))
                .forEach(m -> notificacionService.notificarMensajeGrupo(
                        m.getUsuario().getId(),
                        grupo.getNombre(),
                        usuario.getNombre(),
                        grupoId));

        return response;
    }

    private GrupoResponse toGrupoResponse(GrupoEstudioEntity grupo, UUID usuarioId) {
        long miembros = miembroRepository.countByGrupoId(grupo.getId());
        var membresia = miembroRepository.findByGrupoIdAndUsuarioId(grupo.getId(), usuarioId);
        boolean esMiembro = membresia.isPresent();
        RolGrupo rol = membresia.map(GrupoMiembroEntity::getRol).orElse(null);
        return grupoMapper.toResponse(grupo, miembros, esMiembro, rol);
    }

    private void validarAccesoGrupo(GrupoEstudioEntity grupo, UUID usuarioId) {
        if (Boolean.TRUE.equals(grupo.getPrivado())
                && !miembroRepository.existsByGrupoIdAndUsuarioId(grupo.getId(), usuarioId)) {
            throw new BusinessException("FORBIDDEN", "No tienes acceso a este grupo privado");
        }
    }

    private void validarMembresia(UUID grupoId, UUID usuarioId) {
        if (!miembroRepository.existsByGrupoIdAndUsuarioId(grupoId, usuarioId)) {
            throw new BusinessException("NOT_MEMBER", "Debes ser miembro del grupo para realizar esta acción");
        }
    }

    private GrupoEstudioEntity findGrupoWithDetails(UUID grupoId) {
        return grupoRepository.findByIdWithDetails(grupoId)
                .orElseThrow(() -> new EntityNotFoundException("Grupo no encontrado"));
    }

    private void agregarMiembro(GrupoEstudioEntity grupo, UsuarioEntity usuario, RolGrupo rol) {
        GrupoMiembroEntity miembro = new GrupoMiembroEntity();
        miembro.setId(new GrupoMiembroId(grupo.getId(), usuario.getId()));
        miembro.setGrupo(grupo);
        miembro.setUsuario(usuario);
        miembro.setRol(rol);
        miembroRepository.save(miembro);
    }

    private String generarCodigoInvitacion() {
        String codigo;
        do {
            StringBuilder builder = new StringBuilder(6);
            for (int i = 0; i < 6; i++) {
                builder.append(CODIGO_CHARS.charAt(RANDOM.nextInt(CODIGO_CHARS.length())));
            }
            codigo = builder.toString();
        } while (grupoRepository.existsByCodigoInvitacion(codigo));
        return codigo;
    }

    private UUID getCurrentUserId() {
        return getCurrentUsuario().getId();
    }

    private UsuarioEntity getCurrentUsuario() {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();
        return usuarioRepository.findById(principal.getId())
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
    }
}
