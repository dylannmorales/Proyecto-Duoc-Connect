package cl.duoc.connect.application.service;

import cl.duoc.connect.application.dto.response.NotificacionResponse;
import cl.duoc.connect.application.dto.response.PageResponse;
import cl.duoc.connect.domain.enums.TipoNotificacion;
import cl.duoc.connect.domain.exception.EntityNotFoundException;
import cl.duoc.connect.infrastructure.persistence.entity.NotificacionEntity;
import cl.duoc.connect.infrastructure.persistence.entity.UsuarioEntity;
import cl.duoc.connect.infrastructure.persistence.repository.NotificacionJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.UsuarioJpaRepository;
import cl.duoc.connect.infrastructure.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificacionService {

    private final NotificacionJpaRepository notificacionRepository;
    private final UsuarioJpaRepository usuarioRepository;

    @Transactional(readOnly = true)
    public PageResponse<NotificacionResponse> listar(int page, int size) {
        UUID usuarioId = getCurrentUserId();
        Pageable pageable = PageRequest.of(page, size);
        Page<NotificacionEntity> result = notificacionRepository.findByUsuarioIdOrderByCreatedAtDesc(usuarioId, pageable);

        List<NotificacionResponse> content = result.getContent().stream()
                .map(this::toResponse)
                .toList();

        return PageResponse.<NotificacionResponse>builder()
                .content(content)
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public long contarNoLeidas() {
        return notificacionRepository.countByUsuarioIdAndLeidaFalse(getCurrentUserId());
    }

    @Transactional
    public void marcarLeida(UUID id) {
        UUID usuarioId = getCurrentUserId();
        NotificacionEntity notificacion = notificacionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Notificación no encontrada"));

        if (!notificacion.getUsuario().getId().equals(usuarioId)) {
            throw new EntityNotFoundException("Notificación no encontrada");
        }

        notificacion.setLeida(true);
        notificacionRepository.save(notificacion);
    }

    @Transactional
    public void marcarTodasLeidas() {
        notificacionRepository.marcarTodasLeidas(getCurrentUserId());
    }

    @Transactional
    public void notificarMensajeGrupo(UUID destinatarioId, String grupoNombre, String autorNombre, UUID grupoId) {
        UsuarioEntity destinatario = usuarioRepository.findById(destinatarioId).orElse(null);
        if (destinatario == null) {
            return;
        }

        NotificacionEntity notificacion = new NotificacionEntity();
        notificacion.setUsuario(destinatario);
        notificacion.setTipo(TipoNotificacion.MENSAJE_GRUPO);
        notificacion.setTitulo("Nuevo mensaje en " + grupoNombre);
        notificacion.setMensaje(autorNombre + " escribió en el chat del grupo.");
        notificacion.setEnlace("/grupos/" + grupoId);
        notificacionRepository.save(notificacion);
    }

    private NotificacionResponse toResponse(NotificacionEntity entity) {
        return NotificacionResponse.builder()
                .id(entity.getId())
                .tipo(entity.getTipo().name())
                .titulo(entity.getTitulo())
                .mensaje(entity.getMensaje())
                .enlace(entity.getEnlace())
                .leida(Boolean.TRUE.equals(entity.getLeida()))
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private UUID getCurrentUserId() {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();
        return principal.getId();
    }
}
