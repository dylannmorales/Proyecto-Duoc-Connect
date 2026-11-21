export const CORREO_INSTITUCIONAL = /^[^@\s]+@duocuc\.cl$/i;

export function sonCorreosValidos(correos: string[]) {
  return correos.every((c) => CORREO_INSTITUCIONAL.test(c));
}
