package cl.duoc.connect.application.service;

import cl.duoc.connect.application.dto.request.ForgotPasswordRequest;
import cl.duoc.connect.application.dto.request.LoginRequest;
import cl.duoc.connect.application.dto.request.RefreshTokenRequest;
import cl.duoc.connect.application.dto.request.RegisterRequest;
import cl.duoc.connect.application.dto.request.ResetPasswordRequest;
import cl.duoc.connect.application.dto.response.AuthResponse;
import cl.duoc.connect.application.mapper.UsuarioMapper;
import cl.duoc.connect.application.port.out.EmailPort;
import cl.duoc.connect.domain.enums.RolUsuario;
import cl.duoc.connect.domain.exception.BusinessException;
import cl.duoc.connect.infrastructure.config.JwtProperties;
import cl.duoc.connect.infrastructure.persistence.entity.CarreraEntity;
import cl.duoc.connect.infrastructure.persistence.entity.PasswordResetTokenEntity;
import cl.duoc.connect.infrastructure.persistence.entity.SedeEntity;
import cl.duoc.connect.infrastructure.persistence.entity.UsuarioEntity;
import cl.duoc.connect.infrastructure.persistence.repository.CarreraJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.PasswordResetTokenJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.SedeJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.UsuarioJpaRepository;
import cl.duoc.connect.infrastructure.security.JwtTokenProvider;
import cl.duoc.connect.support.TestData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** HU-01 (registro), HU-02 (inicio de sesión y JWT) y HU-03 (recuperar contraseña). */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AuthServiceTest {

    @Mock private UsuarioJpaRepository usuarioRepository;
    @Mock private CarreraJpaRepository carreraRepository;
    @Mock private SedeJpaRepository sedeRepository;
    @Mock private PasswordResetTokenJpaRepository passwordResetTokenRepository;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private EmailPort emailPort;

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4);
    private final FormSecurityTokenService formTokens = new FormSecurityTokenService();
    private JwtTokenProvider jwt;
    private AuthService authService;

    private CarreraEntity carrera;
    private SedeEntity sede;
    private UsuarioEntity usuario;

    @BeforeEach
    void setUp() {
        JwtProperties props = new JwtProperties();
        props.setSecret("clave-de-prueba-para-tokens-jwt-de-32-caracteres-o-mas");
        props.setAccessExpirationMs(900_000);
        props.setRefreshExpirationMs(604_800_000);
        jwt = new JwtTokenProvider(props);
        authService = new AuthService(usuarioRepository, carreraRepository, sedeRepository, passwordResetTokenRepository,
                passwordEncoder, jwt, props, authenticationManager, new UsuarioMapper(), emailPort, formTokens);
        ReflectionTestUtils.setField(authService, "frontendUrl", "http://localhost:5173");

        carrera = TestData.carrera("Ingeniería en Informática");
        usuario = TestData.usuario("Camila Rojas", carrera);
        sede = usuario.getSede();
        when(carreraRepository.findById(carrera.getId())).thenReturn(Optional.of(carrera));
        when(sedeRepository.findById(sede.getId())).thenReturn(Optional.of(sede));
        when(usuarioRepository.save(any())).thenAnswer(i -> {
            UsuarioEntity u = i.getArgument(0);
            if (u.getId() == null) u.setId(UUID.randomUUID());
            return u;
        });
    }

    private RegisterRequest registro() {
        RegisterRequest r = new RegisterRequest();
        r.setNombre("  Nuevo Estudiante ");
        r.setEmail(" Nuevo.Estudiante@DuocUC.cl ");
        r.setPassword("Clave12345");
        r.setCarreraId(carrera.getId());
        r.setSedeId(sede.getId());
        r.setSemestre((short) 3);
        r.setSecurityToken(formTokens.generateToken());
        return r;
    }

    @Nested
    @DisplayName("HU-01: registro")
    class Registro {

        @Test
        @DisplayName("Crea un estudiante activo con el correo normalizado y la clave cifrada")
        void registroValido() {
            AuthResponse r = authService.register(registro());

            ArgumentCaptor<UsuarioEntity> captor = ArgumentCaptor.forClass(UsuarioEntity.class);
            verify(usuarioRepository).save(captor.capture());
            UsuarioEntity guardado = captor.getValue();
            assertThat(guardado.getEmail()).isEqualTo("nuevo.estudiante@duocuc.cl");
            assertThat(guardado.getNombre()).isEqualTo("Nuevo Estudiante");
            assertThat(guardado.getRol()).isEqualTo(RolUsuario.ESTUDIANTE);
            assertThat(passwordEncoder.matches("Clave12345", guardado.getPasswordHash())).isTrue();
            assertThat(r.getTokenType()).isEqualTo("Bearer");
            assertThat(r.getExpiresIn()).isEqualTo(900);
            assertThat(jwt.isAccessToken(r.getAccessToken())).isTrue();
            assertThat(jwt.isRefreshToken(r.getRefreshToken())).isTrue();
        }

        @Test
        @DisplayName("Rechaza un correo ya registrado")
        void correoDuplicado() {
            when(usuarioRepository.existsByEmailIgnoreCase("nuevo.estudiante@duocuc.cl")).thenReturn(true);
            assertThatThrownBy(() -> authService.register(registro()))
                    .isInstanceOf(BusinessException.class).extracting("code").isEqualTo("EMAIL_EXISTS");
        }

        @Test
        @DisplayName("Rechaza carrera o sede inexistentes")
        void catalogoInexistente() {
            RegisterRequest r = registro();
            r.setCarreraId(UUID.randomUUID());
            assertThatThrownBy(() -> authService.register(r)).extracting("code").isEqualTo("CARRERA_NOT_FOUND");

            RegisterRequest r2 = registro();
            r2.setSedeId(UUID.randomUUID());
            assertThatThrownBy(() -> authService.register(r2)).extracting("code").isEqualTo("SEDE_NOT_FOUND");
        }

        @Test
        @DisplayName("Sin token de seguridad del formulario no registra")
        void sinTokenFormulario() {
            RegisterRequest r = registro();
            r.setSecurityToken(null);
            assertThatThrownBy(() -> authService.register(r)).extracting("code").isEqualTo("INVALID_SECURITY_TOKEN");
            verify(usuarioRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("HU-02: inicio de sesión y renovación del token")
    class Login {

        private LoginRequest login(String password) {
            LoginRequest l = new LoginRequest();
            l.setEmail(" CAMILA.ROJAS@duocuc.cl ");
            l.setPassword(password);
            l.setSecurityToken(formTokens.generateToken());
            return l;
        }

        @Test
        @DisplayName("Con credenciales válidas entrega tokens y los datos del usuario")
        void loginValido() {
            when(usuarioRepository.findByEmailWithRelations("camila.rojas@duocuc.cl")).thenReturn(Optional.of(usuario));

            AuthResponse r = authService.login(login("Clave12345"));

            assertThat(r.getUser().getEmail()).isEqualTo("camila.rojas@duocuc.cl");
            assertThat(jwt.extractUserId(r.getAccessToken())).isEqualTo(usuario.getId());
        }

        @Test
        @DisplayName("Con contraseña incorrecta propaga el error de autenticación")
        void loginInvalido() {
            when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("bad"));
            assertThatThrownBy(() -> authService.login(login("mala"))).isInstanceOf(BadCredentialsException.class);
        }

        @Test
        @DisplayName("Un token de formulario solo sirve una vez")
        void tokenFormularioUnSoloUso() {
            when(usuarioRepository.findByEmailWithRelations(anyString())).thenReturn(Optional.of(usuario));
            LoginRequest l = login("Clave12345");
            authService.login(l);
            assertThatThrownBy(() -> authService.login(l)).extracting("code").isEqualTo("INVALID_SECURITY_TOKEN");
        }

        @Test
        @DisplayName("Renueva la sesión con un refresh token válido")
        void refreshValido() {
            when(usuarioRepository.findByIdWithRelations(usuario.getId())).thenReturn(Optional.of(usuario));
            RefreshTokenRequest req = new RefreshTokenRequest();
            req.setRefreshToken(jwt.generateRefreshToken(usuario.getId(), usuario.getEmail()));

            assertThat(authService.refresh(req).getAccessToken()).isNotBlank();
        }

        @Test
        @DisplayName("No acepta un access token como refresh token ni un token alterado")
        void refreshInvalido() {
            RefreshTokenRequest req = new RefreshTokenRequest();
            req.setRefreshToken(jwt.generateAccessToken(usuario.getId(), usuario.getEmail()));
            assertThatThrownBy(() -> authService.refresh(req)).extracting("code").isEqualTo("INVALID_TOKEN");

            req.setRefreshToken("no-es-un-jwt");
            assertThatThrownBy(() -> authService.refresh(req)).extracting("code").isEqualTo("INVALID_TOKEN");
        }

        @Test
        @DisplayName("Un usuario desactivado no puede renovar la sesión")
        void refreshDesactivado() {
            usuario.setActivo(false);
            when(usuarioRepository.findByIdWithRelations(usuario.getId())).thenReturn(Optional.of(usuario));
            RefreshTokenRequest req = new RefreshTokenRequest();
            req.setRefreshToken(jwt.generateRefreshToken(usuario.getId(), usuario.getEmail()));

            assertThatThrownBy(() -> authService.refresh(req)).extracting("code").isEqualTo("USER_INACTIVE");
        }
    }

    @Nested
    @DisplayName("HU-03: recuperar contraseña")
    class Recuperar {

        @Test
        @DisplayName("Si el correo existe guarda un token y envía el enlace")
        void solicitarConCorreoExistente() {
            when(usuarioRepository.findByEmailIgnoreCase("camila.rojas@duocuc.cl")).thenReturn(Optional.of(usuario));
            ForgotPasswordRequest req = new ForgotPasswordRequest();
            req.setEmail("Camila.Rojas@duocuc.cl");

            authService.forgotPassword(req);

            verify(passwordResetTokenRepository).save(any(PasswordResetTokenEntity.class));
            verify(emailPort).sendPasswordResetEmail(eq("camila.rojas@duocuc.cl"),
                    org.mockito.ArgumentMatchers.startsWith("http://localhost:5173/recuperar-contrasena?token="));
        }

        @Test
        @DisplayName("Si el correo no existe responde lo mismo, sin revelar nada ni enviar correo")
        void solicitarConCorreoInexistente() {
            ForgotPasswordRequest req = new ForgotPasswordRequest();
            req.setEmail("nadie@duocuc.cl");

            assertThat(authService.forgotPassword(req).getMessage()).startsWith("Si el correo existe");
            verify(emailPort, never()).sendPasswordResetEmail(anyString(), anyString());
        }

        @Test
        @DisplayName("Con un token vigente cambia la contraseña y marca el token como usado")
        void restablecer() {
            PasswordResetTokenEntity token = token(Instant.now().plusSeconds(600));
            when(passwordResetTokenRepository.findByTokenAndUsadoFalse("abc")).thenReturn(Optional.of(token));

            authService.resetPassword(reset("abc"));

            assertThat(passwordEncoder.matches("NuevaClave1", usuario.getPasswordHash())).isTrue();
            assertThat(token.getUsado()).isTrue();
        }

        @Test
        @DisplayName("Rechaza un token expirado o inexistente")
        void tokenInvalido() {
            when(passwordResetTokenRepository.findByTokenAndUsadoFalse("viejo"))
                    .thenReturn(Optional.of(token(Instant.now().minusSeconds(1))));

            assertThatThrownBy(() -> authService.resetPassword(reset("viejo"))).extracting("code").isEqualTo("RESET_TOKEN_INVALID");
            assertThatThrownBy(() -> authService.resetPassword(reset("otro"))).extracting("code").isEqualTo("RESET_TOKEN_INVALID");
        }

        private PasswordResetTokenEntity token(Instant expira) {
            PasswordResetTokenEntity t = new PasswordResetTokenEntity();
            t.setUsuario(usuario);
            t.setToken("abc");
            t.setExpiraEn(expira);
            t.setUsado(false);
            return t;
        }

        private ResetPasswordRequest reset(String token) {
            ResetPasswordRequest r = new ResetPasswordRequest();
            r.setToken(token);
            r.setNewPassword("NuevaClave1");
            return r;
        }
    }
}
