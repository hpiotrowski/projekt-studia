import React, { useEffect } from 'react';
import { Container, Typography, Box, Button, Paper, Alert } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import keycloak from '../services/keycloak';

const RegisterPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    
    if (isAuthenticated && !loading) {
      navigate('/');
    }
  }, [isAuthenticated, loading, navigate]);

  const handleRegister = () => {
    
    keycloak.register();
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create an Account
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 4 }}>
          Register to start making car reservations and manage your bookings.
        </Typography>
        
        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleRegister}
            disabled={loading}
            fullWidth
          >
            {loading ? 'Loading...' : 'Register with Keycloak'}
          </Button>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Already have an account?{' '}
            <Button 
              color="primary" 
              onClick={() => navigate('/login')}
              sx={{ textTransform: 'none' }}
            >
              Login here
            </Button>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default RegisterPage; 