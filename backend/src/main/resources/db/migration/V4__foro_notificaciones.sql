-- Sprint 7: notificación cuando alguien responde una pregunta del foro
ALTER TYPE tipo_notificacion ADD VALUE IF NOT EXISTS 'RESPUESTA_FORO';
