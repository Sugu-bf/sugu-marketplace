/**
 * Politique de mot de passe — la même que le backend applique à l'inscription,
 * à la réinitialisation et au changement (8 caractères, une lettre, un chiffre).
 * Le backend reste juge ; ce contrôle évite un aller-retour pour rien.
 */
export const PASSWORD_MIN_LENGTH = 8;

export function passwordPolicyError(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`;
  }
  if (!/\p{L}/u.test(password)) {
    return "Le mot de passe doit contenir au moins une lettre.";
  }
  if (!/\p{N}/u.test(password)) {
    return "Le mot de passe doit contenir au moins un chiffre.";
  }
  return null;
}
