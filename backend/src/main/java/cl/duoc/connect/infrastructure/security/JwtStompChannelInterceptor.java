package cl.duoc.connect.infrastructure.security;

import cl.duoc.connect.infrastructure.persistence.repository.GrupoMiembroJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageHandler;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ExecutorChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Seguridad de las tramas STOMP del chat.
 *
 * <ul>
 *   <li>{@code preSend} (hilo de la conexión WebSocket): autentica el CONNECT con el JWT y
 *       valida que cada SUBSCRIBE sea a un grupo del que el usuario es miembro.</li>
 *   <li>{@code beforeHandle}/{@code afterMessageHandled} (hilo del pool que ejecuta el
 *       {@code @MessageMapping}): ponen y quitan el usuario en el {@link SecurityContextHolder}.
 *       Hay que hacerlo aquí porque el {@code SecurityContextHolder} es por hilo y el handler
 *       no corre en el mismo hilo que {@code preSend}.</li>
 * </ul>
 */
@Component
@RequiredArgsConstructor
public class JwtStompChannelInterceptor implements ExecutorChannelInterceptor {

    private static final Pattern GRUPO_TOPIC_PATTERN =
            Pattern.compile("^/topic/grupos/([0-9a-fA-F\\-]{36})$");

    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService userDetailsService;
    private final GrupoMiembroJpaRepository miembroRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            authenticate(accessor);
        }

        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            validateSubscription(accessor);
        }

        return message;
    }

    /** Corre en el hilo que ejecutará el handler: deja disponible al usuario autenticado para los servicios. */
    @Override
    public Message<?> beforeHandle(Message<?> message, MessageChannel channel, MessageHandler handler) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor != null && accessor.getUser() instanceof Authentication authentication) {
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }
        return message;
    }

    /** Limpia el contexto para que el hilo del pool no quede con el usuario de otra sesión. */
    @Override
    public void afterMessageHandled(Message<?> message, MessageChannel channel, MessageHandler handler, Exception ex) {
        SecurityContextHolder.clearContext();
    }

    private void authenticate(StompHeaderAccessor accessor) {
        String token = resolveToken(accessor);
        if (!StringUtils.hasText(token)
                || !jwtTokenProvider.validateToken(token)
                || !jwtTokenProvider.isAccessToken(token)) {
            throw new AuthenticationCredentialsNotFoundException("Token JWT inválido o ausente");
        }

        String email = jwtTokenProvider.extractEmail(token);
        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

        // Queda asociado a la sesión STOMP; beforeHandle lo pasa al SecurityContext en cada mensaje.
        accessor.setUser(authentication);
    }

    private void validateSubscription(StompHeaderAccessor accessor) {
        Authentication authentication = (Authentication) accessor.getUser();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new AccessDeniedException("Sesión WebSocket no autenticada");
        }

        String destination = accessor.getDestination();
        Matcher matcher = destination != null ? GRUPO_TOPIC_PATTERN.matcher(destination) : null;
        if (matcher == null || !matcher.matches()) {
            throw new AccessDeniedException("Suscripción no permitida");
        }

        UUID grupoId = UUID.fromString(matcher.group(1));
        if (!miembroRepository.existsByGrupoIdAndUsuarioId(grupoId, principal.getId())) {
            throw new AccessDeniedException("No eres miembro de este grupo");
        }
    }

    private String resolveToken(StompHeaderAccessor accessor) {
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }

        String tokenHeader = accessor.getFirstNativeHeader("token");
        if (StringUtils.hasText(tokenHeader)) {
            return tokenHeader;
        }

        return null;
    }
}
