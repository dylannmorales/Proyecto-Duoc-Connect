package cl.duoc.connect.application.service;

import cl.duoc.connect.application.dto.request.CrearPreguntaRequest;
import cl.duoc.connect.application.dto.response.PageResponse;
import cl.duoc.connect.application.dto.response.PreguntaResponse;
import cl.duoc.connect.application.dto.response.RespuestaResponse;
import cl.duoc.connect.application.dto.response.VotoResponse;
import cl.duoc.connect.application.port.out.FileStoragePort;
import cl.duoc.connect.domain.exception.BusinessException;
import cl.duoc.connect.domain.exception.EntityNotFoundException;
import cl.duoc.connect.infrastructure.persistence.entity.AsignaturaEntity;
import cl.duoc.connect.infrastructure.persistence.entity.CarreraEntity;
import cl.duoc.connect.infrastructure.persistence.entity.PreguntaEntity;
import cl.duoc.connect.infrastructure.persistence.entity.RespuestaEntity;
import cl.duoc.connect.infrastructure.persistence.entity.UsuarioEntity;
import cl.duoc.connect.infrastructure.persistence.repository.AsignaturaJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.CarreraJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.PreguntaJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.RespuestaJpaRepository;
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

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ForoService {

    private final PreguntaJpaRepository preguntaRepository;
    private final RespuestaJpaRepository respuestaRepository;
    private final CarreraJpaRepository carreraRepository;
    private final AsignaturaJpaRepository asignaturaRepository;
    private final UsuarioJpaRepository usuarioRepository;
    private final NotificacionService notificacionService;
    private final FileStoragePort fileStoragePort;

    @Transactional
    public PreguntaResponse crearPregunta(CrearPreguntaRequest request, MultipartFile imagen) {
        UsuarioEntity usuario = getCurrentUsuario();

        CarreraEntity carrera = carreraRepository.findById(request.getCarreraId())
                .orElseThrow(() -> new BusinessException("CARRERA_NOT_FOUND", "Carrera no encontrada"));

        AsignaturaEntity asignatura = null;
        if (!request.isTematicaGeneral()) {
            if (request.getAsignaturaId() == null) {
                throw new BusinessException("VALIDATION_ERROR",
                        "Selecciona una asignatura o marca la pregunta como temática general");
            }
            asignatura = asignaturaRepository.findByIdWithCarrera(request.getAsignaturaId())
                    .orElseThrow(() -> new BusinessException("ASIGNATURA_NOT_FOUND", "Asignatura no encontrada"));
            if (!asignatura.getCarrera().getId().equals(carrera.getId())) {
                throw new BusinessException("ASIGNATURA_INVALID",
                        "La asignatura no pertenece a la carrera seleccionada");
            }
        }

        PreguntaEntity pregunta = new PreguntaEntity();
        pregunta.setTitulo(request.getTitulo().trim());
        pregunta.setContenido(request.getContenido().trim());
        pregunta.setUsuario(usuario);
        pregunta.setCarrera(carrera);
        pregunta.setAsignatura(asignatura);
        pregunta.setTematicaGeneral(request.isTematicaGeneral());
        if (imagen != null && !imagen.isEmpty()) {
            pregunta.setImagenUrl(fileStoragePort.storeForoImage(imagen));
        }
        PreguntaEntity saved = preguntaRepository.save(pregunta);

        return toResponse(saved, 0, false, false, null);
    }

    @Transactional(readOnly = true)
    public PageResponse<PreguntaResponse> buscarPreguntas(
            UUID carreraId,
            UUID asignaturaId,
            String q,
            String estado,
            String orden,
            int page,
            int size) {

        Sort sort = "votos".equalsIgnoreCase(orden)
                ? Sort.by(Sort.Order.desc("votos"), Sort.Order.desc("createdAt"))
                : Sort.by(Sort.Direction.DESC, "createdAt");
        Pageable pageable = PageRequest.of(page, size, sort);

        String pattern = StringUtils.hasText(q) ? "%" + q.trim().toLowerCase(Locale.ROOT) + "%" : "%";
        String estadoNormalizado = estado == null ? "TODAS" : estado.toUpperCase(Locale.ROOT);
        if (!Set.of("TODAS", "RESUELTAS", "ABIERTAS").contains(estadoNormalizado)) {
            estadoNormalizado = "TODAS";
        }

        Page<PreguntaEntity> result = preguntaRepository.buscar(carreraId, asignaturaId, pattern, estadoNormalizado, pageable);

        List<UUID> ids = result.getContent().stream().map(PreguntaEntity::getId).toList();
        Map<UUID, long[]> resumen = new HashMap<>();
        Set<UUID> votadas = new HashSet<>();
        if (!ids.isEmpty()) {
            for (Object[] row : respuestaRepository.resumenPorPregunta(ids)) {
                resumen.put((UUID) row[0], new long[]{(Long) row[1], ((Number) row[2]).longValue()});
            }
            votadas.addAll(preguntaRepository.votadasPor(getCurrentUserId(), ids));
        }

        List<PreguntaResponse> content = result.getContent().stream()
                .map(p -> {
                    long[] r = resumen.getOrDefault(p.getId(), new long[]{0, 0});
                    return toResponse(p, (int) r[0], r[1] > 0, votadas.contains(p.getId()), null);
                })
                .toList();

        return PageResponse.<PreguntaResponse>builder()
                .content(content)
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public PreguntaResponse obtenerPregunta(UUID id) {
        PreguntaEntity pregunta = findPregunta(id);
        UUID usuarioId = getCurrentUserId();

        List<RespuestaEntity> respuestas = respuestaRepository.findByPreguntaId(id);
        Set<UUID> votadas = respuestas.isEmpty()
                ? Set.of()
                : new HashSet<>(respuestaRepository.votadasPor(
                        usuarioId, respuestas.stream().map(RespuestaEntity::getId).toList()));

        List<RespuestaResponse> respuestasResponse = respuestas.stream()
                .map(r -> toResponse(r, votadas.contains(r.getId())))
                .toList();
        boolean resuelta = respuestas.stream().anyMatch(r -> Boolean.TRUE.equals(r.getAceptada()));
        boolean votada = !preguntaRepository.votadasPor(usuarioId, List.of(id)).isEmpty();

        return toResponse(pregunta, respuestas.size(), resuelta, votada, respuestasResponse);
    }

    @Transactional
    public RespuestaResponse responder(UUID preguntaId, String contenido) {
        PreguntaEntity pregunta = findPregunta(preguntaId);
        UsuarioEntity usuario = getCurrentUsuario();

        RespuestaEntity respuesta = new RespuestaEntity();
        respuesta.setPregunta(pregunta);
        respuesta.setUsuario(usuario);
        respuesta.setContenido(contenido.trim());
        RespuestaEntity saved = respuestaRepository.save(respuesta);

        if (!pregunta.getUsuario().getId().equals(usuario.getId())) {
            notificacionService.notificarRespuestaForo(
                    pregunta.getUsuario(), pregunta.getTitulo(), usuario.getNombre(), pregunta.getId());
        }

        return toResponse(saved, false);
    }

    @Transactional
    public VotoResponse votarPregunta(UUID id) {
        PreguntaEntity pregunta = findPregunta(id);
        UUID usuarioId = getCurrentUserId();
        if (pregunta.getUsuario().getId().equals(usuarioId)) {
            throw new BusinessException("VOTE_OWN_CONTENT", "No puedes votar tu propia pregunta");
        }

        boolean votado;
        if (preguntaRepository.insertarVoto(id, usuarioId) == 1) {
            preguntaRepository.ajustarVotos(id, 1);
            votado = true;
        } else {
            preguntaRepository.eliminarVoto(id, usuarioId);
            preguntaRepository.ajustarVotos(id, -1);
            votado = false;
        }
        return new VotoResponse(findPregunta(id).getVotos(), votado);
    }

    @Transactional
    public VotoResponse votarRespuesta(UUID id) {
        RespuestaEntity respuesta = findRespuesta(id);
        UUID usuarioId = getCurrentUserId();
        if (respuesta.getUsuario().getId().equals(usuarioId)) {
            throw new BusinessException("VOTE_OWN_CONTENT", "No puedes votar tu propia respuesta");
        }

        boolean votado;
        if (respuestaRepository.insertarVoto(id, usuarioId) == 1) {
            respuestaRepository.ajustarVotos(id, 1);
            votado = true;
        } else {
            respuestaRepository.eliminarVoto(id, usuarioId);
            respuestaRepository.ajustarVotos(id, -1);
            votado = false;
        }
        return new VotoResponse(findRespuesta(id).getVotos(), votado);
    }

    /** Marca la respuesta como la solución (y quita la anterior); si ya lo era, la desmarca. */
    @Transactional
    public RespuestaResponse aceptarRespuesta(UUID id) {
        RespuestaEntity respuesta = findRespuesta(id);
        UUID usuarioId = getCurrentUserId();
        if (!respuesta.getPregunta().getUsuario().getId().equals(usuarioId)) {
            throw new BusinessException("ACCEPT_FORBIDDEN", "Solo quien hizo la pregunta puede aceptar una respuesta");
        }

        boolean estabaAceptada = Boolean.TRUE.equals(respuesta.getAceptada());
        UUID preguntaId = respuesta.getPregunta().getId();
        respuestaRepository.quitarAceptadas(preguntaId);

        RespuestaEntity actual = findRespuesta(id);
        actual.setAceptada(!estabaAceptada);
        respuestaRepository.save(actual);

        boolean votada = !respuestaRepository.votadasPor(usuarioId, List.of(id)).isEmpty();
        return toResponse(actual, votada);
    }

    private PreguntaEntity findPregunta(UUID id) {
        return preguntaRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new EntityNotFoundException("Pregunta no encontrada"));
    }

    private RespuestaEntity findRespuesta(UUID id) {
        return respuestaRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new EntityNotFoundException("Respuesta no encontrada"));
    }

    private PreguntaResponse toResponse(
            PreguntaEntity p, int totalRespuestas, boolean resuelta, boolean votado, List<RespuestaResponse> respuestas) {
        AsignaturaEntity asignatura = p.getAsignatura();
        return PreguntaResponse.builder()
                .id(p.getId())
                .titulo(p.getTitulo())
                .contenido(p.getContenido())
                .usuarioId(p.getUsuario().getId())
                .usuarioNombre(p.getUsuario().getNombre())
                .carreraId(p.getCarrera().getId())
                .carreraNombre(p.getCarrera().getNombre())
                .asignaturaId(asignatura == null ? null : asignatura.getId())
                .asignaturaNombre(asignatura == null ? null : asignatura.getNombre())
                .tematicaGeneral(Boolean.TRUE.equals(p.getTematicaGeneral()))
                .imagenUrl(p.getImagenUrl())
                .votos(p.getVotos())
                .votado(votado)
                .totalRespuestas(totalRespuestas)
                .resuelta(resuelta)
                .createdAt(p.getCreatedAt())
                .respuestas(respuestas)
                .build();
    }

    private RespuestaResponse toResponse(RespuestaEntity r, boolean votado) {
        return RespuestaResponse.builder()
                .id(r.getId())
                .preguntaId(r.getPregunta().getId())
                .usuarioId(r.getUsuario().getId())
                .usuarioNombre(r.getUsuario().getNombre())
                .contenido(r.getContenido())
                .votos(r.getVotos())
                .votado(votado)
                .aceptada(Boolean.TRUE.equals(r.getAceptada()))
                .createdAt(r.getCreatedAt())
                .build();
    }

    private UUID getCurrentUserId() {
        return ((UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal()).getId();
    }

    private UsuarioEntity getCurrentUsuario() {
        return usuarioRepository.findById(getCurrentUserId())
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
    }
}
