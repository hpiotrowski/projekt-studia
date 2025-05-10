import { Container, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ mt: 8, textAlign: 'center' }}>
      <Typography variant="h3" component="h1" color="error" gutterBottom>
        Access Denied
      </Typography>
      
      <Typography variant="h5" component="h2" gutterBottom>
        You don't have permission to access this page
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 4 }}>
        Please contact an administrator if you believe this is an error.
      </Typography>
      
      <Box sx={{ mt: 4 }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate('/')}
          sx={{ mr: 2 }}
        >
          Go to Home
        </Button>
      </Box>
    </Container>
  );
};

export default UnauthorizedPage; 