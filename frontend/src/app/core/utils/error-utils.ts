/**
 * Extrait le message d'erreur le plus précis possible d'une réponse HTTP en échec :
 * le détail champ par champ d'une erreur de validation (ex. "Le mot de passe est
 * obligatoire") s'il existe, sinon le message métier renvoyé par le serveur (ex.
 * "Identifiant ou mot de passe incorrect"), sinon le message par défaut fourni.
 * Sans ça, toute erreur de validation retombait sur le générique et peu utile
 * "Données fournies invalides", qui ne dit pas à l'utilisateur quoi corriger.
 */
export function extraireMessageErreur(err: any, messageParDefaut: string): string {
  const body = err?.error;
  if (body?.validationErrors && typeof body.validationErrors === 'object') {
    const messages = Object.values(body.validationErrors).filter(m => !!m);
    if (messages.length > 0) {
      return messages.join(' ');
    }
  }
  if (typeof body?.message === 'string' && body.message.length > 0) {
    return body.message;
  }
  return messageParDefaut;
}
