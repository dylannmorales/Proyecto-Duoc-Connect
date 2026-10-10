package cl.duoc.connect.application.mapper;

import cl.duoc.connect.application.dto.response.GrupoResponse;
import cl.duoc.connect.application.dto.response.MensajeGrupoResponse;
import cl.duoc.connect.application.dto.response.MiembroGrupoResponse;
import cl.duoc.connect.domain.enums.RolGrupo;
import cl.duoc.connect.infrastructure.persistence.entity.GrupoEstudioEntity;
import cl.duoc.connect.infrastructure.persistence.entity.GrupoMiembroEntity;
import cl.duoc.connect.infrastructure.persistence.entity.MensajeGrupoEntity;
import org.springframework.stereotype.Component;

@Component
public class GrupoMapper {

    public GrupoResponse toResponse(
            GrupoEstudioEntity grupo,
            long miembrosActuales,
            boolean esMiembro,
            RolGrupo rolEnGrupo) {

        return GrupoResponse.builder()
                .id(grupo.getId())
                .nombre(grupo.getNombre())
                .descripcion(grupo.getDescripcion())
                .carreraId(grupo.getCarrera().getId())
                .carreraNombre(grupo.getCarrera().getNombre())
                .asignaturaId(grupo.getAsignatura() != null ? grupo.getAsignatura().getId() : null)
                .asignaturaNombre(grupo.getAsignatura() != null ? grupo.getAsignatura().getNombre() : null)
                .creadorId(grupo.getCreador().getId())
                .creadorNombre(grupo.getCreador().getNombre())
                .maxMiembros(grupo.getMaxMiembros())
                .miembrosActuales(miembrosActuales)
                .privado(Boolean.TRUE.equals(grupo.getPrivado()))
                .codigoInvitacion(esMiembro ? grupo.getCodigoInvitacion() : null)
                .esMiembro(esMiembro)
                .rolEnGrupo(rolEnGrupo)
                .createdAt(grupo.getCreatedAt())
                .build();
    }

    public MiembroGrupoResponse toMiembroResponse(GrupoMiembroEntity miembro) {
        return MiembroGrupoResponse.builder()
                .usuarioId(miembro.getUsuario().getId())
                .nombre(miembro.getUsuario().getNombre())
                .fotoUrl(miembro.getUsuario().getFotoUrl())
                .rol(miembro.getRol())
                .joinedAt(miembro.getJoinedAt())
                .build();
    }

    public MensajeGrupoResponse toMensajeResponse(MensajeGrupoEntity mensaje) {
        return MensajeGrupoResponse.builder()
                .id(mensaje.getId())
                .grupoId(mensaje.getGrupo().getId())
                .usuarioId(mensaje.getUsuario().getId())
                .usuarioNombre(mensaje.getUsuario().getNombre())
                .usuarioFotoUrl(mensaje.getUsuario().getFotoUrl())
                .contenido(mensaje.getContenido())
                .createdAt(mensaje.getCreatedAt())
                .build();
    }
}
