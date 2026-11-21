package cl.duoc.connect.support;

import cl.duoc.connect.domain.enums.RolUsuario;
import cl.duoc.connect.infrastructure.persistence.entity.AsignaturaEntity;
import cl.duoc.connect.infrastructure.persistence.entity.CarreraEntity;
import cl.duoc.connect.infrastructure.persistence.entity.SedeEntity;
import cl.duoc.connect.infrastructure.persistence.entity.UsuarioEntity;
import cl.duoc.connect.infrastructure.security.UserPrincipal;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

/** Datos sintéticos y sesión simulada para pruebas unitarias de servicios. */
public final class TestData {

    private TestData() {
    }

    public static UsuarioEntity usuario(String nombre) {
        UsuarioEntity usuario = new UsuarioEntity();
        usuario.setId(UUID.randomUUID());
        usuario.setNombre(nombre);
        usuario.setEmail(nombre.toLowerCase().replace(' ', '.') + "@duocuc.cl");
        usuario.setPasswordHash("hash");
        usuario.setRol(RolUsuario.ESTUDIANTE);
        usuario.setActivo(true);
        return usuario;
    }

    /** Usuario con carrera y sede, como lo devuelven las consultas con relaciones. */
    public static UsuarioEntity usuario(String nombre, CarreraEntity carrera) {
        UsuarioEntity usuario = usuario(nombre);
        usuario.setCarrera(carrera);
        usuario.setSede(sede("San Joaquín"));
        usuario.setSemestre((short) 5);
        return usuario;
    }

    public static SedeEntity sede(String nombre) {
        SedeEntity sede = new SedeEntity();
        sede.setId(UUID.randomUUID());
        sede.setNombre(nombre);
        return sede;
    }

    public static CarreraEntity carrera(String nombre) {
        CarreraEntity carrera = new CarreraEntity();
        carrera.setId(UUID.randomUUID());
        carrera.setNombre(nombre);
        return carrera;
    }

    public static AsignaturaEntity asignatura(String nombre, CarreraEntity carrera) {
        AsignaturaEntity asignatura = new AsignaturaEntity();
        asignatura.setId(UUID.randomUUID());
        asignatura.setNombre(nombre);
        asignatura.setCarrera(carrera);
        return asignatura;
    }

    public static void loginComo(UsuarioEntity usuario) {
        UserPrincipal principal = new UserPrincipal(usuario);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }
}
