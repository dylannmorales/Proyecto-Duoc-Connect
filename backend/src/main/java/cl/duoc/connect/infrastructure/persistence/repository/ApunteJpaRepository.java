package cl.duoc.connect.infrastructure.persistence.repository;

import cl.duoc.connect.infrastructure.persistence.entity.ApunteEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ApunteJpaRepository extends JpaRepository<ApunteEntity, UUID> {

    @Query("""
            SELECT a FROM ApunteEntity a
            JOIN FETCH a.usuario
            JOIN FETCH a.carrera
            JOIN FETCH a.asignatura
            WHERE a.id = :id
            """)
    Optional<ApunteEntity> findByIdWithDetails(@Param("id") UUID id);

    @EntityGraph(attributePaths = {"usuario", "carrera", "asignatura"})
    @Query(value = """
            SELECT a FROM ApunteEntity a
            WHERE (:carreraId IS NULL OR a.carrera.id = :carreraId)
            AND (:asignaturaId IS NULL OR a.asignatura.id = :asignaturaId)
            """,
            countQuery = """
            SELECT COUNT(a) FROM ApunteEntity a
            WHERE (:carreraId IS NULL OR a.carrera.id = :carreraId)
            AND (:asignaturaId IS NULL OR a.asignatura.id = :asignaturaId)
            """)
    Page<ApunteEntity> buscarApuntes(
            @Param("carreraId") UUID carreraId,
            @Param("asignaturaId") UUID asignaturaId,
            Pageable pageable);

    @EntityGraph(attributePaths = {"usuario", "carrera", "asignatura"})
    @Query(value = """
            SELECT a FROM ApunteEntity a
            WHERE (:carreraId IS NULL OR a.carrera.id = :carreraId)
            AND (:asignaturaId IS NULL OR a.asignatura.id = :asignaturaId)
            AND (LOWER(a.titulo) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(COALESCE(a.descripcion, '')) LIKE LOWER(CONCAT('%', :q, '%')))
            """,
            countQuery = """
            SELECT COUNT(a) FROM ApunteEntity a
            WHERE (:carreraId IS NULL OR a.carrera.id = :carreraId)
            AND (:asignaturaId IS NULL OR a.asignatura.id = :asignaturaId)
            AND (LOWER(a.titulo) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(COALESCE(a.descripcion, '')) LIKE LOWER(CONCAT('%', :q, '%')))
            """)
    Page<ApunteEntity> buscarApuntesConTexto(
            @Param("carreraId") UUID carreraId,
            @Param("asignaturaId") UUID asignaturaId,
            @Param("q") String q,
            Pageable pageable);

    @EntityGraph(attributePaths = {"usuario", "carrera", "asignatura"})
    @Query(value = """
            SELECT a FROM ApunteEntity a
            ORDER BY a.createdAt DESC
            """,
            countQuery = "SELECT COUNT(a) FROM ApunteEntity a")
    Page<ApunteEntity> findAllForAdmin(Pageable pageable);
}
