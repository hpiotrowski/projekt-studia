import { createContext, useState, useEffect, useContext } from 'react';
import keycloak from '../services/keycloak';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initKeycloak = async () => {
      try {
        const authenticated = await keycloak.init({
          onLoad: 'check-sso',
          silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
          pkceMethod: 'S256'
        });

        setIsAuthenticated(authenticated);

        if (authenticated) {
          const userProfile = await keycloak.loadUserProfile();
          setUser({
            id: keycloak.subject,
            username: userProfile.username,
            email: userProfile.email,
            firstName: userProfile.firstName,
            lastName: userProfile.lastName,
            roles: keycloak.realmAccess?.roles || []
          });

          // Set up token refresh
          setInterval(() => {
            keycloak.updateToken(70).catch(() => {
              console.error('Failed to refresh token');
            });
          }, 60000);
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    initKeycloak();
  }, []);

  const login = () => keycloak.login();
  const logout = () => keycloak.logout({ redirectUri: window.location.origin });
  const hasRole = (role) => user?.roles.includes(role) || false;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        error,
        login,
        logout,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 