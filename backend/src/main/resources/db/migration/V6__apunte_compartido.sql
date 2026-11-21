-- Notificación in-app cuando alguien comparte un apunte por correo.
ALTER TYPE tipo_notificacion ADD VALUE IF NOT EXISTS 'APUNTE_COMPARTIDO';
