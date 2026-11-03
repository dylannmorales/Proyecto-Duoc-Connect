export function buildGmailShareUrl(subject: string, body: string) {
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    su: subject,
    body,
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

export function shareGroupInvitation(grupoNombre: string, codigo: string) {
  const subject = `Invitación al grupo ${grupoNombre} - Duoc Connect`;
  const body = [
    '¡Hola!',
    '',
    `Te invito a unirte al grupo de estudio "${grupoNombre}" en Duoc Connect.`,
    '',
    `Código de invitación: ${codigo}`,
    '',
    'Ingresa a la plataforma, ve a Grupos y usa "Unirse con código".',
  ].join('\n');

  window.open(buildGmailShareUrl(subject, body), '_blank', 'noopener,noreferrer');
}
