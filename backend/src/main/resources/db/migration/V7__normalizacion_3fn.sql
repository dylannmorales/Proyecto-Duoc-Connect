-- =====================================================================
-- V7 - Normalización a 3FN e integridad declarativa
-- =====================================================================
-- 1. apuntes.carrera_id era una dependencia transitiva:
--    apunte -> asignatura -> carrera. Se elimina y la carrera se obtiene
--    siempre desde la asignatura.
-- 2. preguntas.tematica_general repetía "asignatura_id IS NULL". Se elimina.
-- 3. En preguntas y grupos la asignatura es opcional, por eso conservan
--    carrera_id. Una FK compuesta garantiza que, cuando hay asignatura,
--    la carrera coincida con la de la asignatura.
-- 4. Una sola respuesta aceptada por pregunta.
-- 5. Nombres de sede y de carrera únicos.
-- 6. Contadores desnormalizados (votos, valoraciones, descargas) con CHECK
--    de rango. Se mantienen a propósito por rendimiento (ver docs/modelo-datos.md).
-- =====================================================================

-- 1. apuntes: quitar carrera_id (derivable desde la asignatura)
DROP INDEX IF EXISTS idx_apuntes_carrera_asignatura;
ALTER TABLE apuntes DROP COLUMN carrera_id;
CREATE INDEX IF NOT EXISTS idx_apuntes_asignatura ON apuntes(asignatura_id);

-- 2. preguntas: quitar tematica_general (equivale a asignatura_id IS NULL)
ALTER TABLE preguntas DROP COLUMN tematica_general;

-- 3. Coherencia carrera <-> asignatura en preguntas y grupos
ALTER TABLE asignaturas ADD CONSTRAINT uq_asignaturas_id_carrera UNIQUE (id, carrera_id);

-- Corrige datos antiguos incoherentes antes de crear las FK
UPDATE preguntas p SET carrera_id = a.carrera_id
FROM asignaturas a
WHERE p.asignatura_id = a.id AND p.carrera_id <> a.carrera_id;

UPDATE grupos_estudio g SET carrera_id = a.carrera_id
FROM asignaturas a
WHERE g.asignatura_id = a.id AND g.carrera_id <> a.carrera_id;

-- MATCH SIMPLE: si asignatura_id es NULL (temática general / grupo sin asignatura) no se valida
ALTER TABLE preguntas
    ADD CONSTRAINT fk_preguntas_asignatura_carrera
    FOREIGN KEY (asignatura_id, carrera_id) REFERENCES asignaturas (id, carrera_id);

ALTER TABLE grupos_estudio
    ADD CONSTRAINT fk_grupos_asignatura_carrera
    FOREIGN KEY (asignatura_id, carrera_id) REFERENCES asignaturas (id, carrera_id);

-- 4. Una sola respuesta aceptada por pregunta (deja la más antigua si hubiera varias)
UPDATE respuestas r SET aceptada = FALSE
WHERE r.aceptada
  AND EXISTS (
      SELECT 1 FROM respuestas o
      WHERE o.pregunta_id = r.pregunta_id AND o.aceptada
        AND (o.created_at, o.id) < (r.created_at, r.id)
  );
CREATE UNIQUE INDEX uq_respuesta_aceptada_por_pregunta ON respuestas (pregunta_id) WHERE aceptada;

-- 5. Catálogos sin nombres repetidos
ALTER TABLE sedes ADD CONSTRAINT uq_sedes_nombre UNIQUE (nombre);
ALTER TABLE carreras ADD CONSTRAINT uq_carreras_nombre UNIQUE (nombre);

-- 6. Rango válido de los contadores desnormalizados
ALTER TABLE apuntes
    ADD CONSTRAINT ck_apuntes_contadores CHECK (
        total_valoraciones >= 0 AND descargas >= 0
        AND promedio_valoracion BETWEEN 0 AND 5
    );
ALTER TABLE preguntas ADD CONSTRAINT ck_preguntas_votos CHECK (votos >= 0);
ALTER TABLE respuestas ADD CONSTRAINT ck_respuestas_votos CHECK (votos >= 0);

-- Índices para las FK más consultadas que no tenían índice
CREATE INDEX IF NOT EXISTS idx_respuestas_pregunta ON respuestas(pregunta_id);
CREATE INDEX IF NOT EXISTS idx_grupo_miembros_usuario ON grupo_miembros(usuario_id);
CREATE INDEX IF NOT EXISTS idx_apuntes_usuario ON apuntes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_preguntas_usuario ON preguntas(usuario_id);
