package cl.duoc.connect.domain.service;

import java.util.Objects;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class MatchingService {

    public int calcularScore(MatchingProfile current, MatchingProfile candidate) {
        double carreraScore = current.carreraId().equals(candidate.carreraId()) ? 25.0 : 0.0;

        Set<UUID> comunesAsignaturas = new HashSet<>(current.asignaturaIds());
        comunesAsignaturas.retainAll(candidate.asignaturaIds());
        int maxAsignaturas = Math.max(current.asignaturaIds().size(), candidate.asignaturaIds().size());
        double asignaturaScore = maxAsignaturas == 0
                ? 0
                : (comunesAsignaturas.size() / (double) maxAsignaturas) * 30.0;

        double horarioScore = calcularSolapamientoHorario(current.disponibilidades(), candidate.disponibilidades()) * 25.0;

        double habilidadScore = calcularHabilidadesComplementarias(
                current.habilidadIds(), candidate.habilidadIds()) * 20.0;

        return (int) Math.round(carreraScore + asignaturaScore + horarioScore + habilidadScore);
    }

    public int contarAsignaturasEnComun(MatchingProfile a, MatchingProfile b) {
        Set<UUID> comunes = new HashSet<>(a.asignaturaIds());
        comunes.retainAll(b.asignaturaIds());
        return comunes.size();
    }

    private double calcularSolapamientoHorario(List<DisponibilidadSlot> a, List<DisponibilidadSlot> b) {
        if (a.isEmpty() || b.isEmpty()) {
            return 0;
        }

        int totalMinutosA = a.stream().mapToInt(this::duracionMinutos).sum();
        int totalMinutosB = b.stream().mapToInt(this::duracionMinutos).sum();
        int maxTotal = Math.max(totalMinutosA, totalMinutosB);

        if (maxTotal == 0) {
            return 0;
        }

        int solapados = 0;
        for (DisponibilidadSlot slotA : a) {
            for (DisponibilidadSlot slotB : b) {
                if (Objects.equals(slotA.diaSemana(), slotB.diaSemana())) {
                    solapados += minutosSolapados(slotA, slotB);
                }
            }
        }

        return Math.min(1.0, solapados / (double) maxTotal);
    }

    private int minutosSolapados(DisponibilidadSlot a, DisponibilidadSlot b) {
        int inicio = Math.max(toMinutes(a.horaInicio()), toMinutes(b.horaInicio()));
        int fin = Math.min(toMinutes(a.horaFin()), toMinutes(b.horaFin()));
        return Math.max(0, fin - inicio);
    }

    private int toMinutes(LocalTime time) {
        if (time == null) {
            return 0;
        }
        return time.getHour() * 60 + time.getMinute();
    }

    private int duracionMinutos(DisponibilidadSlot slot) {
        return toMinutes(slot.horaFin()) - toMinutes(slot.horaInicio());
    }

    private double calcularHabilidadesComplementarias(Set<UUID> misHabilidades, Set<UUID> susHabilidades) {
        if (susHabilidades.isEmpty()) {
            return 0;
        }

        long complementarias = susHabilidades.stream()
                .filter(id -> !misHabilidades.contains(id))
                .count();

        return complementarias / (double) susHabilidades.size();
    }

    public record MatchingProfile(
            UUID carreraId,
            Set<UUID> asignaturaIds,
            Set<UUID> habilidadIds,
            List<DisponibilidadSlot> disponibilidades) {}

    public record DisponibilidadSlot(Short diaSemana, LocalTime horaInicio, LocalTime horaFin) {}
}
