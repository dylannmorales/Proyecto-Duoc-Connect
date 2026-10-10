package cl.duoc.connect.infrastructure.persistence.repository;

import cl.duoc.connect.infrastructure.persistence.entity.MensajeGrupoEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface MensajeGrupoJpaRepository extends JpaRepository<MensajeGrupoEntity, UUID> {

    @EntityGraph(attributePaths = {"usuario", "grupo"})
    @Query("SELECT m FROM MensajeGrupoEntity m WHERE m.grupo.id = :grupoId")
    Page<MensajeGrupoEntity> findByGrupoId(@Param("grupoId") UUID grupoId, Pageable pageable);

    @EntityGraph(attributePaths = {"usuario", "grupo"})
    @Query("""
            SELECT m FROM MensajeGrupoEntity m
            WHERE m.id = :id
            """)
    Optional<MensajeGrupoEntity> findByIdWithDetails(@Param("id") UUID id);

    @EntityGraph(attributePaths = {"usuario", "grupo"})
    @Query(value = """
            SELECT m FROM MensajeGrupoEntity m
            ORDER BY m.createdAt DESC
            """,
            countQuery = "SELECT COUNT(m) FROM MensajeGrupoEntity m")
    Page<MensajeGrupoEntity> findAllForAdmin(Pageable pageable);
}
