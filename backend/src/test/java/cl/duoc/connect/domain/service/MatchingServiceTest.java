package cl.duoc.connect.domain.service;

import cl.duoc.connect.domain.service.MatchingService.DisponibilidadSlot;
import cl.duoc.connect.domain.service.MatchingService.MatchingProfile;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/** HU-14: cálculo de compatibilidad entre estudiantes (carrera 25, asignaturas 30, horario 25, habilidades 20). */
class MatchingServiceTest {

    private final MatchingService matching = new MatchingService();
    private final UUID carrera = UUID.randomUUID();
    private final UUID bd = UUID.randomUUID();
    private final UUID web = UUID.randomUUID();
    private final UUID java = UUID.randomUUID();
    private final UUID sql = UUID.randomUUID();

    private DisponibilidadSlot slot(int dia, int desde, int hasta) {
        return new DisponibilidadSlot((short) dia, LocalTime.of(desde, 0), LocalTime.of(hasta, 0));
    }

    @Test
    @DisplayName("Perfiles idénticos en carrera, asignaturas y horario, con habilidades distintas, suman 100")
    void compatibilidadMaxima() {
        MatchingProfile a = new MatchingProfile(carrera, Set.of(bd, web), Set.of(java), List.of(slot(1, 10, 12)));
        MatchingProfile b = new MatchingProfile(carrera, Set.of(bd, web), Set.of(sql), List.of(slot(1, 10, 12)));

        assertThat(matching.calcularScore(a, b)).isEqualTo(100);
        assertThat(matching.contarAsignaturasEnComun(a, b)).isEqualTo(2);
    }

    @Test
    @DisplayName("Sin nada en común el puntaje es 0")
    void sinNadaEnComun() {
        MatchingProfile a = new MatchingProfile(carrera, Set.of(bd), Set.of(java), List.of(slot(1, 8, 10)));
        MatchingProfile b = new MatchingProfile(UUID.randomUUID(), Set.of(web), Set.of(java), List.of(slot(2, 8, 10)));

        assertThat(matching.calcularScore(a, b)).isZero();
        assertThat(matching.contarAsignaturasEnComun(a, b)).isZero();
    }

    @Test
    @DisplayName("Media asignatura en común y medio horario solapado dan puntaje parcial")
    void parcial() {
        MatchingProfile a = new MatchingProfile(carrera, Set.of(bd, web), Set.of(), List.of(slot(3, 10, 12)));
        MatchingProfile b = new MatchingProfile(carrera, Set.of(bd), Set.of(), List.of(slot(3, 11, 13)));

        // 25 (carrera) + 15 (1 de 2 asignaturas) + 12,5 (60 de 120 minutos) + 0 (sin habilidades)
        assertThat(matching.calcularScore(a, b)).isEqualTo(53);
    }

    @Test
    @DisplayName("Perfiles vacíos no producen división por cero")
    void perfilesVacios() {
        MatchingProfile a = new MatchingProfile(carrera, Set.of(), Set.of(), List.of());
        MatchingProfile b = new MatchingProfile(carrera, Set.of(), Set.of(), List.of());

        assertThat(matching.calcularScore(a, b)).isEqualTo(25);
    }

    @Test
    @DisplayName("Horarios de duración cero no suman solapamiento")
    void horariosSinDuracion() {
        MatchingProfile a = new MatchingProfile(carrera, Set.of(), Set.of(), List.of(slot(1, 10, 10)));
        MatchingProfile b = new MatchingProfile(carrera, Set.of(), Set.of(), List.of(slot(1, 10, 10)));

        assertThat(matching.calcularScore(a, b)).isEqualTo(25);
    }
}
