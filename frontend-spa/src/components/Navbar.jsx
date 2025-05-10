import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, login, logout } = useAuth();

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Car Rental App
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button color="inherit" component={RouterLink} to="/">
            Home
          </Button>
          <Button color="inherit" component={RouterLink} to="/cars">
            Cars
          </Button>
          {isAuthenticated ? (
            <>
              <Button color="inherit" component={RouterLink} to="/reservations">
                My Reservations
              </Button>
              <Button color="inherit" onClick={logout}>
                Logout ({user?.username})
              </Button>
            </>
          ) : (
            <Button color="inherit" onClick={login}>
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 