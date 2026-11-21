package cl.duoc.connect.infrastructure.persistence.repository;

import cl.duoc.connect.infrastructure.persistence.entity.PerfilProyectoEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PerfilProyectoJpaRepository extends JpaRepository<PerfilProyectoEntity, UUID> {

    @Query("""
            SELECT p FROM PerfilProyectoEntity p
            JOIN FETCH p.usuario u
            JOIN FETCH u.carrera
            JOIN FETCH u.sede
            WHERE p.usuarioId = :usuarioId
            """)
    Optional<PerfilProyectoEntity> findByUsuarioIdWithUsuario(@Param("usuarioId") UUID usuarioId);

    long countByBuscandoCompaneroTrue();

    @Query("""
            SELECT p FROM PerfilProyectoEntity p
            JOIN FETCH p.usuario u
            JOIN FETCH u.carrera
            JOIN FETCH u.sede
            WHERE p.buscandoCompanero = true
            AND u.activo = true
            AND u.id <> :currentUserId
            """)
    List<PerfilProyectoEntity> findCandidatos(@Param("currentUserId") UUID currentUserId);

    @EntityGraph(attributePaths = {"usuario", "usuario.carrera"})
    @Query(value = """
            SELECT p FROM PerfilProyectoEntity p
            ORDER BY p.updatedAt DESC
            """,
            countQuery = "SELECT COUNT(p) FROM PerfilProyectoEntity p")
    Page<PerfilProyectoEntity> findAllForAdmin(Pageable pageable);

    @EntityGraph(attributePaths = {"usuario", "usuario.carrera"})
    @Query("""
            SELECT p FROM PerfilProyectoEntity p
            WHERE p.usuarioId = :usuarioId
            """)
    Optional<PerfilProyectoEntity> findByUsuarioIdForAdmin(@Param("usuarioId") UUID usuarioId);
}
