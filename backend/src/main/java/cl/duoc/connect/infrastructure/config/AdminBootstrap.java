package cl.duoc.connect.infrastructure.config;

import cl.duoc.connect.domain.enums.RolUsuario;
import cl.duoc.connect.infrastructure.persistence.entity.CarreraEntity;
import cl.duoc.connect.infrastructure.persistence.entity.SedeEntity;
import cl.duoc.connect.infrastructure.persistence.entity.UsuarioEntity;
import cl.duoc.connect.infrastructure.persistence.repository.CarreraJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.SedeJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.UsuarioJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Profile("!test")
@RequiredArgsConstructor
public class AdminBootstrap implements ApplicationRunner {

    private static final String ADMIN_EMAIL = "admin@duocuc.cl";
    private static final String ADMIN_PASSWORD = "Admin1234";

    private final UsuarioJpaRepository usuarioRepository;
    private final CarreraJpaRepository carreraRepository;
    private final SedeJpaRepository sedeRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        if (usuarioRepository.existsByEmailIgnoreCase(ADMIN_EMAIL)) {
            return;
        }

        CarreraEntity carrera = carreraRepository.findAll().stream()
                .findFirst()
                .orElse(null);
        SedeEntity sede = sedeRepository.findAll().stream()
                .findFirst()
                .orElse(null);

        if (carrera == null || sede == null) {
            log.warn("No se pudo crear el usuario administrador: faltan catálogos base");
            return;
        }

        UsuarioEntity admin = new UsuarioEntity();
        admin.setEmail(ADMIN_EMAIL);
        admin.setPasswordHash(passwordEncoder.encode(ADMIN_PASSWORD));
        admin.setNombre("Administrador");
        admin.setCarrera(carrera);
        admin.setSede(sede);
        admin.setSemestre((short) 1);
        admin.setRol(RolUsuario.ADMINISTRADOR);
        admin.setActivo(true);

        usuarioRepository.save(admin);
        log.info("Usuario administrador creado: {} / {}", ADMIN_EMAIL, ADMIN_PASSWORD);
    }
}
