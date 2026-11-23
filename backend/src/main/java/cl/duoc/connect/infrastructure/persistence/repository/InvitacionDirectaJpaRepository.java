package cl.duoc.connect.infrastructure.persistence.repository;

import cl.duoc.connect.domain.enums.EstadoInvitacion;
import cl.duoc.connect.infrastructure.persistence.entity.InvitacionDirectaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InvitacionDirectaJpaRepository extends JpaRepository<InvitacionDirectaEntity, UUID> {

    boolean existsByGrupoIdAndInvitadoIdAndEstado(UUID grupoId, UUID invitadoId, EstadoInvitacion estado);

    @Query("""
            SELECT i FROM InvitacionDirectaEntity i
            JOIN FETCH i.grupo g
            JOIN FETCH g.carrera
            LEFT JOIN FETCH g.asignatura
            JOIN FETCH i.invitador
            WHERE i.invitado.id = :invitadoId AND i.estado = :estado
            ORDER BY i.createdAt DESC
            """)
    List<InvitacionDirectaEntity> findRecibidas(
            @Param("invitadoId") UUID invitadoId,
            @Param("estado") EstadoInvitacion estado);

    @Query("""
            SELECT i FROM InvitacionDirectaEntity i
            JOIN FETCH i.grupo
            JOIN FETCH i.invitador
            JOIN FETCH i.invitado
            WHERE i.id = :id
            """)
    Optional<InvitacionDirectaEntity> findByIdWithDetails(@Param("id") UUID id);
}
