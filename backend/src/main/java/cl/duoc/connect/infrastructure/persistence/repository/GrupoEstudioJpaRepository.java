package cl.duoc.connect.infrastructure.persistence.repository;

import cl.duoc.connect.infrastructure.persistence.entity.GrupoEstudioEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface GrupoEstudioJpaRepository extends JpaRepository<GrupoEstudioEntity, UUID> {

    boolean existsByCodigoInvitacion(String codigoInvitacion);

    @EntityGraph(attributePaths = {"carrera", "creador", "asignatura"})
    Optional<GrupoEstudioEntity> findByCodigoInvitacionIgnoreCase(String codigoInvitacion);

    @Query("""
            SELECT g FROM GrupoEstudioEntity g
            JOIN FETCH g.carrera
            JOIN FETCH g.creador
            LEFT JOIN FETCH g.asignatura
            WHERE g.id = :id
            """)
    Optional<GrupoEstudioEntity> findByIdWithDetails(@Param("id") UUID id);

    @EntityGraph(attributePaths = {"carrera", "creador", "asignatura"})
    @Query(value = """
            SELECT g FROM GrupoEstudioEntity g
            WHERE (
                g.privado = false
                OR EXISTS (
                    SELECT 1 FROM GrupoMiembroEntity gm
                    WHERE gm.grupo.id = g.id AND gm.usuario.id = :usuarioId
                )
            )
            AND (:carreraId IS NULL OR g.carrera.id = :carreraId)
            """,
            countQuery = """
            SELECT COUNT(g) FROM GrupoEstudioEntity g
            WHERE (
                g.privado = false
                OR EXISTS (
                    SELECT 1 FROM GrupoMiembroEntity gm
                    WHERE gm.grupo.id = g.id AND gm.usuario.id = :usuarioId
                )
            )
            AND (:carreraId IS NULL OR g.carrera.id = :carreraId)
            """)
    Page<GrupoEstudioEntity> buscarGrupos(
            @Param("usuarioId") UUID usuarioId,
            @Param("carreraId") UUID carreraId,
            Pageable pageable);

    @EntityGraph(attributePaths = {"carrera", "creador", "asignatura"})
    @Query(value = """
            SELECT g FROM GrupoEstudioEntity g
            WHERE (
                g.privado = false
                OR EXISTS (
                    SELECT 1 FROM GrupoMiembroEntity gm
                    WHERE gm.grupo.id = g.id AND gm.usuario.id = :usuarioId
                )
            )
            AND (:carreraId IS NULL OR g.carrera.id = :carreraId)
            AND (LOWER(g.nombre) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(COALESCE(g.descripcion, '')) LIKE LOWER(CONCAT('%', :q, '%')))
            """,
            countQuery = """
            SELECT COUNT(g) FROM GrupoEstudioEntity g
            WHERE (
                g.privado = false
                OR EXISTS (
                    SELECT 1 FROM GrupoMiembroEntity gm
                    WHERE gm.grupo.id = g.id AND gm.usuario.id = :usuarioId
                )
            )
            AND (:carreraId IS NULL OR g.carrera.id = :carreraId)
            AND (LOWER(g.nombre) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(COALESCE(g.descripcion, '')) LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    Page<GrupoEstudioEntity> buscarGruposConTexto(
            @Param("usuarioId") UUID usuarioId,
            @Param("carreraId") UUID carreraId,
            @Param("q") String q,
            Pageable pageable);

    @EntityGraph(attributePaths = {"carrera", "creador", "asignatura"})
    @Query(value = """
            SELECT g FROM GrupoEstudioEntity g
            ORDER BY g.createdAt DESC
            """,
            countQuery = "SELECT COUNT(g) FROM GrupoEstudioEntity g")
    Page<GrupoEstudioEntity> findAllForAdmin(Pageable pageable);
}
