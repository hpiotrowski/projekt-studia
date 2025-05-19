module.exports = {
    port: process.env.PORT || 5002,
    keycloak: {
        url: process.env.KEYCLOAK_URL || 'http://keycloak:8080',
        realm: 'car-rental',
        clientId: 'b2b-client',
        clientSecret: process.env.CLIENT_SECRET || 'Asbcmz8DreijP9iWzIvoXu3P0wehl4Wc',
    },
    resourceServer: {
        url: process.env.RESOURCE_SERVER_URL || 'http://resource-server:5001'
    }
}; 