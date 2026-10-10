-- Sedes Duoc UC ampliadas
INSERT INTO sedes (nombre, ciudad)
SELECT v.nombre, v.ciudad
FROM (VALUES
    ('Sede Alameda', 'Santiago'),
    ('Sede Antonio Varas', 'Santiago'),
    ('Sede Melipilla', 'Melipilla'),
    ('Sede Padre Alonso de Ovalle', 'Santiago'),
    ('Sede Plaza Norte', 'Santiago'),
    ('Sede Plaza Oeste', 'Santiago'),
    ('Sede Plaza Vespucio', 'Santiago'),
    ('Sede Puente Alto', 'Puente Alto'),
    ('Sede San Bernardo', 'San Bernardo'),
    ('Sede San Carlos de Apoquindo', 'Santiago'),
    ('Sede San Andrés de Concepción', 'Concepción'),
    ('Campus Arauco', 'Arauco'),
    ('Campus Nacimiento', 'Nacimiento'),
    ('Campus Villarrica', 'Villarrica'),
    ('Sede Puerto Montt', 'Puerto Montt')
) AS v(nombre, ciudad)
WHERE NOT EXISTS (SELECT 1 FROM sedes s WHERE s.nombre = v.nombre);

UPDATE sedes SET nombre = 'Sede Maipú' WHERE nombre = 'Maipú';
UPDATE sedes SET nombre = 'Sede San Joaquín' WHERE nombre = 'San Joaquín';
UPDATE sedes SET nombre = 'Sede Valparaíso' WHERE nombre = 'Valparaíso';
UPDATE sedes SET nombre = 'Sede Viña del Mar' WHERE nombre = 'Viña del Mar';

-- Carreras ampliadas
INSERT INTO carreras (nombre, codigo)
SELECT v.nombre, v.codigo
FROM (VALUES
    ('Ingeniería en Industrial', 'ING_IND'),
    ('Administración de Empresas', 'ADM_EMP'),
    ('Contador Auditor', 'CON_AUD'),
    ('Ingeniería en Automatización y Control Industrial', 'ING_AUTO'),
    ('Diseño de Ambientes', 'DISE_AMB'),
    ('Ingeniería Mecánica Automotriz y Autotrónica', 'ING_MEC'),
    ('Ingeniería en Gestión de la Construcción', 'ING_GCI'),
    ('Técnico en Enfermería', 'TEC_ENF'),
    ('Ingeniería en Logística', 'ING_LOG'),
    ('Gestión de Pequeñas y Medianas Empresas', 'GEST_PYM'),
    ('Ingeniería en Prevención de Riesgos', 'ING_PREV'),
    ('Técnico en Telecomunicaciones', 'TEC_TEL')
) AS v(nombre, codigo)
WHERE NOT EXISTS (SELECT 1 FROM carreras c WHERE c.codigo = v.codigo);

-- Habilidades ampliadas
INSERT INTO habilidades (nombre)
SELECT v.nombre
FROM (VALUES
    ('TypeScript'), ('Node.js'), ('Angular'), ('Vue.js'), ('Kotlin'), ('C#'),
    ('AWS'), ('Azure'), ('Linux'), ('Scrum'), ('Figma'), ('Excel'),
    ('Power BI'), ('MongoDB'), ('PostgreSQL'), ('Flutter'), ('Dart'),
    ('C++'), ('PHP'), ('Laravel'), ('.NET'), ('Kubernetes'), ('CI/CD'),
    ('Análisis de datos'), ('Trabajo en equipo'), ('Resolución de problemas'),
    ('Presentaciones'), ('Investigación'), ('Redacción técnica'), ('Empatía')
) AS v(nombre)
WHERE NOT EXISTS (SELECT 1 FROM habilidades h WHERE h.nombre = v.nombre);

