package cl.duoc.connect.application.service;

import cl.duoc.connect.application.dto.request.InvitarCompaneroRequest;
import cl.duoc.connect.application.dto.response.GrupoInvitableResponse;
import cl.duoc.connect.application.dto.response.InvitacionDirectaResponse;
import cl.duoc.connect.application.dto.response.RespuestaInvitacionResponse;
import cl.duoc.connect.domain.enums.EstadoInvitacion;
import cl.duoc.connect.domain.enums.RolGrupo;
import cl.duoc.connect.domain.exception.BusinessException;
import cl.duoc.connect.domain.exception.EntityNotFoundException;
import cl.duoc.connect.infrastructure.persistence.entity.GrupoEstudioEntity;
import cl.duoc.connect.infrastructure.persistence.entity.GrupoMiembroEntity;
import cl.duoc.connect.infrastructure.persistence.entity.GrupoMiembroId;
import cl.duoc.connect.infrastructure.persistence.entity.InvitacionDirectaEntity;
import cl.duoc.connect.infrastructure.persistence.entity.UsuarioEntity;
import cl.duoc.connect.infrastructure.persistence.repository.GrupoEstudioJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.GrupoMiembroJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.InvitacionDirectaJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.UsuarioJpaRepository;
import cl.duoc.connect.infrastructure.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Invitar a un compañero a uno de mis grupos desde su perfil, sin conocer su correo.
 * La persona invitada recibe una notificación y decide si acepta (entra al grupo) o rechaza;
 * en ambos casos quien invitó recibe la respuesta.
 */
@Service
@RequiredArgsConstructor
public class InvitacionDirectaService {

    private final InvitacionDirectaJpaRepository invitacionRepository;
    private final GrupoEstudioJpaRepository grupoRepository;
    private final GrupoMiembroJpaRepository miembroRepository;
    private final UsuarioJpaRepository usuarioRepository;
    private final CompaneroService companeroService;
    private final NotificacionService notificacionService;

    /** Por qué no se puede invitar a alguien a un grupo: código de error y texto para mostrar. */
    private record Impedimento(String code, String motivo) {
    }

    /** Mis grupos, indicando a cuáles puedo invitar a este compañero. */
    @Transactional(readOnly = true)
    public List<GrupoInvitableResponse> gruposInvitables(UUID companeroId) {
        UsuarioEntity actual = getCurrentUsuario();
        validarNoEsUnoMismo(actual, companeroId);
        UsuarioEntity companero = companeroService.obtenerCompaneroVisible(companeroId);

        return miembroRepository.findByUsuarioIdWithGrupo(actual.getId()).stream()
                .map(GrupoMiembroEntity::getGrupo)
                .map(grupo -> toGrupoInvitable(grupo, companero.getId()))
                .toList();
    }

    @Transactional
    public void invitar(UUID companeroId, InvitarCompaneroRequest request) {
        UsuarioEntity invitador = getCurrentUsuario();
        validarNoEsUnoMismo(invitador, companeroId);
        UsuarioEntity invitado = companeroService.obtenerCompaneroVisible(companeroId);

        GrupoEstudioEntity grupo = grupoRepository.findById(request.getGrupoId())
                .orElseThrow(() -> new EntityNotFoundException("Grupo no encontrado"));
        if (!miembroRepository.existsByGrupoIdAndUsuarioId(grupo.getId(), invitador.getId())) {
            throw new BusinessException("NOT_MEMBER", "Solo puedes invitar a grupos de los que eres integrante");
        }

        Impedimento impedimento = impedimento(grupo, invitado.getId());
        if (impedimento != null) {
            throw new BusinessException(impedimento.code(), impedimento.motivo());
        }

        InvitacionDirectaEntity invitacion = new InvitacionDirectaEntity();
        invitacion.setGrupo(grupo);
        invitacion.setInvitador(invitador);
        invitacion.setInvitado(invitado);
        invitacion.setMensaje(StringUtils.hasText(request.getMensaje()) ? request.getMensaje().trim() : null);
        invitacion.setEstado(EstadoInvitacion.PENDIENTE);
        invitacionRepository.save(invitacion);

        notificacionService.notificarInvitacionDirecta(invitado, grupo.getNombre(), invitador.getNombre());
    }

    /** Invitaciones pendientes que recibí. */
    @Transactional(readOnly = true)
    public List<InvitacionDirectaResponse> listarRecibidas() {
        UUID usuarioId = getCurrentUsuario().getId();
        return invitacionRepository.findRecibidas(usuarioId, EstadoInvitacion.PENDIENTE).stream()
                .map(this::toResponse)
                .toList();
    }

