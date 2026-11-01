package cl.duoc.connect.application.service;

import cl.duoc.connect.application.dto.request.UpdateGrupoRequest;
import cl.duoc.connect.application.dto.response.GrupoResponse;
import cl.duoc.connect.application.dto.response.InvitacionResponse;
import cl.duoc.connect.application.dto.response.SalidaGrupoResponse;
import cl.duoc.connect.application.mapper.GrupoMapper;
import cl.duoc.connect.application.port.out.EmailPort;
import cl.duoc.connect.domain.enums.RolGrupo;
import cl.duoc.connect.domain.exception.BusinessException;
import cl.duoc.connect.infrastructure.persistence.entity.AsignaturaEntity;
import cl.duoc.connect.infrastructure.persistence.entity.CarreraEntity;
import cl.duoc.connect.infrastructure.persistence.entity.GrupoEstudioEntity;
import cl.duoc.connect.infrastructure.persistence.entity.GrupoMiembroEntity;
import cl.duoc.connect.infrastructure.persistence.entity.UsuarioEntity;
import cl.duoc.connect.infrastructure.persistence.repository.AsignaturaJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.CarreraJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.GrupoEstudioJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.GrupoMiembroJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.MensajeGrupoJpaRepository;
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
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class GrupoServiceTest {

    @Mock private GrupoEstudioJpaRepository grupoRepository;
    @Mock private GrupoMiembroJpaRepository miembroRepository;
    @Mock private MensajeGrupoJpaRepository mensajeRepository;
    @Mock private CarreraJpaRepository carreraRepository;
    @Mock private AsignaturaJpaRepository asignaturaRepository;
    @Mock private UsuarioJpaRepository usuarioRepository;
    @Spy private GrupoMapper grupoMapper = new GrupoMapper();
    @Mock private SimpMessagingTemplate messagingTemplate;
    @Mock private NotificacionService notificacionService;
    @Mock private EmailPort emailPort;

    @InjectMocks private GrupoService grupoService;

    private UsuarioEntity admin;
    private UsuarioEntity miembro;
    private CarreraEntity carrera;
    private GrupoEstudioEntity grupo;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(grupoService, "frontendUrl", "http://localhost:5173");
        admin = TestData.usuario("Admin Grupo");
        miembro = TestData.usuario("Miembro Grupo");
        carrera = TestData.carrera("Ingeniería en Informática");

        grupo = new GrupoEstudioEntity();
        grupo.setId(UUID.randomUUID());
        grupo.setNombre("Estudio SQL");
        grupo.setCarrera(carrera);
        grupo.setCreador(admin);
        grupo.setMaxMiembros((short) 10);
        grupo.setPrivado(true);
        grupo.setCodigoInvitacion("ABC234");

        when(grupoRepository.findByIdWithDetails(grupo.getId())).thenReturn(Optional.of(grupo));
        when(usuarioRepository.findById(admin.getId())).thenReturn(Optional.of(admin));
        when(usuarioRepository.findById(miembro.getId())).thenReturn(Optional.of(miembro));
        membresia(admin, RolGrupo.ADMIN_GRUPO);
        membresia(miembro, RolGrupo.MIEMBRO);
        when(miembroRepository.countByGrupoId(grupo.getId())).thenReturn(4L);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void membresia(UsuarioEntity usuario, RolGrupo rol) {
        GrupoMiembroEntity m = new GrupoMiembroEntity();
        m.setGrupo(grupo);
        m.setUsuario(usuario);
        m.setRol(rol);
        when(miembroRepository.findByGrupoIdAndUsuarioId(grupo.getId(), usuario.getId())).thenReturn(Optional.of(m));
        when(miembroRepository.existsByGrupoIdAndUsuarioId(grupo.getId(), usuario.getId())).thenReturn(true);
    }

    private UpdateGrupoRequest edicion(short maxMiembros) {
        UpdateGrupoRequest request = new UpdateGrupoRequest();
        request.setNombre("  Estudio SQL avanzado  ");
        request.setDescripcion("Repaso para la prueba");
        request.setCarreraId(carrera.getId());
        request.setMaxMiembros(maxMiembros);
        request.setPrivado(false);
        return request;
    }

    /** Historia: permitir editar el grupo de estudio. */
    @Nested
    class EditarGrupo {

        @BeforeEach
        void carreraExiste() {
            when(carreraRepository.findById(carrera.getId())).thenReturn(Optional.of(carrera));
        }

        @Test
        @DisplayName("El administrador edita nombre, descripción, cupo y privacidad")
        void adminEdita() {
            TestData.loginComo(admin);

            GrupoResponse response = grupoService.editarGrupo(grupo.getId(), edicion((short) 15));

            assertThat(response.getNombre()).isEqualTo("Estudio SQL avanzado");
            assertThat(response.getDescripcion()).isEqualTo("Repaso para la prueba");
            assertThat(response.getMaxMiembros()).isEqualTo((short) 15);
            assertThat(response.isPrivado()).isFalse();
            verify(grupoRepository).save(grupo);
        }

        @Test
        @DisplayName("Un miembro que no es administrador no puede editar")
        void miembroNoEdita() {
            TestData.loginComo(miembro);

            assertThatThrownBy(() -> grupoService.editarGrupo(grupo.getId(), edicion((short) 15)))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Solo el administrador");
            verify(grupoRepository, never()).save(any());
        }

        @Test
        @DisplayName("El cupo no puede quedar por debajo de los integrantes actuales")
        void cupoMenorQueMiembros() {
            TestData.loginComo(admin);

            assertThatThrownBy(() -> grupoService.editarGrupo(grupo.getId(), edicion((short) 3)))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("4 integrantes");
            verify(grupoRepository, never()).save(any());
        }

        @Test
        @DisplayName("La asignatura debe pertenecer a la carrera elegida")
        void asignaturaDeOtraCarrera() {
            TestData.loginComo(admin);
            AsignaturaEntity ajena = TestData.asignatura("Redes", TestData.carrera("Conectividad"));
            when(asignaturaRepository.findByIdWithCarrera(ajena.getId())).thenReturn(Optional.of(ajena));
            UpdateGrupoRequest request = edicion((short) 15);
            request.setAsignaturaId(ajena.getId());

            assertThatThrownBy(() -> grupoService.editarGrupo(grupo.getId(), request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("no pertenece");
        }
    }

    /** Salir del grupo. */
    @Nested
    class SalirDelGrupo {

        @Test
        @DisplayName("Un miembro sale y el grupo sigue con su administrador")
        void miembroSale() {
            TestData.loginComo(miembro);

            SalidaGrupoResponse salida = grupoService.salirGrupo(grupo.getId());

            assertThat(salida.grupoEliminado()).isFalse();
            assertThat(salida.nuevoAdministrador()).isNull();
            verify(miembroRepository).delete(any(GrupoMiembroEntity.class));
            verify(miembroRepository, never()).findMiembrosOrdenados(any());
            verify(grupoRepository, never()).eliminarGrupo(any());
        }

        @Test
        @DisplayName("Si sale el administrador, la administración pasa al integrante más antiguo")
        void adminSaleYTraspasa() {
            TestData.loginComo(admin);
            GrupoMiembroEntity masAntiguo = new GrupoMiembroEntity();
            masAntiguo.setUsuario(miembro);
            masAntiguo.setRol(RolGrupo.MIEMBRO);
            when(miembroRepository.findMiembrosOrdenados(grupo.getId())).thenReturn(List.of(masAntiguo));

            SalidaGrupoResponse salida = grupoService.salirGrupo(grupo.getId());

            assertThat(masAntiguo.getRol()).isEqualTo(RolGrupo.ADMIN_GRUPO);
            assertThat(salida.nuevoAdministrador()).isEqualTo(miembro.getNombre());
            verify(miembroRepository).save(masAntiguo);
        }

        @Test
        @DisplayName("Si sale el último integrante, el grupo se elimina con un borrado directo")
        void ultimoIntegranteEliminaGrupo() {
            TestData.loginComo(admin);
            when(miembroRepository.countByGrupoId(grupo.getId())).thenReturn(1L);

            SalidaGrupoResponse salida = grupoService.salirGrupo(grupo.getId());

            assertThat(salida.grupoEliminado()).isTrue();
            verify(grupoRepository).eliminarGrupo(grupo.getId());
            verify(grupoRepository, never()).deleteById(any());
        }

        @Test
        @DisplayName("Quien no es miembro no puede salir")
        void noMiembroNoSale() {
            UsuarioEntity externo = TestData.usuario("Externo");
            when(usuarioRepository.findById(externo.getId())).thenReturn(Optional.of(externo));
            TestData.loginComo(externo);

            assertThatThrownBy(() -> grupoService.salirGrupo(grupo.getId()))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("No eres miembro");
            verify(miembroRepository, never()).delete(any());
        }
    }

    /** Historia: compartir el grupo de estudio mediante una invitación por correo. */
    @Nested
    class InvitarPorCorreo {

        @Test
        @DisplayName("Envía el correo con el vínculo y notifica in-app si el invitado ya está registrado")
        void invitaYNotifica() {
            TestData.loginComo(miembro);
            UsuarioEntity registrado = TestData.usuario("Invitada Registrada");
            when(usuarioRepository.findByEmailIgnoreCase(registrado.getEmail())).thenReturn(Optional.of(registrado));
            when(usuarioRepository.findByEmailIgnoreCase("nuevo.alumno@duocuc.cl")).thenReturn(Optional.empty());

            List<InvitacionResponse> resultados = grupoService.invitarPorCorreo(
                    grupo.getId(), List.of(registrado.getEmail().toUpperCase(), " nuevo.alumno@duocuc.cl "));

            assertThat(resultados).extracting(InvitacionResponse::estado).containsExactly("ENVIADA", "ENVIADA");
            verify(emailPort).sendGroupInvitationEmail(
                    registrado.getEmail(), "Estudio SQL", miembro.getNombre(),
                    "http://localhost:5173/grupos/unirse/ABC234", "ABC234");
            verify(emailPort).sendGroupInvitationEmail(
                    eq("nuevo.alumno@duocuc.cl"), anyString(), anyString(), anyString(), anyString());
            verify(notificacionService).notificarInvitacionGrupo(registrado, "Estudio SQL", miembro.getNombre(), "ABC234");
            verify(notificacionService, times(1)).notificarInvitacionGrupo(any(), any(), any(), any());
        }

        @Test
        @DisplayName("Rechaza correos no institucionales, omite a los miembros y quita duplicados")
        void invalidosMiembrosYDuplicados() {
            TestData.loginComo(admin);
            when(usuarioRepository.findByEmailIgnoreCase(miembro.getEmail())).thenReturn(Optional.of(miembro));

            List<InvitacionResponse> resultados = grupoService.invitarPorCorreo(
                    grupo.getId(), List.of("alguien@gmail.com", miembro.getEmail(), miembro.getEmail(), ""));

            assertThat(resultados).extracting(InvitacionResponse::estado).containsExactly("INVALIDO", "YA_ES_MIEMBRO");
            verify(emailPort, never()).sendGroupInvitationEmail(any(), any(), any(), any(), any());
        }

        @Test
        @DisplayName("Quien no es miembro del grupo no puede invitar")
        void noMiembroNoInvita() {
            UsuarioEntity externo = TestData.usuario("Externo");
            when(usuarioRepository.findById(externo.getId())).thenReturn(Optional.of(externo));
            TestData.loginComo(externo);

            assertThatThrownBy(() -> grupoService.invitarPorCorreo(grupo.getId(), List.of("a@duocuc.cl")))
                    .isInstanceOf(BusinessException.class);
            verify(emailPort, never()).sendGroupInvitationEmail(any(), any(), any(), any(), any());
        }
    }
}
