package cl.duoc.connect.application.service;

import cl.duoc.connect.application.dto.request.InvitarCompaneroRequest;
import cl.duoc.connect.application.dto.response.GrupoInvitableResponse;
import cl.duoc.connect.application.dto.response.InvitacionDirectaResponse;
import cl.duoc.connect.application.dto.response.RespuestaInvitacionResponse;
import cl.duoc.connect.domain.enums.EstadoInvitacion;
import cl.duoc.connect.domain.enums.RolGrupo;
import cl.duoc.connect.domain.exception.BusinessException;
import cl.duoc.connect.domain.exception.EntityNotFoundException;
import cl.duoc.connect.infrastructure.persistence.entity.CarreraEntity;
import cl.duoc.connect.infrastructure.persistence.entity.GrupoEstudioEntity;
import cl.duoc.connect.infrastructure.persistence.entity.GrupoMiembroEntity;
import cl.duoc.connect.infrastructure.persistence.entity.InvitacionDirectaEntity;
import cl.duoc.connect.infrastructure.persistence.entity.UsuarioEntity;
import cl.duoc.connect.infrastructure.persistence.repository.GrupoEstudioJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.GrupoMiembroJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.InvitacionDirectaJpaRepository;
import cl.duoc.connect.infrastructure.persistence.repository.UsuarioJpaRepository;
import cl.duoc.connect.support.TestData;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Invitar a un compañero a un grupo desde su perfil, sin conocer su correo. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class InvitacionDirectaServiceTest {

    @Mock private InvitacionDirectaJpaRepository invitacionRepository;
    @Mock private GrupoEstudioJpaRepository grupoRepository;
    @Mock private GrupoMiembroJpaRepository miembroRepository;
    @Mock private UsuarioJpaRepository usuarioRepository;
    @Mock private CompaneroService companeroService;
    @Mock private NotificacionService notificacionService;

    @InjectMocks private InvitacionDirectaService service;

    private UsuarioEntity invitador;
    private UsuarioEntity invitado;
    private GrupoEstudioEntity grupo;

    @BeforeEach
    void setUp() {
        CarreraEntity carrera = TestData.carrera("Ingeniería en Informática");
        invitador = TestData.usuario("Ana Invitadora", carrera);
        invitado = TestData.usuario("Bruno Invitado", carrera);

        grupo = new GrupoEstudioEntity();
        grupo.setId(UUID.randomUUID());
        grupo.setNombre("Proyecto Integrado");
        grupo.setCarrera(carrera);
        grupo.setCreador(invitador);
        grupo.setMaxMiembros((short) 5);
        grupo.setPrivado(true);
        grupo.setCodigoInvitacion("ABC234");

        when(usuarioRepository.findById(invitador.getId())).thenReturn(Optional.of(invitador));
        when(usuarioRepository.findById(invitado.getId())).thenReturn(Optional.of(invitado));
        when(companeroService.obtenerCompaneroVisible(invitado.getId())).thenReturn(invitado);
        when(grupoRepository.findById(grupo.getId())).thenReturn(Optional.of(grupo));
        when(miembroRepository.existsByGrupoIdAndUsuarioId(grupo.getId(), invitador.getId())).thenReturn(true);
        when(miembroRepository.countByGrupoId(grupo.getId())).thenReturn(2L);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private InvitarCompaneroRequest solicitud(String mensaje) {
        InvitarCompaneroRequest request = new InvitarCompaneroRequest();
        request.setGrupoId(grupo.getId());
        request.setMensaje(mensaje);
        return request;
    }

    private InvitacionDirectaEntity pendiente() {
        InvitacionDirectaEntity invitacion = new InvitacionDirectaEntity();
        invitacion.setId(UUID.randomUUID());
        invitacion.setGrupo(grupo);
        invitacion.setInvitador(invitador);
        invitacion.setInvitado(invitado);
        invitacion.setEstado(EstadoInvitacion.PENDIENTE);
        when(invitacionRepository.findByIdWithDetails(invitacion.getId())).thenReturn(Optional.of(invitacion));
        return invitacion;
    }

    @Nested
    class Invitar {

        @BeforeEach
        void sesion() {
            TestData.loginComo(invitador);
        }

        @Test
        @DisplayName("guarda la invitación pendiente y notifica a la persona invitada sin usar su correo")
        void invitaCompanero() {
            service.invitar(invitado.getId(), solicitud("  ¿Te sumas al proyecto?  "));

            ArgumentCaptor<InvitacionDirectaEntity> captor = ArgumentCaptor.forClass(InvitacionDirectaEntity.class);
            verify(invitacionRepository).save(captor.capture());
            InvitacionDirectaEntity guardada = captor.getValue();
            assertThat(guardada.getInvitado()).isEqualTo(invitado);
            assertThat(guardada.getInvitador()).isEqualTo(invitador);
            assertThat(guardada.getEstado()).isEqualTo(EstadoInvitacion.PENDIENTE);
            assertThat(guardada.getMensaje()).isEqualTo("¿Te sumas al proyecto?");
            verify(notificacionService).notificarInvitacionDirecta(invitado, "Proyecto Integrado", "Ana Invitadora");
        }

        @Test
        @DisplayName("no permite invitarse a uno mismo")
        void noAUnoMismo() {
            assertThatThrownBy(() -> service.invitar(invitador.getId(), solicitud(null)))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("ti mismo");
            verify(invitacionRepository, never()).save(any());
        }

        @Test
        @DisplayName("solo se invita a grupos de los que se es integrante")
        void soloIntegrantes() {
            when(miembroRepository.existsByGrupoIdAndUsuarioId(grupo.getId(), invitador.getId())).thenReturn(false);

            assertThatThrownBy(() -> service.invitar(invitado.getId(), solicitud(null)))
                    .isInstanceOf(BusinessException.class)
                    .extracting("code").isEqualTo("NOT_MEMBER");
        }

        @Test
        @DisplayName("rechaza invitar a quien ya es integrante")
        void yaIntegrante() {
            when(miembroRepository.existsByGrupoIdAndUsuarioId(grupo.getId(), invitado.getId())).thenReturn(true);

            assertThatThrownBy(() -> service.invitar(invitado.getId(), solicitud(null)))
                    .isInstanceOf(BusinessException.class)
                    .extracting("code").isEqualTo("ALREADY_MEMBER");
        }

        @Test
        @DisplayName("no duplica una invitación pendiente al mismo grupo")
        void sinDuplicados() {
            when(invitacionRepository.existsByGrupoIdAndInvitadoIdAndEstado(
                    grupo.getId(), invitado.getId(), EstadoInvitacion.PENDIENTE)).thenReturn(true);

            assertThatThrownBy(() -> service.invitar(invitado.getId(), solicitud(null)))
                    .isInstanceOf(BusinessException.class)
                    .extracting("code").isEqualTo("INVITACION_PENDIENTE");
            verify(notificacionService, never()).notificarInvitacionDirecta(any(), anyString(), anyString());
        }

        @Test
        @DisplayName("no invita a un grupo lleno")
        void grupoLleno() {
            when(miembroRepository.countByGrupoId(grupo.getId())).thenReturn(5L);

            assertThatThrownBy(() -> service.invitar(invitado.getId(), solicitud(null)))
                    .isInstanceOf(BusinessException.class)
                    .extracting("code").isEqualTo("GROUP_FULL");
        }

        @Test
        @DisplayName("respeta la visibilidad del perfil de compañero")
        void perfilNoVisible() {
            when(companeroService.obtenerCompaneroVisible(invitado.getId()))
                    .thenThrow(new EntityNotFoundException("Perfil de compañero no disponible"));

            assertThatThrownBy(() -> service.invitar(invitado.getId(), solicitud(null)))
                    .isInstanceOf(EntityNotFoundException.class);
            verify(invitacionRepository, never()).save(any());
        }

        @Test
        @DisplayName("lista mis grupos indicando a cuáles se puede invitar")
        void gruposInvitables() {
            GrupoEstudioEntity otro = new GrupoEstudioEntity();
            otro.setId(UUID.randomUUID());
            otro.setNombre("Taller SQL");
            otro.setMaxMiembros((short) 10);
            when(miembroRepository.existsByGrupoIdAndUsuarioId(otro.getId(), invitado.getId())).thenReturn(true);

            GrupoMiembroEntity m1 = new GrupoMiembroEntity();
            m1.setGrupo(grupo);
            GrupoMiembroEntity m2 = new GrupoMiembroEntity();
            m2.setGrupo(otro);
            when(miembroRepository.findByUsuarioIdWithGrupo(invitador.getId())).thenReturn(List.of(m1, m2));

            List<GrupoInvitableResponse> grupos = service.gruposInvitables(invitado.getId());

            assertThat(grupos).hasSize(2);
            assertThat(grupos.get(0).isDisponible()).isTrue();
            assertThat(grupos.get(1).isDisponible()).isFalse();
            assertThat(grupos.get(1).getMotivo()).contains("integrante");
        }
    }

    @Nested
    class Responder {

        @BeforeEach
        void sesion() {
            TestData.loginComo(invitado);
        }

        @Test
        @DisplayName("aceptar agrega al grupo (aunque sea privado) y avisa a quien invitó")
        void aceptar() {
            InvitacionDirectaEntity invitacion = pendiente();

            RespuestaInvitacionResponse respuesta = service.aceptar(invitacion.getId());

            ArgumentCaptor<GrupoMiembroEntity> miembro = ArgumentCaptor.forClass(GrupoMiembroEntity.class);
            verify(miembroRepository).save(miembro.capture());
            assertThat(miembro.getValue().getUsuario()).isEqualTo(invitado);
            assertThat(miembro.getValue().getRol()).isEqualTo(RolGrupo.MIEMBRO);
            assertThat(invitacion.getEstado()).isEqualTo(EstadoInvitacion.ACEPTADA);
            assertThat(invitacion.getRespondidaAt()).isNotNull();
            assertThat(respuesta.getGrupoId()).isEqualTo(grupo.getId());
            verify(notificacionService).notificarRespuestaInvitacion(
                    invitador, "Bruno Invitado", "Proyecto Integrado", true, grupo.getId());
        }

        @Test
        @DisplayName("aceptar falla si el grupo se llenó y la invitación sigue pendiente")
        void aceptarGrupoLleno() {
            InvitacionDirectaEntity invitacion = pendiente();
            when(miembroRepository.countByGrupoId(grupo.getId())).thenReturn(5L);

            assertThatThrownBy(() -> service.aceptar(invitacion.getId()))
                    .isInstanceOf(BusinessException.class)
                    .extracting("code").isEqualTo("GROUP_FULL");
            assertThat(invitacion.getEstado()).isEqualTo(EstadoInvitacion.PENDIENTE);
            verify(miembroRepository, never()).save(any());
        }

        @Test
        @DisplayName("rechazar no agrega al grupo y avisa a quien invitó")
        void rechazar() {
            InvitacionDirectaEntity invitacion = pendiente();

            service.rechazar(invitacion.getId());

            assertThat(invitacion.getEstado()).isEqualTo(EstadoInvitacion.RECHAZADA);
            verify(miembroRepository, never()).save(any());
            verify(notificacionService).notificarRespuestaInvitacion(
                    invitador, "Bruno Invitado", "Proyecto Integrado", false, grupo.getId());
        }

        @Test
        @DisplayName("una invitación ya respondida no se puede responder de nuevo")
        void yaRespondida() {
            InvitacionDirectaEntity invitacion = pendiente();
            invitacion.setEstado(EstadoInvitacion.RECHAZADA);

            assertThatThrownBy(() -> service.aceptar(invitacion.getId()))
                    .isInstanceOf(BusinessException.class)
                    .extracting("code").isEqualTo("INVITACION_RESPONDIDA");
        }

        @Test
        @DisplayName("nadie más que la persona invitada puede responder")
        void soloInvitado() {
            InvitacionDirectaEntity invitacion = pendiente();
            TestData.loginComo(invitador);

            assertThatThrownBy(() -> service.aceptar(invitacion.getId()))
                    .isInstanceOf(EntityNotFoundException.class);
            verify(notificacionService, never())
                    .notificarRespuestaInvitacion(any(), anyString(), anyString(), anyBoolean(), eq(grupo.getId()));
        }

        @Test
        @DisplayName("lista las invitaciones pendientes recibidas sin exponer correos")
        void listarRecibidas() {
            InvitacionDirectaEntity invitacion = pendiente();
            invitacion.setMensaje("Hola");
            when(invitacionRepository.findRecibidas(invitado.getId(), EstadoInvitacion.PENDIENTE))
                    .thenReturn(List.of(invitacion));

            List<InvitacionDirectaResponse> recibidas = service.listarRecibidas();

            assertThat(recibidas).hasSize(1);
            assertThat(recibidas.get(0).getInvitadorNombre()).isEqualTo("Ana Invitadora");
            assertThat(recibidas.get(0).getGrupoNombre()).isEqualTo("Proyecto Integrado");
            assertThat(recibidas.get(0).getMiembros()).isEqualTo(2L);
        }
    }
}
