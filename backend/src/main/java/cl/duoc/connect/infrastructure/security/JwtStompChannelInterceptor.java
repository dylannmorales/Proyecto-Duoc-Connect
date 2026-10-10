package cl.duoc.connect.infrastructure.security;

import cl.duoc.connect.infrastructure.persistence.repository.GrupoMiembroJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
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

@Component
@RequiredArgsConstructor
public class JwtStompChannelInterceptor implements ChannelInterceptor {

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

        if (StompCommand.SEND.equals(accessor.getCommand()) || StompCommand.MESSAGE.equals(accessor.getCommand())) {
            Authentication authentication = (Authentication) accessor.getUser();
            if (authentication != null) {
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }

        if (StompCommand.DISCONNECT.equals(accessor.getCommand())) {
            SecurityContextHolder.clearContext();
        }

        return message;
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

        accessor.setUser(authentication);
        SecurityContextHolder.getContext().setAuthentication(authentication);
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