    /** Acepta la invitación: entra al grupo (aunque sea privado) si todavía hay cupo. */
    @Transactional
    public RespuestaInvitacionResponse aceptar(UUID invitacionId) {
        UsuarioEntity usuario = getCurrentUsuario();
        InvitacionDirectaEntity invitacion = obtenerPendientePropia(invitacionId, usuario);
        GrupoEstudioEntity grupo = invitacion.getGrupo();

        if (!miembroRepository.existsByGrupoIdAndUsuarioId(grupo.getId(), usuario.getId())) {
            if (miembroRepository.countByGrupoId(grupo.getId()) >= grupo.getMaxMiembros()) {
                throw new BusinessException("GROUP_FULL",
                        "El grupo se llenó antes de que respondieras. Puedes rechazar la invitación.");
            }
            GrupoMiembroEntity miembro = new GrupoMiembroEntity();
            miembro.setId(new GrupoMiembroId(grupo.getId(), usuario.getId()));
            miembro.setGrupo(grupo);
            miembro.setUsuario(usuario);
            miembro.setRol(RolGrupo.MIEMBRO);
            miembroRepository.save(miembro);
        }

        responder(invitacion, EstadoInvitacion.ACEPTADA);
        notificacionService.notificarRespuestaInvitacion(
                invitacion.getInvitador(), usuario.getNombre(), grupo.getNombre(), true, grupo.getId());
        return new RespuestaInvitacionResponse(grupo.getId(), grupo.getNombre(), EstadoInvitacion.ACEPTADA.name());
    }

    @Transactional
    public RespuestaInvitacionResponse rechazar(UUID invitacionId) {
        UsuarioEntity usuario = getCurrentUsuario();
        InvitacionDirectaEntity invitacion = obtenerPendientePropia(invitacionId, usuario);
        GrupoEstudioEntity grupo = invitacion.getGrupo();

        responder(invitacion, EstadoInvitacion.RECHAZADA);
        notificacionService.notificarRespuestaInvitacion(
                invitacion.getInvitador(), usuario.getNombre(), grupo.getNombre(), false, grupo.getId());
        return new RespuestaInvitacionResponse(grupo.getId(), grupo.getNombre(), EstadoInvitacion.RECHAZADA.name());
    }

    private void responder(InvitacionDirectaEntity invitacion, EstadoInvitacion estado) {
        invitacion.setEstado(estado);
        invitacion.setRespondidaAt(Instant.now());
        invitacionRepository.save(invitacion);
    }

    /** Solo la persona invitada puede ver o responder su invitación; para el resto no existe. */
    private InvitacionDirectaEntity obtenerPendientePropia(UUID invitacionId, UsuarioEntity usuario) {
        InvitacionDirectaEntity invitacion = invitacionRepository.findByIdWithDetails(invitacionId)
                .filter(i -> i.getInvitado().getId().equals(usuario.getId()))
                .orElseThrow(() -> new EntityNotFoundException("Invitación no encontrada"));
        if (invitacion.getEstado() != EstadoInvitacion.PENDIENTE) {
            throw new BusinessException("INVITACION_RESPONDIDA", "Ya respondiste esta invitación");
        }
        return invitacion;
    }

    private GrupoInvitableResponse toGrupoInvitable(GrupoEstudioEntity grupo, UUID companeroId) {
        Impedimento impedimento = impedimento(grupo, companeroId);
        return GrupoInvitableResponse.builder()
                .grupoId(grupo.getId())
                .nombre(grupo.getNombre())
                .miembros(miembroRepository.countByGrupoId(grupo.getId()))
                .maxMiembros(grupo.getMaxMiembros())
                .disponible(impedimento == null)
                .motivo(impedimento != null ? impedimento.motivo() : null)
                .build();
    }

    /** null si se puede invitar al compañero a este grupo. */
    private Impedimento impedimento(GrupoEstudioEntity grupo, UUID companeroId) {
        if (miembroRepository.existsByGrupoIdAndUsuarioId(grupo.getId(), companeroId)) {
            return new Impedimento("ALREADY_MEMBER", "Ya es integrante de este grupo");
        }
        if (invitacionRepository.existsByGrupoIdAndInvitadoIdAndEstado(
                grupo.getId(), companeroId, EstadoInvitacion.PENDIENTE)) {
            return new Impedimento("INVITACION_PENDIENTE", "Ya tiene una invitación pendiente a este grupo");
        }
        if (miembroRepository.countByGrupoId(grupo.getId()) >= grupo.getMaxMiembros()) {
            return new Impedimento("GROUP_FULL", "El grupo está lleno");
        }
        return null;
    }

    private void validarNoEsUnoMismo(UsuarioEntity actual, UUID companeroId) {
        if (actual.getId().equals(companeroId)) {
            throw new BusinessException("VALIDATION_ERROR", "No puedes invitarte a ti mismo");
        }
    }

    private InvitacionDirectaResponse toResponse(InvitacionDirectaEntity invitacion) {
        GrupoEstudioEntity grupo = invitacion.getGrupo();
        UsuarioEntity invitador = invitacion.getInvitador();
        return InvitacionDirectaResponse.builder()
                .id(invitacion.getId())
                .grupoId(grupo.getId())
                .grupoNombre(grupo.getNombre())
                .grupoDescripcion(grupo.getDescripcion())
                .carreraNombre(grupo.getCarrera() != null ? grupo.getCarrera().getNombre() : null)
                .asignaturaNombre(grupo.getAsignatura() != null ? grupo.getAsignatura().getNombre() : null)
                .miembros(miembroRepository.countByGrupoId(grupo.getId()))
                .maxMiembros(grupo.getMaxMiembros())
                .invitadorId(invitador.getId())
                .invitadorNombre(invitador.getNombre())
                .invitadorFotoUrl(invitador.getFotoUrl())
                .mensaje(invitacion.getMensaje())
                .estado(invitacion.getEstado().name())
                .createdAt(invitacion.getCreatedAt())
                .build();
    }

    private UsuarioEntity getCurrentUsuario() {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();
        return usuarioRepository.findById(principal.getId())
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
    }
}
