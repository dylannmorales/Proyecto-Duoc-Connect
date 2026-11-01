package cl.duoc.connect.infrastructure.persistence.repository;

import cl.duoc.connect.infrastructure.persistence.entity.PreguntaEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PreguntaJpaRepository extends JpaRepository<PreguntaEntity, UUID> {

    @Query("""
            SELECT p FROM PreguntaEntity p
            JOIN FETCH p.usuario
            JOIN FETCH p.carrera
            LEFT JOIN FETCH p.asignatura
            WHERE p.id = :id
            """)
    Optional<PreguntaEntity> findByIdWithDetails(@Param("id") UUID id);

    /** estado: TODAS, RESUELTAS (con respuesta aceptada) o ABIERTAS. q ya viene en minúsculas y con %. */
    @EntityGraph(attributePaths = {"usuario", "carrera", "asignatura"})
    @Query(value = """
            SELECT p FROM PreguntaEntity p
            WHERE (:carreraId IS NULL OR p.carrera.id = :carreraId)
            AND (:asignaturaId IS NULL OR p.asignatura.id = :asignaturaId)
            AND (LOWER(p.titulo) LIKE :q OR LOWER(p.contenido) LIKE :q)
            AND (:estado = 'TODAS'
                OR (:estado = 'RESUELTAS' AND EXISTS (
                    SELECT 1 FROM RespuestaEntity r WHERE r.pregunta = p AND r.aceptada = true))
                OR (:estado = 'ABIERTAS' AND NOT EXISTS (
                    SELECT 1 FROM RespuestaEntity r WHERE r.pregunta = p AND r.aceptada = true)))
            """,
            countQuery = """
            SELECT COUNT(p) FROM PreguntaEntity p
            WHERE (:carreraId IS NULL OR p.carrera.id = :carreraId)
            AND (:asignaturaId IS NULL OR p.asignatura.id = :asignaturaId)
            AND (LOWER(p.titulo) LIKE :q OR LOWER(p.contenido) LIKE :q)
            AND (:estado = 'TODAS'
                OR (:estado = 'RESUELTAS' AND EXISTS (
                    SELECT 1 FROM RespuestaEntity r WHERE r.pregunta = p AND r.aceptada = true))
                OR (:estado = 'ABIERTAS' AND NOT EXISTS (
                    SELECT 1 FROM RespuestaEntity r WHERE r.pregunta = p AND r.aceptada = true)))
            """)
    Page<PreguntaEntity> buscar(
            @Param("carreraId") UUID carreraId,
            @Param("asignaturaId") UUID asignaturaId,
            @Param("q") String q,
            @Param("estado") String estado,
            Pageable pageable);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = "INSERT INTO votos_pregunta (pregunta_id, usuario_id) VALUES (:id, :usuarioId) ON CONFLICT DO NOTHING",
            nativeQuery = true)
    int insertarVoto(@Param("id") UUID id, @Param("usuarioId") UUID usuarioId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = "DELETE FROM votos_pregunta WHERE pregunta_id = :id AND usuario_id = :usuarioId", nativeQuery = true)
    int eliminarVoto(@Param("id") UUID id, @Param("usuarioId") UUID usuarioId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE PreguntaEntity p SET p.votos = p.votos + :delta WHERE p.id = :id")
    int ajustarVotos(@Param("id") UUID id, @Param("delta") int delta);

    @Query(value = "SELECT pregunta_id FROM votos_pregunta WHERE usuario_id = :usuarioId AND pregunta_id IN (:ids)",
            nativeQuery = true)
    List<UUID> votadasPor(@Param("usuarioId") UUID usuarioId, @Param("ids") Collection<UUID> ids);
}
