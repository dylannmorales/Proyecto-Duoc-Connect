-- Duoc Connect - Esquema inicial
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE rol_usuario AS ENUM ('ESTUDIANTE', 'ADMINISTRADOR');
CREATE TYPE rol_grupo AS ENUM ('MIEMBRO', 'ADMIN_GRUPO');
CREATE TYPE nivel_habilidad AS ENUM ('BASICO', 'INTERMEDIO', 'AVANZADO');
CREATE TYPE visibilidad_perfil AS ENUM ('PUBLICO', 'SOLO_CARRERA');

CREATE TABLE carreras (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre      VARCHAR(150) NOT NULL,
    codigo      VARCHAR(20)  NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE sedes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre      VARCHAR(100) NOT NULL,
    ciudad      VARCHAR(100) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE asignaturas (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre      VARCHAR(150) NOT NULL,
    codigo      VARCHAR(20)  NOT NULL,
    carrera_id  UUID NOT NULL REFERENCES carreras(id),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (codigo, carrera_id)
);

CREATE TABLE habilidades (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre      VARCHAR(100) NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE usuarios (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    nombre          VARCHAR(150) NOT NULL,
    carrera_id      UUID NOT NULL REFERENCES carreras(id),
    sede_id         UUID NOT NULL REFERENCES sedes(id),
    semestre        SMALLINT NOT NULL CHECK (semestre BETWEEN 1 AND 12),
    foto_url        VARCHAR(500),
    rol             rol_usuario NOT NULL DEFAULT 'ESTUDIANTE',
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE password_reset_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token       VARCHAR(255) NOT NULL UNIQUE,
    expira_en   TIMESTAMPTZ NOT NULL,
    usado       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE grupos_estudio (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre              VARCHAR(150) NOT NULL,
    descripcion         TEXT,
    carrera_id          UUID NOT NULL REFERENCES carreras(id),
    asignatura_id       UUID REFERENCES asignaturas(id),
    creador_id          UUID NOT NULL REFERENCES usuarios(id),
    max_miembros        SMALLINT NOT NULL DEFAULT 20 CHECK (max_miembros BETWEEN 2 AND 50),
    privado             BOOLEAN NOT NULL DEFAULT FALSE,
    codigo_invitacion   VARCHAR(10) NOT NULL UNIQUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE grupo_miembros (
    grupo_id    UUID NOT NULL REFERENCES grupos_estudio(id) ON DELETE CASCADE,
    usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    rol         rol_grupo NOT NULL DEFAULT 'MIEMBRO',
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (grupo_id, usuario_id)
);

CREATE TABLE mensajes_grupo (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grupo_id    UUID NOT NULL REFERENCES grupos_estudio(id) ON DELETE CASCADE,
    usuario_id  UUID NOT NULL REFERENCES usuarios(id),
    contenido   TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE apuntes (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo                  VARCHAR(200) NOT NULL,
    descripcion             TEXT,
    usuario_id              UUID NOT NULL REFERENCES usuarios(id),
    carrera_id              UUID NOT NULL REFERENCES carreras(id),
    asignatura_id           UUID NOT NULL REFERENCES asignaturas(id),
    archivo_url             VARCHAR(500) NOT NULL,
    nombre_archivo          VARCHAR(255) NOT NULL,
    tamano_bytes            BIGINT NOT NULL,
    promedio_valoracion     DECIMAL(3,2) DEFAULT 0,
    total_valoraciones      INT NOT NULL DEFAULT 0,
    descargas               INT NOT NULL DEFAULT 0,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE valoraciones_apunte (
    apunte_id   UUID NOT NULL REFERENCES apuntes(id) ON DELETE CASCADE,
    usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    puntuacion  SMALLINT NOT NULL CHECK (puntuacion BETWEEN 1 AND 5),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (apunte_id, usuario_id)
);

CREATE TABLE preguntas (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo          VARCHAR(200) NOT NULL,
    contenido       TEXT NOT NULL,
    usuario_id      UUID NOT NULL REFERENCES usuarios(id),
    asignatura_id   UUID NOT NULL REFERENCES asignaturas(id),
    carrera_id      UUID NOT NULL REFERENCES carreras(id),
    votos           INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE respuestas (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pregunta_id     UUID NOT NULL REFERENCES preguntas(id) ON DELETE CASCADE,
    usuario_id      UUID NOT NULL REFERENCES usuarios(id),
    contenido       TEXT NOT NULL,
    votos           INT NOT NULL DEFAULT 0,
    aceptada        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE votos_pregunta (
    pregunta_id UUID NOT NULL REFERENCES preguntas(id) ON DELETE CASCADE,
    usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (pregunta_id, usuario_id)
);

CREATE TABLE votos_respuesta (
    respuesta_id UUID NOT NULL REFERENCES respuestas(id) ON DELETE CASCADE,
    usuario_id   UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (respuesta_id, usuario_id)
);

CREATE TABLE perfiles_proyecto (
    usuario_id          UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    buscando_companero  BOOLEAN NOT NULL DEFAULT FALSE,
    bio                 TEXT,
    visibilidad         visibilidad_perfil NOT NULL DEFAULT 'SOLO_CARRERA',
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE usuario_asignaturas (
    usuario_id    UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    asignatura_id UUID NOT NULL REFERENCES asignaturas(id) ON DELETE CASCADE,
    PRIMARY KEY (usuario_id, asignatura_id)
);

CREATE TABLE usuario_habilidades (
    usuario_id    UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    habilidad_id  UUID NOT NULL REFERENCES habilidades(id) ON DELETE CASCADE,
    nivel         nivel_habilidad NOT NULL DEFAULT 'BASICO',
    PRIMARY KEY (usuario_id, habilidad_id)
);

CREATE TABLE disponibilidades (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    dia_semana  SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
    hora_inicio TIME NOT NULL,
    hora_fin    TIME NOT NULL,
    CHECK (hora_fin > hora_inicio)
);

CREATE INDEX idx_usuarios_carrera ON usuarios(carrera_id);
CREATE INDEX idx_usuarios_sede ON usuarios(sede_id);
CREATE INDEX idx_grupos_carrera ON grupos_estudio(carrera_id);
CREATE INDEX idx_apuntes_carrera_asignatura ON apuntes(carrera_id, asignatura_id);
CREATE INDEX idx_preguntas_asignatura ON preguntas(asignatura_id);
CREATE INDEX idx_mensajes_grupo ON mensajes_grupo(grupo_id, created_at DESC);
CREATE INDEX idx_disponibilidades_usuario ON disponibilidades(usuario_id);

INSERT INTO sedes (nombre, ciudad) VALUES
    ('Maipú', 'Santiago'),
    ('San Joaquín', 'Santiago'),
    ('Valparaíso', 'Valparaíso'),
    ('Viña del Mar', 'Viña del Mar'),
    ('Concepción', 'Concepción');

INSERT INTO carreras (nombre, codigo) VALUES
    ('Ingeniería en Informática', 'INF'),
    ('Ingeniería en Conectividad y Redes', 'ICR'),
    ('Analista Programador', 'AP');

INSERT INTO habilidades (nombre) VALUES
    ('Java'), ('Python'), ('React'), ('Spring Boot'),
    ('SQL'), ('Git'), ('Docker'), ('Comunicación'),
    ('Liderazgo'), ('Diseño UI/UX');
