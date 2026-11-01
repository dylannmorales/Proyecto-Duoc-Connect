-- Notificación in-app cuando un estudiante registrado es invitado a un grupo por correo
ALTER TYPE tipo_notificacion ADD VALUE IF NOT EXISTS 'INVITACION_GRUPO';
