package cl.duoc.connect.application.service;

import cl.duoc.connect.application.dto.request.AdminUpdateApunteRequest;
import cl.duoc.connect.application.dto.request.AdminUpdateGrupoRequest;
import cl.duoc.connect.application.dto.request.AdminUpdateMensajeRequest;
import cl.duoc.connect.application.dto.request.AdminUpdatePerfilProyectoRequest;
import cl.duoc.connect.application.dto.request.AdminUpdatePreguntaRequest;
import cl.duoc.connect.application.dto.request.AdminUpdateRespuestaRequest;
import cl.duoc.connect.application.dto.request.UpdateEstadoRequest;
import cl.duoc.connect.application.dto.request.UpdateRolRequest;
import cl.duoc.connect.application.dto.response.AdminApunteResponse;
import cl.duoc.connect.application.dto.response.AdminGrupoResponse;
import cl.duoc.connect.application.dto.response.AdminPerfilProyectoResponse;
import cl.duoc.connect.application.dto.response.AdminPreguntaResponse;
import cl.duoc.connect.application.dto.response.AdminStatsResponse;
import cl.duoc.connect.application.dto.response.AdminUsuarioResponse;
import cl.duoc.connect.application.dto.response.PageResponse;
import cl.duoc.connect.application.port.out.FileStoragePort;
import cl.duoc.connect.domain.enums.RolUsuario;
import cl.duoc.connect.domain.enums.VisibilidadPerfil;
import cl.duoc.connect.domain.exception.BusinessException;
import cl.duoc.connect.domain.exception.EntityNotFoundException;
import cl.duoc.connect.infrastructure.persistence.entity.ApunteEntity;
import cl.duoc.connect.infrastructure.persistence.entity.AsignaturaEntity;
import cl.duoc.connect.infrastructure.persistence.entity.CarreraEntity;
import cl.duoc.connect.infrastructure.persistence.entity.GrupoEstudioEntity;
import cl.duoc.connect.infrastructure.persistence.entity.MensajeGrupoEntity;
import cl.duoc.connect.infrastructure.persistence.entity.PerfilProyectoEntity;
import cl.duoc.connect.infrastructure.persistence.entity.PreguntaEntity;
import cl.duoc.connect.infrastructure.persistence.entity.RespuestaEntity;
import cl.duoc.connect.infrastructure.persistence.entity.UsuarioEntity;
import cl.duoc.connect.infrastructure.persistence.repository.ApunteJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.GrupoEstudioJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.GrupoMiembroJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.MensajeGrupoJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.PerfilProyectoJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.PreguntaJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.RespuestaJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.UsuarioJpaRepository;
import cl.duoc.connect.support.TestData;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AdminServiceTest {

    @Mock private UsuarioJpaRepository usuarioRepository;
    @Mock private ApunteJpaRepository apunteRepository;
    @Mock private PreguntaJpaRepository preguntaRepository;
    @Mock private RespuestaJpaRepository respuestaRepository;
    @Mock private GrupoEstudioJpaRepository grupoRepository;
    @Mock private GrupoMiembroJpaRepository miembroRepository;
    @Mock private MensajeGrupoJpaRepository mensajeRepository;
    @Mock private PerfilProyectoJpaRepository perfilProyectoRepository;
    @Mock private FileStoragePort fileStoragePort;

    @InjectMocks private AdminService adminService;

    private CarreraEntity carrera;
    private AsignaturaEntity asignatura;
    private UsuarioEntity admin;
    private UsuarioEntity estudiante;
    private ApunteEntity apunte;
    private PreguntaEntity pregunta;
    private RespuestaEntity respuesta;
    private GrupoEstudioEntity grupo;
    private MensajeGrupoEntity mensaje;

    @BeforeEach
    void setUp() {
        carrera = TestData.carrera("Ingeniería en Informática");
        asignatura = TestData.asignatura("Bases de Datos", carrera);
        admin = TestData.usuario("Admin Plataforma", carrera);
        admin.setRol(RolUsuario.ADMINISTRADOR);
        estudiante = TestData.usuario("Camila Rojas", carrera);
        TestData.loginComo(admin);

        apunte = new ApunteEntity();
        apunte.setId(UUID.randomUUID());
        apunte.setTitulo("Resumen");
        apunte.setUsuario(estudiante);
        apunte.setAsignatura(asignatura);
        apunte.setArchivoUrl("/uploads/apuntes/a.pdf");
        apunte.setNombreArchivo("a.pdf");

        pregunta = new PreguntaEntity();
        pregunta.setId(UUID.randomUUID());
        pregunta.setTitulo("¿Qué es 3FN?");
        pregunta.setContenido("Duda");
        pregunta.setUsuario(estudiante);
        pregunta.setCarrera(carrera);
        pregunta.setVotos(2);

        respuesta = new RespuestaEntity();
        respuesta.setId(UUID.randomUUID());
        respuesta.setPregunta(pregunta);
        respuesta.setUsuario(estudiante);
        respuesta.setContenido("Respuesta");
        respuesta.setVotos(0);
        respuesta.setAceptada(true);

        grupo = new GrupoEstudioEntity();
        grupo.setId(UUID.randomUUID());
        grupo.setNombre("Grupo BD");
        grupo.setCarrera(carrera);
        grupo.setAsignatura(asignatura);
        grupo.setCreador(estudiante);
        grupo.setMaxMiembros((short) 10);
        grupo.setPrivado(false);
        grupo.setCodigoInvitacion("ABC123");

        mensaje = new MensajeGrupoEntity();
        mensaje.setId(UUID.randomUUID());
        mensaje.setGrupo(grupo);
        mensaje.setUsuario(estudiante);
        mensaje.setContenido("Hola");

        when(usuarioRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(apunteRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(preguntaRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(respuestaRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(grupoRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(mensajeRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(perfilProyectoRepository.save(any())).thenAnswer(i -> i.getArgument(0));
    }

    @AfterEach
    void limpiarSesion() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Las estadísticas suman los conteos de cada repositorio")
    void estadisticas() {
        when(usuarioRepository.count()).thenReturn(10L);
        when(usuarioRepository.countByActivoTrue()).thenReturn(9L);
        when(grupoRepository.count()).thenReturn(3L);
        when(apunteRepository.count()).thenReturn(4L);
        when(preguntaRepository.count()).thenReturn(5L);
        when(respuestaRepository.count()).thenReturn(6L);
        when(mensajeRepository.count()).thenReturn(7L);
        when(perfilProyectoRepository.countByBuscandoCompaneroTrue()).thenReturn(2L);

        AdminStatsResponse stats = adminService.obtenerEstadisticas();

        assertThat(stats.getTotalUsuarios()).isEqualTo(10);
        assertThat(stats.getUsuariosActivos()).isEqualTo(9);
        assertThat(stats.getTotalMensajes()).isEqualTo(7);
        assertThat(stats.getBuscandoCompanero()).isEqualTo(2);
    }

    @Nested
    @DisplayName("Listados paginados")
    class Listados {

        @Test
        @DisplayName("Lista usuarios con su carrera y sede")
        void usuarios() {
            when(usuarioRepository.findAllWithRelations(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(estudiante)));
            PageResponse<AdminUsuarioResponse> page = adminService.listarUsuarios(0, 20);
            assertThat(page.getContent()).singleElement().satisfies(u -> {
                assertThat(u.getEmail()).isEqualTo(estudiante.getEmail());
                assertThat(u.getCarreraNombre()).isEqualTo("Ingeniería en Informática");
                assertThat(u.isActivo()).isTrue();
            });
            assertThat(page.isLast()).isTrue();
        }

        @Test
        @DisplayName("Lista apuntes, preguntas, respuestas, grupos, mensajes, fotos y perfiles")
        void contenido() {
            estudiante.setFotoUrl("/uploads/fotos/f.png");
            PerfilProyectoEntity perfil = perfil();
            when(apunteRepository.findAllForAdmin(any())).thenReturn(new PageImpl<>(List.of(apunte)));
            when(preguntaRepository.findAllForAdmin(any())).thenReturn(new PageImpl<>(List.of(pregunta)));
            when(respuestaRepository.findAllForAdmin(any())).thenReturn(new PageImpl<>(List.of(respuesta)));
            when(grupoRepository.findAllForAdmin(any())).thenReturn(new PageImpl<>(List.of(grupo)));
            when(mensajeRepository.findAllForAdmin(any())).thenReturn(new PageImpl<>(List.of(mensaje)));
            when(usuarioRepository.findUsuariosConFoto(any())).thenReturn(new PageImpl<>(List.of(estudiante)));
            when(perfilProyectoRepository.findAllForAdmin(any())).thenReturn(new PageImpl<>(List.of(perfil)));
            when(respuestaRepository.countByPreguntaId(pregunta.getId())).thenReturn(1L);
            when(miembroRepository.countByGrupoId(grupo.getId())).thenReturn(4L);

            assertThat(adminService.listarApuntes(0, 20).getContent().get(0).getCarreraNombre()).isEqualTo("Ingeniería en Informática");
            AdminPreguntaResponse p = adminService.listarPreguntas(0, 20).getContent().get(0);
            assertThat(p.getAsignaturaNombre()).isEqualTo("Temática general");
            assertThat(p.getTotalRespuestas()).isEqualTo(1);
            assertThat(adminService.listarRespuestas(0, 20).getContent().get(0).isAceptada()).isTrue();
            assertThat(adminService.listarGrupos(0, 20).getContent().get(0).getTotalMiembros()).isEqualTo(4);
            assertThat(adminService.listarMensajes(0, 20).getContent().get(0).getGrupoNombre()).isEqualTo("Grupo BD");
            assertThat(adminService.listarFotosPerfil(0, 20).getContent().get(0).getFotoUrl()).isEqualTo("/uploads/fotos/f.png");
            AdminPerfilProyectoResponse pp = adminService.listarPerfilesProyecto(0, 20).getContent().get(0);
            assertThat(pp.getVisibilidad()).isEqualTo(VisibilidadPerfil.SOLO_CARRERA);
        }
    }

    @Nested
    @DisplayName("Rol y estado de usuarios")
    class RolYEstado {

        @Test
        @DisplayName("Promueve a un estudiante a administrador")
        void promover() {
            when(usuarioRepository.findByIdWithRelations(estudiante.getId())).thenReturn(Optional.of(estudiante));
            UpdateRolRequest req = new UpdateRolRequest();
            req.setRol(RolUsuario.ADMINISTRADOR);

            AdminUsuarioResponse r = adminService.actualizarRol(estudiante.getId(), req);

            assertThat(r.getRol()).isEqualTo(RolUsuario.ADMINISTRADOR);
        }

        @Test
        @DisplayName("No permite cambiar el propio rol")
        void propioRol() {
            when(usuarioRepository.findByIdWithRelations(admin.getId())).thenReturn(Optional.of(admin));
            UpdateRolRequest req = new UpdateRolRequest();
            req.setRol(RolUsuario.ESTUDIANTE);

            assertThatThrownBy(() -> adminService.actualizarRol(admin.getId(), req))
                    .isInstanceOf(BusinessException.class)
                    .extracting("code").isEqualTo("SELF_MODIFICATION");
        }

        @Test
        @DisplayName("No deja el sistema sin administradores activos")
        void ultimoAdmin() {
            UsuarioEntity otroAdmin = TestData.usuario("Otro Admin", carrera);
            otroAdmin.setRol(RolUsuario.ADMINISTRADOR);
            when(usuarioRepository.findByIdWithRelations(otroAdmin.getId())).thenReturn(Optional.of(otroAdmin));
            when(usuarioRepository.findAll()).thenReturn(List.of(otroAdmin, estudiante));
            UpdateRolRequest req = new UpdateRolRequest();
            req.setRol(RolUsuario.ESTUDIANTE);

            assertThatThrownBy(() -> adminService.actualizarRol(otroAdmin.getId(), req))
                    .isInstanceOf(BusinessException.class)
                    .extracting("code").isEqualTo("LAST_ADMIN");
        }

        @Test
        @DisplayName("Degrada a un administrador si queda otro activo")
        void degradarConOtroAdmin() {
            UsuarioEntity otroAdmin = TestData.usuario("Otro Admin", carrera);
            otroAdmin.setRol(RolUsuario.ADMINISTRADOR);
            when(usuarioRepository.findByIdWithRelations(otroAdmin.getId())).thenReturn(Optional.of(otroAdmin));
            when(usuarioRepository.findAll()).thenReturn(List.of(otroAdmin, admin));
            UpdateRolRequest req = new UpdateRolRequest();
            req.setRol(RolUsuario.ESTUDIANTE);

            assertThat(adminService.actualizarRol(otroAdmin.getId(), req).getRol()).isEqualTo(RolUsuario.ESTUDIANTE);
        }

        @Test
        @DisplayName("Desactiva a un estudiante")
        void desactivar() {
            when(usuarioRepository.findByIdWithRelations(estudiante.getId())).thenReturn(Optional.of(estudiante));
            UpdateEstadoRequest req = new UpdateEstadoRequest();
            req.setActivo(false);

            assertThat(adminService.actualizarEstado(estudiante.getId(), req).isActivo()).isFalse();
        }

        @Test
        @DisplayName("No permite desactivar la propia cuenta")
        void desactivarseASiMismo() {
            when(usuarioRepository.findByIdWithRelations(admin.getId())).thenReturn(Optional.of(admin));
            UpdateEstadoRequest req = new UpdateEstadoRequest();
            req.setActivo(false);

            assertThatThrownBy(() -> adminService.actualizarEstado(admin.getId(), req))
                    .isInstanceOf(BusinessException.class);
        }

        @Test
        @DisplayName("No desactiva al último administrador activo")
        void desactivarUltimoAdmin() {
            UsuarioEntity otroAdmin = TestData.usuario("Otro Admin", carrera);
            otroAdmin.setRol(RolUsuario.ADMINISTRADOR);
            when(usuarioRepository.findByIdWithRelations(otroAdmin.getId())).thenReturn(Optional.of(otroAdmin));
            when(usuarioRepository.findAll()).thenReturn(List.of(otroAdmin));
            UpdateEstadoRequest req = new UpdateEstadoRequest();
            req.setActivo(false);

            assertThatThrownBy(() -> adminService.actualizarEstado(otroAdmin.getId(), req))
                    .isInstanceOf(BusinessException.class)
                    .extracting("code").isEqualTo("LAST_ADMIN");
        }

        @Test
        @DisplayName("Usuario inexistente responde no encontrado")
        void inexistente() {
            UUID id = UUID.randomUUID();
            when(usuarioRepository.findByIdWithRelations(id)).thenReturn(Optional.empty());
            UpdateEstadoRequest req = new UpdateEstadoRequest();
            req.setActivo(true);

            assertThatThrownBy(() -> adminService.actualizarEstado(id, req)).isInstanceOf(EntityNotFoundException.class);
        }

        @Test
        @DisplayName("Sin una sesión válida no se puede cambiar el rol")
        void sinSesion() {
            SecurityContextHolder.getContext().setAuthentication(
                    new org.springframework.security.authentication.UsernamePasswordAuthenticationToken("anon", null));
            when(usuarioRepository.findByIdWithRelations(estudiante.getId())).thenReturn(Optional.of(estudiante));
            UpdateRolRequest req = new UpdateRolRequest();
            req.setRol(RolUsuario.ADMINISTRADOR);

            assertThatThrownBy(() -> adminService.actualizarRol(estudiante.getId(), req))
                    .isInstanceOf(BusinessException.class)
                    .extracting("code").isEqualTo("UNAUTHORIZED");
        }
    }

    @Nested
    @DisplayName("Moderación de contenido")
    class Moderacion {

        @Test
        @DisplayName("Edita apunte, pregunta, respuesta, grupo y mensaje recortando espacios")
        void editar() {
            when(apunteRepository.findByIdWithDetails(apunte.getId())).thenReturn(Optional.of(apunte));
            when(preguntaRepository.findByIdWithDetails(pregunta.getId())).thenReturn(Optional.of(pregunta));
            when(respuestaRepository.findByIdWithDetails(respuesta.getId())).thenReturn(Optional.of(respuesta));
            when(grupoRepository.findByIdWithDetails(grupo.getId())).thenReturn(Optional.of(grupo));
            when(mensajeRepository.findByIdWithDetails(mensaje.getId())).thenReturn(Optional.of(mensaje));

            AdminUpdateApunteRequest ra = new AdminUpdateApunteRequest();
            ra.setTitulo("  Nuevo título  ");
            ra.setDescripcion("   ");
            AdminApunteResponse a = adminService.actualizarApunte(apunte.getId(), ra);
            assertThat(a.getTitulo()).isEqualTo("Nuevo título");
            assertThat(a.getDescripcion()).isNull();

            AdminUpdatePreguntaRequest rp = new AdminUpdatePreguntaRequest();
            rp.setTitulo(" T ");
            rp.setContenido(" C ");
            assertThat(adminService.actualizarPregunta(pregunta.getId(), rp).getContenido()).isEqualTo("C");

            AdminUpdateRespuestaRequest rr = new AdminUpdateRespuestaRequest();
            rr.setContenido(" editada ");
            assertThat(adminService.actualizarRespuesta(respuesta.getId(), rr).getContenido()).isEqualTo("editada");

            AdminUpdateGrupoRequest rg = new AdminUpdateGrupoRequest();
            rg.setNombre(" Grupo nuevo ");
            rg.setDescripcion(" desc ");
            AdminGrupoResponse g = adminService.actualizarGrupo(grupo.getId(), rg);
            assertThat(g.getNombre()).isEqualTo("Grupo nuevo");
            assertThat(g.getDescripcion()).isEqualTo("desc");
            assertThat(g.getAsignaturaNombre()).isEqualTo("Bases de Datos");

            AdminUpdateMensajeRequest rm = new AdminUpdateMensajeRequest();
            rm.setContenido(" moderado ");
            assertThat(adminService.actualizarMensaje(mensaje.getId(), rm).getContenido()).isEqualTo("moderado");
        }

        @Test
        @DisplayName("Obtiene el detalle y descarga un apunte para revisarlo")
        void detalle() {
            when(apunteRepository.findByIdWithDetails(apunte.getId())).thenReturn(Optional.of(apunte));
            when(preguntaRepository.findByIdWithDetails(pregunta.getId())).thenReturn(Optional.of(pregunta));
            when(grupoRepository.findByIdWithDetails(grupo.getId())).thenReturn(Optional.of(grupo));
            when(mensajeRepository.findByIdWithDetails(mensaje.getId())).thenReturn(Optional.of(mensaje));
            when(fileStoragePort.loadAsResource(apunte.getArchivoUrl())).thenReturn(new ByteArrayResource(new byte[]{1}));

            assertThat(adminService.obtenerApunte(apunte.getId()).getNombreArchivo()).isEqualTo("a.pdf");
            assertThat(adminService.obtenerPregunta(pregunta.getId()).getVotos()).isEqualTo(2);
            assertThat(adminService.obtenerGrupo(grupo.getId()).getCodigoInvitacion()).isEqualTo("ABC123");
            assertThat(adminService.obtenerMensaje(mensaje.getId()).getContenido()).isEqualTo("Hola");
            assertThat(adminService.descargarApunte(apunte.getId())).isNotNull();
        }

        @Test
        @DisplayName("Al eliminar un apunte también borra el PDF")
        void eliminarApunte() {
            when(apunteRepository.findByIdWithDetails(apunte.getId())).thenReturn(Optional.of(apunte));
            adminService.eliminarApunte(apunte.getId());
            verify(fileStoragePort).deleteStoredFile("/uploads/apuntes/a.pdf");
            verify(apunteRepository).delete(apunte);
        }

        @Test
        @DisplayName("Al eliminar una pregunta borra su imagen solo si tiene")
        void eliminarPregunta() {
            when(preguntaRepository.findByIdWithDetails(pregunta.getId())).thenReturn(Optional.of(pregunta));
            adminService.eliminarPregunta(pregunta.getId());
            verify(fileStoragePort, never()).deleteStoredFile(any());

            pregunta.setImagenUrl("/uploads/foro/i.png");
            adminService.eliminarPregunta(pregunta.getId());
            verify(fileStoragePort).deleteStoredFile("/uploads/foro/i.png");
        }

        @Test
        @DisplayName("Elimina respuesta, mensaje y grupo")
        void eliminarOtros() {
            when(respuestaRepository.findByIdWithDetails(respuesta.getId())).thenReturn(Optional.of(respuesta));
            when(mensajeRepository.findByIdWithDetails(mensaje.getId())).thenReturn(Optional.of(mensaje));
            when(grupoRepository.existsById(grupo.getId())).thenReturn(true);

            adminService.eliminarRespuesta(respuesta.getId());
            adminService.eliminarMensaje(mensaje.getId());
            adminService.eliminarGrupo(grupo.getId());

            verify(respuestaRepository).delete(respuesta);
            verify(mensajeRepository).delete(mensaje);
            verify(grupoRepository).deleteById(grupo.getId());
        }

        @Test
        @DisplayName("Contenido inexistente responde no encontrado")
        void inexistentes() {
            UUID id = UUID.randomUUID();
            assertThatThrownBy(() -> adminService.eliminarGrupo(id)).isInstanceOf(EntityNotFoundException.class);
            assertThatThrownBy(() -> adminService.obtenerApunte(id)).isInstanceOf(EntityNotFoundException.class);
            assertThatThrownBy(() -> adminService.eliminarRespuesta(id)).isInstanceOf(EntityNotFoundException.class);
            assertThatThrownBy(() -> adminService.eliminarMensaje(id)).isInstanceOf(EntityNotFoundException.class);
            assertThatThrownBy(() -> adminService.obtenerPregunta(id)).isInstanceOf(EntityNotFoundException.class);
        }

        @Test
        @DisplayName("Quita la foto de perfil y borra el archivo")
        void eliminarFoto() {
            estudiante.setFotoUrl("/uploads/fotos/f.png");
            when(usuarioRepository.findByIdWithRelations(estudiante.getId())).thenReturn(Optional.of(estudiante));

            adminService.eliminarFotoPerfil(estudiante.getId());

            verify(fileStoragePort).deleteStoredFile("/uploads/fotos/f.png");
            assertThat(estudiante.getFotoUrl()).isNull();
        }

        @Test
        @DisplayName("No elimina una foto que no existe")
        void eliminarFotoInexistente() {
            when(usuarioRepository.findByIdWithRelations(estudiante.getId())).thenReturn(Optional.of(estudiante));
            assertThatThrownBy(() -> adminService.eliminarFotoPerfil(estudiante.getId()))
                    .isInstanceOf(EntityNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Perfiles de compañero")
    class Perfiles {

        @Test
        @DisplayName("Actualiza solo los campos enviados")
        void actualizarParcial() {
            PerfilProyectoEntity perfil = perfil();
            when(perfilProyectoRepository.findByUsuarioIdForAdmin(estudiante.getId())).thenReturn(Optional.of(perfil));
            AdminUpdatePerfilProyectoRequest req = new AdminUpdatePerfilProyectoRequest();
            req.setBio("  Bio moderada ");
            req.setBuscandoCompanero(false);
            req.setVisibilidad(VisibilidadPerfil.PUBLICO);

            AdminPerfilProyectoResponse r = adminService.actualizarPerfilProyecto(estudiante.getId(), req);

            assertThat(r.getBio()).isEqualTo("Bio moderada");
            assertThat(r.isBuscandoCompanero()).isFalse();
            assertThat(r.getVisibilidad()).isEqualTo(VisibilidadPerfil.PUBLICO);
        }

        @Test
        @DisplayName("Una bio vacía se guarda como nula y los demás campos no cambian")
        void bioVacia() {
            PerfilProyectoEntity perfil = perfil();
            when(perfilProyectoRepository.findByUsuarioIdForAdmin(estudiante.getId())).thenReturn(Optional.of(perfil));
            AdminUpdatePerfilProyectoRequest req = new AdminUpdatePerfilProyectoRequest();
            req.setBio("  ");

            AdminPerfilProyectoResponse r = adminService.actualizarPerfilProyecto(estudiante.getId(), req);

            assertThat(r.getBio()).isNull();
            assertThat(r.isBuscandoCompanero()).isTrue();
        }

        @Test
        @DisplayName("Elimina un perfil y rechaza uno inexistente")
        void eliminar() {
            PerfilProyectoEntity perfil = perfil();
            when(perfilProyectoRepository.findByUsuarioIdForAdmin(estudiante.getId())).thenReturn(Optional.of(perfil));
            adminService.eliminarPerfilProyecto(estudiante.getId());
            verify(perfilProyectoRepository).delete(perfil);

            UUID otro = UUID.randomUUID();
            assertThatThrownBy(() -> adminService.eliminarPerfilProyecto(otro)).isInstanceOf(EntityNotFoundException.class);
        }
    }

    private PerfilProyectoEntity perfil() {
        PerfilProyectoEntity perfil = new PerfilProyectoEntity();
        perfil.setUsuarioId(estudiante.getId());
        perfil.setUsuario(estudiante);
        perfil.setBio("Busco equipo");
        perfil.setBuscandoCompanero(true);
        return perfil;
    }
}