-- Asignaturas para carreras nuevas y existentes
INSERT INTO asignaturas (nombre, codigo, carrera_id)
SELECT v.nombre, v.codigo, c.id
FROM (VALUES
    ('INF', 'Arquitectura de Software', 'ARQ401'),
    ('INF', 'Desarrollo Móvil', 'MOV401'),
    ('INF', 'Ciberseguridad', 'CIB401'),
    ('INF', 'Cloud Computing', 'CLD401'),
    ('ICR', 'Telecomunicaciones Avanzadas', 'TEL401'),
    ('ICR', 'Virtualización', 'VIR301'),
    ('AP', 'Desarrollo Full Stack', 'FS401'),
    ('AP', 'Testing y QA', 'QA301'),
    ('ING_IND', 'Gestión de Operaciones', 'GO201'),
    ('ING_IND', 'Lean Manufacturing', 'LM301'),
    ('ING_IND', 'Calidad Total', 'CT301'),
    ('ING_IND', 'Simulación Industrial', 'SI401'),
    ('ADM_EMP', 'Marketing', 'MKT201'),
    ('ADM_EMP', 'Finanzas Corporativas', 'FIN301'),
    ('ADM_EMP', 'Recursos Humanos', 'RRHH301'),
    ('ADM_EMP', 'Emprendimiento', 'EMP401'),
    ('CON_AUD', 'Contabilidad Financiera', 'CF201'),
    ('CON_AUD', 'Tributación', 'TRI301'),
    ('CON_AUD', 'Auditoría', 'AUD401'),
    ('ING_AUTO', 'Control de Procesos', 'CP201'),
    ('ING_AUTO', 'Instrumentación Industrial', 'II301'),
    ('ING_AUTO', 'Robótica', 'ROB401'),
    ('DISE_AMB', 'Dibujo Técnico', 'DT101'),
    ('DISE_AMB', 'Materiales y Acabados', 'MA301'),
    ('DISE_AMB', 'Proyecto de Diseño', 'PD401'),
    ('ING_MEC', 'Mecánica Automotriz', 'MAU201'),
    ('ING_MEC', 'Sistemas Eléctricos Vehiculares', 'SEV301'),
    ('ING_GCI', 'Planificación de Obras', 'PO201'),
    ('ING_GCI', 'Costos de Construcción', 'CC301'),
    ('TEC_ENF', 'Fundamentos de Enfermería', 'FE101'),
    ('TEC_ENF', 'Cuidados Clínicos', 'CC201'),
    ('ING_LOG', 'Cadena de Suministro', 'CS201'),
    ('ING_LOG', 'Gestión de Inventarios', 'GI301'),
    ('GEST_PYM', 'Plan de Negocios', 'PN201'),
    ('GEST_PYM', 'Gestión Financiera Pyme', 'GFP301'),
    ('ING_PREV', 'Higiene y Seguridad', 'HS201'),
    ('ING_PREV', 'Gestión de Riesgos', 'GR301'),
    ('TEC_TEL', 'Redes Básicas', 'RB101'),
    ('TEC_TEL', 'Instalaciones Eléctricas', 'IE201')
) AS v(carrera_codigo, nombre, codigo)
JOIN carreras c ON c.codigo = v.carrera_codigo
WHERE NOT EXISTS (
    SELECT 1 FROM asignaturas a WHERE a.codigo = v.codigo AND a.carrera_id = c.id
);

-- Foro: preguntas sin asignatura (temática general) e imágenes opcionales
ALTER TABLE preguntas ALTER COLUMN asignatura_id DROP NOT NULL;
ALTER TABLE preguntas ADD COLUMN IF NOT EXISTS tematica_general BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE preguntas ADD COLUMN IF NOT EXISTS imagen_url VARCHAR(500);

-- Notificaciones (preparado para app móvil)
CREATE TYPE tipo_notificacion AS ENUM ('MENSAJE_GRUPO');

CREATE TABLE notificaciones (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo        tipo_notificacion NOT NULL,
    titulo      VARCHAR(200) NOT NULL,
    mensaje     TEXT NOT NULL,
    enlace      VARCHAR(500),
    leida       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id, leida, created_at DESC);
