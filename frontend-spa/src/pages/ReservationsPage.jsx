import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Container, Typography, Box, CircularProgress, Alert,
  Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Chip
} from '@mui/material';
import { reservationApi } from '../services/api';

const getStatusColor = (status) => {
  switch (status) {
    case 'CONFIRMED': return 'success';
    case 'PENDING': return 'warning';
    case 'CANCELLED': return 'error';
    default: return 'default';
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

const ReservationsPage = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.success) {
      setSuccess(location.state.success);
      // Clear the message from location state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await reservationApi.getMyReservations();
        setReservations(response.data);
      } catch (err) {
        setError('Failed to load reservations. Please try again later.');
        console.error('Error fetching reservations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  const handleCancelReservation = async (id) => {
    try {
      await reservationApi.deleteReservation(id);
      setReservations(reservations.filter(res => res.id !== id));
      setSuccess('Reservation cancelled successfully.');
    } catch (err) {
      setError('Failed to cancel reservation. Please try again.');
      console.error('Error cancelling reservation:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Reservations
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {reservations.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Car</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Total Price</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reservations.map((reservation) => (
                <TableRow key={reservation.id}>
                  <TableCell>
                    {reservation.Car?.brand} {reservation.Car?.model}
                  </TableCell>
                  <TableCell>{formatDate(reservation.startDate)}</TableCell>
                  <TableCell>{formatDate(reservation.endDate)}</TableCell>
                  <TableCell>${Number(reservation.totalPrice).toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={reservation.status} 
                      color={getStatusColor(reservation.status)} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      disabled={reservation.status === 'CANCELLED'}
                      onClick={() => handleCancelReservation(reservation.id)}
                    >
                      Cancel
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            You don't have any reservations yet.
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default ReservationsPage; 