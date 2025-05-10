import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Box, TextField, Button, 
  Paper, Grid, CircularProgress, Alert 
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { carApi, reservationApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ReservationPage = () => {
  const { carId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000)); // tomorrow
  const [totalCost, setTotalCost] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    const fetchCar = async () => {
      try {
        const response = await carApi.getCarById(carId);
        setCar(response.data);
      } catch (err) {
        setError('Failed to load car details. Please try again later.');
        console.error('Error fetching car:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCar();
  }, [carId]);
  
  useEffect(() => {
    if (car && startDate && endDate) {
      const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const cost = days * parseFloat(car.dailyRate);
      setTotalCost(cost > 0 ? cost : 0);
    }
  }, [car, startDate, endDate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!car || !startDate || !endDate) return;
    
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    if (days <= 0) {
      setError('End date must be after start date');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      await reservationApi.createReservation({
        carId: car.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalPrice: totalCost
      });
      
      navigate('/reservations', { 
        state: { success: 'Reservation created successfully!' } 
      });
    } catch (err) {
      setError('Failed to create reservation. Please try again.');
      console.error('Error creating reservation:', err);
    } finally {
      setSubmitting(false);
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
        <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate(-1)} 
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Container>
    );
  }
  
  if (!car) {
    return (
      <Container>
        <Alert severity="warning" sx={{ mt: 4 }}>Car not found</Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/cars')} 
          sx={{ mt: 2 }}
        >
          Browse Cars
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Reserve {car.brand} {car.model}
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="body1">
              <strong>Registration:</strong> {car.registrationNumber}
            </Typography>
            <Typography variant="body1">
              <strong>Daily Rate:</strong> ${car.dailyRate}
            </Typography>
          </Grid>
        </Grid>
        
        <form onSubmit={handleSubmit}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                  disablePast
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={setEndDate}
                  disablePast
                  minDate={startDate}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
          
          <Box sx={{ mt: 4, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="h6">
              Total Cost: ${totalCost.toFixed(2)}
            </Typography>
          </Box>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button 
              variant="outlined" 
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={submitting}
            >
              {submitting ? 'Processing...' : 'Confirm Reservation'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default ReservationPage; 