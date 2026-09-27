package cl.duoc.connect.infrastructure.persistence.repository;

import cl.duoc.connect.infrastructure.persistence.entity.UsuarioHabilidadEntity;
import cl.duoc.connect.infrastructure.persistence.entity.UsuarioHabilidadId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface UsuarioHabilidadJpaRepository extends JpaRepository<UsuarioHabilidadEntity, UsuarioHabilidadId> {

    void deleteByUsuario_Id(UUID usuarioId);

    @Query("""
            SELECT uh FROM UsuarioHabilidadEntity uh
            JOIN FETCH uh.habilidad
            WHERE uh.usuario.id = :usuarioId
            """)
    List<UsuarioHabilidadEntity> findByUsuarioIdWithHabilidad(@Param("usuarioId") UUID usuarioId);

    boolean existsByUsuario_IdAndHabilidad_Id(UUID usuarioId, UUID habilidadId);
}
