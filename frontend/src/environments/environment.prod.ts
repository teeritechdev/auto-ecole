export const environment = {
  production: true,
  // En production, l'app Angular est supposée servie derrière le même
  // reverse-proxy que le backend (ex: nginx proxifiant /api vers Spring Boot).
  // Ajustez vers une URL absolue si le backend est sur un autre domaine/port.
  apiUrl: '/api'
};
