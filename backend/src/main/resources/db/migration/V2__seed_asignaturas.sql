-- Asignaturas de ejemplo por carrera (catálogo académico demo)
INSERT INTO asignaturas (nombre, codigo, carrera_id)
SELECT v.nombre, v.codigo, c.id
FROM (VALUES
    ('INF', 'Programación Básica', 'PROG101'),
    ('INF', 'Bases de Datos', 'BD201'),
    ('INF', 'Desarrollo Web', 'WEB301'),
    ('INF', 'Ingeniería de Software', 'ISW401'),
    ('INF', 'Inteligencia Artificial', 'IA501'),
    ('ICR', 'Redes de Computadores', 'RED201'),
    ('ICR', 'Protocolos de Comunicación', 'PCC301'),
    ('ICR', 'Administración de Servidores', 'ADS401'),
    ('ICR', 'Seguridad en Redes', 'SEG401'),
    ('AP', 'Algoritmos y Estructuras de Datos', 'AED101'),
    ('AP', 'Programación Orientada a Objetos', 'POO201'),
    ('AP', 'Desarrollo de Aplicaciones', 'DEV301'),
    ('AP', 'Base de Datos Aplicada', 'BDA301')
) AS v(carrera_codigo, nombre, codigo)
JOIN carreras c ON c.codigo = v.carrera_codigo
WHERE NOT EXISTS (
    SELECT 1
    FROM asignaturas a
    WHERE a.codigo = v.codigo
      AND a.carrera_id = c.id
);
