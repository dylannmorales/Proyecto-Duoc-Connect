-- Invitación directa a un grupo desde el perfil de un compañero (sin conocer su correo).
-- La persona invitada decide si acepta (entra al grupo) o rechaza; quien invita recibe la respuesta.
ALTER TYPE tipo_notificacion ADD VALUE IF NOT EXISTS 'INVITACION_DIRECTA';
ALTER TYPE tipo_notificacion ADD VALUE IF NOT EXISTS 'RESPUESTA_INVITACION';

CREATE TABLE invitaciones_directas (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grupo_id       UUID NOT NULL REFERENCES grupos_estudio(id) ON DELETE CASCADE,
    invitador_id   UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    invitado_id    UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    mensaje        VARCHAR(300),
    estado         VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
                   CHECK (estado IN ('PENDIENTE', 'ACEPTADA', 'RECHAZADA')),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    respondida_at  TIMESTAMPTZ,
    CONSTRAINT chk_invitacion_no_a_si_mismo CHECK (invitador_id <> invitado_id)
);

-- Solo una invitación pendiente por persona y grupo
CREATE UNIQUE INDEX ux_invitacion_pendiente
    ON invitaciones_directas(grupo_id, invitado_id) WHERE estado = 'PENDIENTE';
CREATE INDEX idx_invitaciones_invitado ON invitaciones_directas(invitado_id, estado, created_at DESC);
