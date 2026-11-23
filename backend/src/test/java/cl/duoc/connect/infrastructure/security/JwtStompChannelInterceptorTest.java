package cl.duoc.connect.infrastructure.security;

import cl.duoc.connect.infrastructure.persistence.entity.UsuarioEntity;
import cl.duoc.connect.infrastructure.persistence.repository.GrupoMiembroJpaRepository;
import cl.duoc.connect.support.TestData;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageHandler;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.security.Principal;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class JwtStompChannelInterceptorTest {

    private JwtTokenProvider jwt;
    private CustomUserDetailsService userDetails;
    private GrupoMiembroJpaRepository miembros;
    private JwtStompChannelInterceptor interceptor;
    private final MessageChannel channel = mock(MessageChannel.class);
    private final MessageHandler handler = mock(MessageHandler.class);
    private UsuarioEntity usuario;

    @BeforeEach
    void setUp() {
        jwt = mock(JwtTokenProvider.class);
        userDetails = mock(CustomUserDetailsService.class);
        miembros = mock(GrupoMiembroJpaRepository.class);
        interceptor = new JwtStompChannelInterceptor(jwt, userDetails, miembros);
        usuario = TestData.usuario("Ana");
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void limpiar() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void connectConTokenValidoAsociaElUsuarioALaSesionSinTocarElContextoDelHilo() {
        when(jwt.validateToken("tok")).thenReturn(true);
        when(jwt.isAccessToken("tok")).thenReturn(true);
        when(jwt.extractEmail("tok")).thenReturn(usuario.getEmail());
        when(userDetails.loadUserByUsername(usuario.getEmail())).thenReturn(new UserPrincipal(usuario));

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setNativeHeader("Authorization", "Bearer tok");
        accessor.setLeaveMutable(true);
        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        interceptor.preSend(message, channel);

        assertThat(accessor.getUser()).isInstanceOf(Authentication.class);
        // El hilo de la conexión no debe quedar con el usuario (se reutiliza para otras sesiones).
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void connectSinTokenSeRechaza() {
        Message<byte[]> message = mensaje(StompCommand.CONNECT, null, null);

        assertThatThrownBy(() -> interceptor.preSend(message, channel))
                .isInstanceOf(AuthenticationCredentialsNotFoundException.class);
    }

    @Test
    void subscribeAGrupoAjenoSeRechaza() {
        UUID grupoId = UUID.randomUUID();
        when(miembros.existsByGrupoIdAndUsuarioId(grupoId, usuario.getId())).thenReturn(false);

        Message<byte[]> message = mensaje(StompCommand.SUBSCRIBE, autenticacion(), "/topic/grupos/" + grupoId);

        assertThatThrownBy(() -> interceptor.preSend(message, channel))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("No eres miembro");
    }

    @Test
    void subscribeAGrupoPropioSePermite() {
        UUID grupoId = UUID.randomUUID();
        when(miembros.existsByGrupoIdAndUsuarioId(grupoId, usuario.getId())).thenReturn(true);

        Message<byte[]> message = mensaje(StompCommand.SUBSCRIBE, autenticacion(), "/topic/grupos/" + grupoId);

        assertThat(interceptor.preSend(message, channel)).isSameAs(message);
    }

    @Test
    void elHandlerVeAlUsuarioAunqueCorraEnOtroHilo() throws Exception {
        Authentication auth = autenticacion();
        Message<byte[]> send = mensaje(StompCommand.SEND, auth, "/app/grupos/" + UUID.randomUUID() + "/mensajes");

        // Así lo hace Spring: preSend en el hilo de la conexión y el handler en un hilo del pool.
        interceptor.preSend(send, channel);
        ExecutorService pool = Executors.newSingleThreadExecutor();
        try {
            CompletableFuture<Authentication[]> vistoPorElHandler = CompletableFuture.supplyAsync(() -> {
                interceptor.beforeHandle(send, channel, handler);
                Authentication durante = SecurityContextHolder.getContext().getAuthentication();
                interceptor.afterMessageHandled(send, channel, handler, null);
                Authentication despues = SecurityContextHolder.getContext().getAuthentication();
                return new Authentication[] {durante, despues};
            }, pool);

            Authentication[] resultado = vistoPorElHandler.get();
            assertThat(resultado[0]).isSameAs(auth);   // el servicio encuentra al usuario
            assertThat(resultado[1]).isNull();         // y el hilo del pool queda limpio
        } finally {
            pool.shutdownNow();
        }
    }

    private Authentication autenticacion() {
        UserPrincipal principal = new UserPrincipal(usuario);
        return new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    }

    private Message<byte[]> mensaje(StompCommand command, Principal user, String destination) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(command);
        if (user != null) {
            accessor.setUser(user);
        }
        if (destination != null) {
            accessor.setDestination(destination);
        }
        accessor.setLeaveMutable(true);
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }
}
