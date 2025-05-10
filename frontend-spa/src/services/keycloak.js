import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url: window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'http://keycloak:8080',
  realm: 'car-rental',
  clientId: 'frontend-spa'
};

const keycloak = new Keycloak(keycloakConfig);

export default keycloak; 