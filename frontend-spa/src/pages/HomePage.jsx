import { Container, Typography, Box, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const { isAuthenticated, login } = useAuth();

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Welcome to Car Rental App
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          Find and rent your perfect car today
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Button 
            variant="contained" 
            color="primary" 
            component={RouterLink} 
            to="/cars" 
            sx={{ mr: 2 }}
          >
            Browse Cars
          </Button>
          
          {!isAuthenticated && (
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={login}
            >
              Login to Make Reservations
            </Button>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default HomePage; 