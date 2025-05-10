import { useEffect } from 'react';
import { Container, Typography, Box, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const { isAuthenticated, loading, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to home if already authenticated
    if (isAuthenticated && !loading) {
      navigate('/');
    }
  }, [isAuthenticated, loading, navigate]);

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Login to Car Rental App
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 4 }}>
          Please login to make reservations and manage your account.
        </Typography>
        
        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={login}
            disabled={loading}
            fullWidth
          >
            {loading ? 'Loading...' : 'Login with Keycloak'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage; 