package cl.duoc.connect.application.service;

import cl.duoc.connect.application.dto.request.UpdatePerfilProyectoRequest;
import cl.duoc.connect.application.dto.response.CompaneroRecomendacionResponse;
import cl.duoc.connect.application.dto.response.PerfilProyectoResponse;
import cl.duoc.connect.domain.enums.VisibilidadPerfil;
import cl.duoc.connect.domain.exception.BusinessException;
import cl.duoc.connect.domain.exception.EntityNotFoundException;
import cl.duoc.connect.domain.service.MatchingService;
import cl.duoc.connect.domain.service.MatchingService.DisponibilidadSlot;
import cl.duoc.connect.domain.service.MatchingService.MatchingProfile;
import cl.duoc.connect.infrastructure.persistence.entity.AsignaturaEntity;
import cl.duoc.connect.infrastructure.persistence.entity.DisponibilidadEntity;
import cl.duoc.connect.infrastructure.persistence.entity.HabilidadEntity;
import cl.duoc.connect.infrastructure.persistence.entity.PerfilProyectoEntity;
import cl.duoc.connect.infrastructure.persistence.entity.UsuarioAsignaturaEntity;
import cl.duoc.connect.infrastructure.persistence.entity.UsuarioAsignaturaId;
import cl.duoc.connect.infrastructure.persistence.entity.UsuarioEntity;
import cl.duoc.connect.infrastructure.persistence.entity.UsuarioHabilidadEntity;
import cl.duoc.connect.infrastructure.persistence.entity.UsuarioHabilidadId;
import cl.duoc.connect.infrastructure.persistence.repository.AsignaturaJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.DisponibilidadJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.HabilidadJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.PerfilProyectoJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.UsuarioAsignaturaJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.UsuarioHabilidadJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.UsuarioJpaRepository;
import cl.duoc.connect.infrastructure.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CompaneroService {

    private final PerfilProyectoJpaRepository perfilRepository;
    private final UsuarioAsignaturaJpaRepository usuarioAsignaturaRepository;
    private final UsuarioHabilidadJpaRepository usuarioHabilidadRepository;
    private final DisponibilidadJpaRepository disponibilidadRepository;
    private final AsignaturaJpaRepository asignaturaRepository;
    private final HabilidadJpaRepository habilidadRepository;
    private final UsuarioJpaRepository usuarioRepository;
    private final MatchingService matchingService;

    @Transactional(readOnly = true)
    public PerfilProyectoResponse obtenerMiPerfil() {
        UsuarioEntity usuario = getCurrentUsuario();
        PerfilProyectoEntity perfil = perfilRepository.findByUsuarioIdWithUsuario(usuario.getId())
                .orElse(null);
        return buildPerfilResponse(usuario, perfil);
    }

    @Transactional
    public PerfilProyectoResponse actualizarMiPerfil(UpdatePerfilProyectoRequest request) {
        UsuarioEntity usuario = getCurrentUsuario();

        PerfilProyectoEntity perfil = perfilRepository.findById(usuario.getId())
                .orElseGet(() -> {
                    PerfilProyectoEntity nuevo = new PerfilProyectoEntity();
                    nuevo.setUsuario(usuario);
                    return nuevo;
                });

        perfil.setBio(StringUtils.hasText(request.getBio()) ? request.getBio().trim() : null);
        perfil.setBuscandoCompanero(Boolean.TRUE.equals(request.getBuscandoCompanero()));
        perfil.setVisibilidad(request.getVisibilidad() != null
                ? request.getVisibilidad()
                : VisibilidadPerfil.SOLO_CARRERA);

        perfilRepository.save(perfil);

        actualizarAsignaturas(usuario, request.getAsignaturaIds());
        actualizarHabilidades(usuario, request.getHabilidades());
        actualizarDisponibilidades(usuario, request.getDisponibilidades());

        return buildPerfilResponse(usuario, perfil);
    }

    @Transactional(readOnly = true)
    public List<CompaneroRecomendacionResponse> obtenerRecomendaciones(int limit) {
        return buscarCompaneros(null, null, limit);
    }

    @Transactional(readOnly = true)
    public List<CompaneroRecomendacionResponse> buscarCompaneros(UUID asignaturaId, UUID habilidadId, int limit) {
        UsuarioEntity current = getCurrentUsuario();
        MatchingProfile currentProfile = buildMatchingProfile(current.getId(), current.getCarrera().getId());

        UUID carreraId = current.getCarrera().getId();
        List<PerfilProyectoEntity> candidatos = perfilRepository.findCandidatos(current.getId()).stream()
                .filter(p -> esVisibleParaUsuario(p, carreraId))
                .toList();

        return candidatos.stream()
                .filter(p -> cumpleFiltros(p.getUsuario().getId(), asignaturaId, habilidadId))
                .map(p -> toRecomendacion(p, currentProfile))
                .sorted(Comparator.comparingInt(CompaneroRecomendacionResponse::getMatchScore).reversed())
                .limit(limit)
                .toList();
    }

    private boolean esVisibleParaUsuario(PerfilProyectoEntity perfil, UUID carreraActualId) {
        if (perfil.getVisibilidad() == VisibilidadPerfil.PUBLICO) {
            return true;
        }
        return perfil.getUsuario().getCarrera().getId().equals(carreraActualId);
    }

    private boolean cumpleFiltros(UUID usuarioId, UUID asignaturaId, UUID habilidadId) {
        if (asignaturaId != null
                && !usuarioAsignaturaRepository.existsByUsuario_IdAndAsignatura_Id(usuarioId, asignaturaId)) {
            return false;
        }
        if (habilidadId != null
                && !usuarioHabilidadRepository.existsByUsuario_IdAndHabilidad_Id(usuarioId, habilidadId)) {
            return false;
        }
        return true;
    }

    private CompaneroRecomendacionResponse toRecomendacion(
            PerfilProyectoEntity perfil,
            MatchingProfile currentProfile) {

        UsuarioEntity usuario = perfil.getUsuario();
        MatchingProfile candidateProfile = buildMatchingProfile(usuario.getId(), usuario.getCarrera().getId());
        int score = matchingService.calcularScore(currentProfile, candidateProfile);
        int asignaturasComun = matchingService.contarAsignaturasEnComun(currentProfile, candidateProfile);

        List<CompaneroRecomendacionResponse.HabilidadDestacada> habilidades = usuarioHabilidadRepository
                .findByUsuarioIdWithHabilidad(usuario.getId()).stream()
                .limit(5)
                .map(h -> CompaneroRecomendacionResponse.HabilidadDestacada.builder()
                        .nombre(h.getHabilidad().getNombre())
                        .nivel(h.getNivel())
                        .build())
                .toList();

        return CompaneroRecomendacionResponse.builder()
                .usuarioId(usuario.getId())
                .nombre(usuario.getNombre())
                .fotoUrl(usuario.getFotoUrl())
                .carreraNombre(usuario.getCarrera().getNombre())
                .sedeNombre(usuario.getSede().getNombre())
                .semestre(usuario.getSemestre())
                .bio(perfil.getBio())
                .matchScore(score)
                .asignaturasEnComun(asignaturasComun)
                .habilidadesDestacadas(habilidades)
                .build();
    }

    private MatchingProfile buildMatchingProfile(UUID usuarioId, UUID carreraId) {
        Set<UUID> asignaturas = usuarioAsignaturaRepository.findByUsuarioIdWithAsignatura(usuarioId).stream()
                .map(a -> a.getAsignatura().getId())
                .collect(Collectors.toSet());

        Set<UUID> habilidades = usuarioHabilidadRepository.findByUsuarioIdWithHabilidad(usuarioId).stream()
                .map(h -> h.getHabilidad().getId())
                .collect(Collectors.toSet());

        List<DisponibilidadSlot> slots = disponibilidadRepository
                .findByUsuario_IdOrderByDiaSemanaAscHoraInicioAsc(usuarioId).stream()
                .filter(d -> d.getDiaSemana() != null && d.getHoraInicio() != null && d.getHoraFin() != null)
                .map(d -> new DisponibilidadSlot(d.getDiaSemana(), d.getHoraInicio(), d.getHoraFin()))
                .toList();

        return new MatchingProfile(carreraId, asignaturas, habilidades, slots);
    }

    private PerfilProyectoResponse buildPerfilResponse(UsuarioEntity usuario, PerfilProyectoEntity perfil) {
        List<PerfilProyectoResponse.AsignaturaItem> asignaturas = usuarioAsignaturaRepository
                .findByUsuarioIdWithAsignatura(usuario.getId()).stream()
                .map(a -> PerfilProyectoResponse.AsignaturaItem.builder()
                        .id(a.getAsignatura().getId())
                        .nombre(a.getAsignatura().getNombre())
                        .build())
                .toList();

        List<PerfilProyectoResponse.HabilidadItem> habilidades = usuarioHabilidadRepository
                .findByUsuarioIdWithHabilidad(usuario.getId()).stream()
                .map(h -> PerfilProyectoResponse.HabilidadItem.builder()
                        .id(h.getHabilidad().getId())
                        .nombre(h.getHabilidad().getNombre())
                        .nivel(h.getNivel())
                        .build())
                .toList();

        List<PerfilProyectoResponse.DisponibilidadItem> disponibilidades = disponibilidadRepository
                .findByUsuario_IdOrderByDiaSemanaAscHoraInicioAsc(usuario.getId()).stream()
                .map(d -> PerfilProyectoResponse.DisponibilidadItem.builder()
                        .diaSemana(d.getDiaSemana())
                        .horaInicio(d.getHoraInicio())
                        .horaFin(d.getHoraFin())
                        .build())
                .toList();

        return PerfilProyectoResponse.builder()
                .usuarioId(usuario.getId())
                .nombre(usuario.getNombre())
                .fotoUrl(usuario.getFotoUrl())
                .carreraNombre(usuario.getCarrera().getNombre())
                .sedeNombre(usuario.getSede().getNombre())
                .semestre(usuario.getSemestre())
                .buscandoCompanero(perfil != null && Boolean.TRUE.equals(perfil.getBuscandoCompanero()))
                .bio(perfil != null ? perfil.getBio() : null)
                .visibilidad(perfil != null ? perfil.getVisibilidad() : VisibilidadPerfil.SOLO_CARRERA)
                .asignaturas(asignaturas)
                .habilidades(habilidades)
                .disponibilidades(disponibilidades)
                .build();
    }

    private void actualizarAsignaturas(UsuarioEntity usuario, List<UUID> asignaturaIds) {
        usuarioAsignaturaRepository.deleteByUsuario_Id(usuario.getId());
        if (asignaturaIds == null || asignaturaIds.isEmpty()) {
            return;
        }

        Set<UUID> unicos = new HashSet<>(asignaturaIds);
        for (UUID asignaturaId : unicos) {
            AsignaturaEntity asignatura = asignaturaRepository.findById(asignaturaId)
                    .orElseThrow(() -> new BusinessException("ASIGNATURA_NOT_FOUND", "Asignatura no encontrada"));

            UsuarioAsignaturaEntity entity = new UsuarioAsignaturaEntity();
            entity.setId(new UsuarioAsignaturaId(usuario.getId(), asignatura.getId()));
            entity.setUsuario(usuario);
            entity.setAsignatura(asignatura);
            usuarioAsignaturaRepository.save(entity);
        }
    }

    private void actualizarHabilidades(UsuarioEntity usuario, List<UpdatePerfilProyectoRequest.HabilidadPerfilRequest> habilidades) {
        usuarioHabilidadRepository.deleteByUsuario_Id(usuario.getId());
        if (habilidades == null || habilidades.isEmpty()) {
            return;
        }

        Set<UUID> agregadas = new HashSet<>();
        for (UpdatePerfilProyectoRequest.HabilidadPerfilRequest item : habilidades) {
            if (!agregadas.add(item.getHabilidadId())) {
                continue;
            }

            HabilidadEntity habilidad = habilidadRepository.findById(item.getHabilidadId())
                    .orElseThrow(() -> new BusinessException("HABILIDAD_NOT_FOUND", "Habilidad no encontrada"));

            UsuarioHabilidadEntity entity = new UsuarioHabilidadEntity();
            entity.setId(new UsuarioHabilidadId(usuario.getId(), habilidad.getId()));
            entity.setUsuario(usuario);
            entity.setHabilidad(habilidad);
            entity.setNivel(item.getNivel());
            usuarioHabilidadRepository.save(entity);
        }
    }

    private void actualizarDisponibilidades(
            UsuarioEntity usuario,
            List<UpdatePerfilProyectoRequest.DisponibilidadRequest> disponibilidades) {

        disponibilidadRepository.deleteByUsuario_Id(usuario.getId());
        if (disponibilidades == null || disponibilidades.isEmpty()) {
            return;
        }

        for (UpdatePerfilProyectoRequest.DisponibilidadRequest item : disponibilidades) {
            if (!item.getHoraFin().isAfter(item.getHoraInicio())) {
                throw new BusinessException("HORARIO_INVALIDO", "La hora de fin debe ser posterior a la de inicio");
            }

            DisponibilidadEntity entity = new DisponibilidadEntity();
            entity.setUsuario(usuario);
            entity.setDiaSemana(item.getDiaSemana());
            entity.setHoraInicio(item.getHoraInicio());
            entity.setHoraFin(item.getHoraFin());
            disponibilidadRepository.save(entity);
        }
    }

    private UsuarioEntity getCurrentUsuario() {
        UserPrincipal principal = (UserPrincipal) org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();

        return usuarioRepository.findByIdWithRelations(principal.getId())
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
    }
}
