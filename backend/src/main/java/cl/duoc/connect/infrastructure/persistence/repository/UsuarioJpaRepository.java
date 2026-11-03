package cl.duoc.connect.infrastructure.persistence.repository;

import cl.duoc.connect.infrastructure.persistence.entity.UsuarioEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UsuarioJpaRepository extends JpaRepository<UsuarioEntity, UUID> {

    Optional<UsuarioEntity> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    @Query("SELECT u FROM UsuarioEntity u JOIN FETCH u.carrera JOIN FETCH u.sede WHERE u.id = :id")
    Optional<UsuarioEntity> findByIdWithRelations(@Param("id") UUID id);

    @Query("SELECT u FROM UsuarioEntity u JOIN FETCH u.carrera JOIN FETCH u.sede WHERE LOWER(u.email) = LOWER(:email)")
    Optional<UsuarioEntity> findByEmailWithRelations(@Param("email") String email);

    @Query(value = """
            SELECT u FROM UsuarioEntity u
            JOIN FETCH u.carrera
            JOIN FETCH u.sede
            ORDER BY u.createdAt DESC
            """,
            countQuery = "SELECT COUNT(u) FROM UsuarioEntity u")
    Page<UsuarioEntity> findAllWithRelations(Pageable pageable);

    long countByActivoTrue();

    @EntityGraph(attributePaths = {"carrera", "sede"})
    @Query(value = """
            SELECT u FROM UsuarioEntity u
            WHERE u.fotoUrl IS NOT NULL AND u.fotoUrl <> ''
            ORDER BY u.updatedAt DESC
            """,
            countQuery = """
            SELECT COUNT(u) FROM UsuarioEntity u
            WHERE u.fotoUrl IS NOT NULL AND u.fotoUrl <> ''
            """)
    Page<UsuarioEntity> findUsuariosConFoto(Pageable pageable);
}
