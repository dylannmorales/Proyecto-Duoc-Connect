package cl.duoc.connect.presentation.controller;

import cl.duoc.connect.application.dto.request.ForgotPasswordRequest;
import cl.duoc.connect.application.dto.request.LoginRequest;
import cl.duoc.connect.application.dto.request.RefreshTokenRequest;
import cl.duoc.connect.application.dto.request.RegisterRequest;
import cl.duoc.connect.application.dto.request.ResetPasswordRequest;
import cl.duoc.connect.application.dto.response.ApiResponse;
import cl.duoc.connect.application.dto.response.AuthResponse;
import cl.duoc.connect.application.dto.response.FormSecurityTokenResponse;
import cl.duoc.connect.application.dto.response.MessageResponse;
import cl.duoc.connect.application.service.AuthService;
import cl.duoc.connect.application.service.FormSecurityTokenService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticación", description = "Registro, login y recuperación de contraseña")
public class AuthController {

    private final AuthService authService;
    private final FormSecurityTokenService formSecurityTokenService;

    @GetMapping("/form-token")
    @Operation(summary = "Obtener token de seguridad para formularios de login/registro")
    public ApiResponse<FormSecurityTokenResponse> obtenerFormToken() {
        String token = formSecurityTokenService.generateToken();
        return ApiResponse.ok(FormSecurityTokenResponse.builder()
                .token(token)
                .expiresInSeconds(900)
                .build());
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Registrar nuevo usuario")
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.ok(authService.register(request), "Registro exitoso");
    }

    @PostMapping("/login")
    @Operation(summary = "Iniciar sesión")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok(authService.login(request), "Inicio de sesión exitoso");
    }

    @PostMapping("/refresh")
    @Operation(summary = "Renovar access token")
    public ApiResponse<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ApiResponse.ok(authService.refresh(request), "Token renovado");
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Solicitar recuperación de contraseña")
    public ApiResponse<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ApiResponse.ok(authService.forgotPassword(request));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Restablecer contraseña con token")
    public ApiResponse<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return ApiResponse.ok(authService.resetPassword(request));
    }
}
