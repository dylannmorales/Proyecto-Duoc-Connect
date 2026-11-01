package cl.duoc.connect.infrastructure.persistence.repository;

import cl.duoc.connect.infrastructure.persistence.entity.RespuestaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RespuestaJpaRepository extends JpaRepository<RespuestaEntity, UUID> {

    @Query("""
            SELECT r FROM RespuestaEntity r
            JOIN FETCH r.usuario
            WHERE r.pregunta.id = :preguntaId
            ORDER BY r.aceptada DESC, r.votos DESC, r.createdAt ASC
            """)
    List<RespuestaEntity> findByPreguntaId(@Param("preguntaId") UUID preguntaId);

    @Query("""
            SELECT r FROM RespuestaEntity r
            JOIN FETCH r.usuario
            JOIN FETCH r.pregunta p
            JOIN FETCH p.usuario
            WHERE r.id = :id
            """)
    Optional<RespuestaEntity> findByIdWithDetails(@Param("id") UUID id);

    /** Filas [preguntaId, totalRespuestas, respuestasAceptadas]. */
    @Query("""
            SELECT r.pregunta.id, COUNT(r), SUM(CASE WHEN r.aceptada = true THEN 1 ELSE 0 END)
            FROM RespuestaEntity r
            WHERE r.pregunta.id IN :ids
            GROUP BY r.pregunta.id
            """)
    List<Object[]> resumenPorPregunta(@Param("ids") Collection<UUID> ids);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE RespuestaEntity r SET r.aceptada = false WHERE r.pregunta.id = :preguntaId AND r.aceptada = true")
    int quitarAceptadas(@Param("preguntaId") UUID preguntaId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = "INSERT INTO votos_respuesta (respuesta_id, usuario_id) VALUES (:id, :usuarioId) ON CONFLICT DO NOTHING",
            nativeQuery = true)
    int insertarVoto(@Param("id") UUID id, @Param("usuarioId") UUID usuarioId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = "DELETE FROM votos_respuesta WHERE respuesta_id = :id AND usuario_id = :usuarioId", nativeQuery = true)
    int eliminarVoto(@Param("id") UUID id, @Param("usuarioId") UUID usuarioId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE RespuestaEntity r SET r.votos = r.votos + :delta WHERE r.id = :id")
    int ajustarVotos(@Param("id") UUID id, @Param("delta") int delta);

    @Query(value = "SELECT respuesta_id FROM votos_respuesta WHERE usuario_id = :usuarioId AND respuesta_id IN (:ids)",
            nativeQuery = true)
    List<UUID> votadasPor(@Param("usuarioId") UUID usuarioId, @Param("ids") Collection<UUID> ids);
}
