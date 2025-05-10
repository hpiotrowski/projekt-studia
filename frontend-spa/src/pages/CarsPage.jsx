import { useState, useEffect } from 'react';
import { 
  Container, Typography, Grid, Card, CardContent, 
  CardMedia, CardActions, Button, Box, CircularProgress 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { carApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const CarsPage = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const response = await carApi.getAllCars();
        setCars(response.data);
      } catch (err) {
        setError('Failed to load cars. Please try again later.');
        console.error('Error fetching cars:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, []);

  const handleReserve = (carId) => {
    if (isAuthenticated) {
      navigate(`/reserve/${carId}`);
    } else {
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error" variant="h6" sx={{ mt: 4 }}>
          {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Available Cars
      </Typography>
      
      <Grid container spacing={3}>
        {cars.map((car) => (
          <Grid item key={car.id} xs={12} sm={6} md={4}>
            <Card>
              <CardMedia
                component="img"
                height="140"
                image={car.imageUrl || 'https://via.placeholder.com/300x200?text=Car+Image'}
                alt={`${car.brand} ${car.model}`}
              />
              <CardContent>
                <Typography gutterBottom variant="h5" component="div">
                  {car.brand} {car.model}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Registration: {car.registrationNumber}
                </Typography>
                <Typography variant="body1" color="primary" sx={{ mt: 1 }}>
                  ${car.dailyRate} / day
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  color="primary"
                  disabled={!car.available}
                  onClick={() => handleReserve(car.id)}
                >
                  {car.available ? 'Reserve Now' : 'Not Available'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {cars.length === 0 && (
        <Typography variant="body1" sx={{ mt: 2 }}>
          No cars available at the moment.
        </Typography>
      )}
    </Container>
  );
};

export default CarsPage; 