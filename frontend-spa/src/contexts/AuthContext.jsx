import React, { createContext, useState, useEffect, useContext } from 'react';
import { CircularProgress, Box } from '@mui/material';
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
       
        if (keycloak.authenticated !== undefined) {
          setIsAuthenticated(keycloak.authenticated);
          if (keycloak.authenticated) {
            const userProfile = await keycloak.loadUserProfile();
            setUser({
              id: keycloak.subject,
              username: userProfile.username,
              email: userProfile.email,
              firstName: userProfile.firstName,
              lastName: userProfile.lastName,
              roles: keycloak.realmAccess?.roles || []
            });
          }
          setLoading(false);
          return;
        }

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

          
          setInterval(() => {
            keycloak.updateToken(70).catch(() => {
              console.error('Failed to refresh token');
            });
          }, 60000);
        }
      } catch (err) {
        console.error('Keycloak initialization error:', err);
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


  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  
  if (error) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        flexDirection="column"
      >
        <p>Authentication service unavailable</p>
        <p>Error: {error.message}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </Box>
    );
  }

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