package cl.duoc.connect.infrastructure.persistence.repository;

import cl.duoc.connect.infrastructure.persistence.entity.GrupoMiembroEntity;
import cl.duoc.connect.infrastructure.persistence.entity.GrupoMiembroId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GrupoMiembroJpaRepository extends JpaRepository<GrupoMiembroEntity, GrupoMiembroId> {

    boolean existsByGrupoIdAndUsuarioId(UUID grupoId, UUID usuarioId);

    Optional<GrupoMiembroEntity> findByGrupoIdAndUsuarioId(UUID grupoId, UUID usuarioId);

    long countByGrupoId(UUID grupoId);

    @Query("""
            SELECT gm FROM GrupoMiembroEntity gm
            JOIN FETCH gm.usuario u
            WHERE gm.grupo.id = :grupoId
            ORDER BY gm.joinedAt ASC
            """)
    List<GrupoMiembroEntity> findByGrupoIdWithUsuario(@Param("grupoId") UUID grupoId);

    @Query("""
            SELECT gm FROM GrupoMiembroEntity gm
            JOIN FETCH gm.usuario
            WHERE gm.grupo.id = :grupoId
            ORDER BY gm.joinedAt ASC
            """)
    List<GrupoMiembroEntity> findMiembrosOrdenados(@Param("grupoId") UUID grupoId);
}
