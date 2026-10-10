package cl.duoc.connect.application.service;

import cl.duoc.connect.application.dto.request.ForgotPasswordRequest;
import cl.duoc.connect.application.dto.request.LoginRequest;
import cl.duoc.connect.application.dto.request.RefreshTokenRequest;
import cl.duoc.connect.application.dto.request.RegisterRequest;
import cl.duoc.connect.application.dto.request.ResetPasswordRequest;
import cl.duoc.connect.application.dto.response.AuthResponse;
import cl.duoc.connect.application.dto.response.MessageResponse;
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
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioJpaRepository usuarioRepository;
    private final CarreraJpaRepository carreraRepository;
    private final SedeJpaRepository sedeRepository;
    private final PasswordResetTokenJpaRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtProperties jwtProperties;
    private final AuthenticationManager authenticationManager;
    private final UsuarioMapper usuarioMapper;
    private final EmailPort emailPort;
    private final FormSecurityTokenService formSecurityTokenService;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        formSecurityTokenService.validateAndConsume(request.getSecurityToken());
        String email = request.getEmail().trim().toLowerCase();

        if (usuarioRepository.existsByEmailIgnoreCase(email)) {
            throw new BusinessException("EMAIL_EXISTS", "Ya existe una cuenta con ese correo");
        }

        CarreraEntity carrera = carreraRepository.findById(request.getCarreraId())
                .orElseThrow(() -> new BusinessException("CARRERA_NOT_FOUND", "Carrera no encontrada"));
        SedeEntity sede = sedeRepository.findById(request.getSedeId())
                .orElseThrow(() -> new BusinessException("SEDE_NOT_FOUND", "Sede no encontrada"));

        UsuarioEntity usuario = new UsuarioEntity();
        usuario.setEmail(email);
        usuario.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        usuario.setNombre(request.getNombre().trim());
        usuario.setCarrera(carrera);
        usuario.setSede(sede);
        usuario.setSemestre(request.getSemestre());
        usuario.setRol(RolUsuario.ESTUDIANTE);
        usuario.setActivo(true);

        UsuarioEntity saved = usuarioRepository.save(usuario);
        return buildAuthResponse(saved);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        formSecurityTokenService.validateAndConsume(request.getSecurityToken());
        String email = request.getEmail().trim().toLowerCase();

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword()));

        UsuarioEntity usuario = usuarioRepository.findByEmailWithRelations(email)
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "Usuario no encontrado"));

        return buildAuthResponse(usuario);
    }

    @Transactional(readOnly = true)
    public AuthResponse refresh(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();

        if (!jwtTokenProvider.validateToken(refreshToken) || !jwtTokenProvider.isRefreshToken(refreshToken)) {
            throw new BusinessException("INVALID_TOKEN", "Refresh token inválido o expirado");
        }

        UUID userId = jwtTokenProvider.extractUserId(refreshToken);
        UsuarioEntity usuario = usuarioRepository.findByIdWithRelations(userId)
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "Usuario no encontrado"));

        if (!Boolean.TRUE.equals(usuario.getActivo())) {
            throw new BusinessException("USER_INACTIVE", "La cuenta está desactivada");
        }

        return buildAuthResponse(usuario);
    }

    @Transactional
    public MessageResponse forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        usuarioRepository.findByEmailIgnoreCase(email).ifPresent(usuario -> {
            String token = UUID.randomUUID().toString();

            PasswordResetTokenEntity resetToken = new PasswordResetTokenEntity();
            resetToken.setUsuario(usuario);
            resetToken.setToken(token);
            resetToken.setExpiraEn(Instant.now().plusSeconds(3600));
            resetToken.setUsado(false);
            passwordResetTokenRepository.save(resetToken);

            String resetLink = frontendUrl + "/recuperar-contrasena?token=" + token;
            emailPort.sendPasswordResetEmail(email, resetLink);
        });

        return MessageResponse.builder()
                .message("Si el correo existe, recibirás instrucciones para restablecer tu contraseña")
                .build();
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        PasswordResetTokenEntity resetToken = passwordResetTokenRepository
                .findByTokenAndUsadoFalse(request.getToken())
                .orElseThrow(() -> new BusinessException("INVALID_TOKEN", "Token inválido o ya utilizado"));

        if (resetToken.getExpiraEn().isBefore(Instant.now())) {
            throw new BusinessException("TOKEN_EXPIRED", "El token ha expirado");
        }

        UsuarioEntity usuario = resetToken.getUsuario();
        usuario.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        resetToken.setUsado(true);

        return MessageResponse.builder()
                .message("Contraseña actualizada correctamente")
                .build();
    }

    private AuthResponse buildAuthResponse(UsuarioEntity usuario) {
        String accessToken = jwtTokenProvider.generateAccessToken(usuario.getId(), usuario.getEmail());
        String refreshToken = jwtTokenProvider.generateRefreshToken(usuario.getId(), usuario.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtProperties.getAccessExpirationMs() / 1000)
                .user(usuarioMapper.toResponse(usuario))
                .build();
    }
}
