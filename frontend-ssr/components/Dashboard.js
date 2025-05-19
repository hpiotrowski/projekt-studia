const React = require('react');
const { CarManagement } = require('./CarManagement');
const { ReservationManagement } = require('./ReservationManagement');
const { UserManagement } = require('./UserManagement');

function Dashboard({ user, activeTab = 'cars', cars = [], reservations = [], userData = [] }) {
  const renderHeader = () => {
    return React.createElement('header', null,
      React.createElement('div', { className: 'navbar' },
        React.createElement('a', { href: '/', className: 'navbar-brand' }, 'Car Rental Admin'),
        React.createElement('ul', { className: 'navbar-nav' },
          React.createElement('li', { className: 'nav-item' },
            React.createElement('span', null, `Zalogowano jako: ${user.preferred_username}`)
          ),
          React.createElement('li', { className: 'nav-item' },
            React.createElement('a', { 
              href: '/keycloak-logout',
              className: 'btn btn-danger btn-sm',
              style: {
                backgroundColor: 'transparent',
                border: 'none',
                color: 'white',
                textDecoration: 'none',
                cursor: 'pointer',
                padding: '0.5rem'
              }
            }, 'Wyloguj')
          )
        )
      )
    );
  };

  const renderTabs = () => {
    return React.createElement('div', { className: 'tabs' },
      React.createElement('a', { 
        className: `tab ${activeTab === 'cars' ? 'active' : ''}`,
        href: '/?tab=cars'
      }, 'Samochody'),
      React.createElement('a', { 
        className: `tab ${activeTab === 'reservations' ? 'active' : ''}`,
        href: '/?tab=reservations'
      }, 'Rezerwacje'),
      React.createElement('a', { 
        className: `tab ${activeTab === 'users' ? 'active' : ''}`,
        href: '/?tab=users'
      }, 'Użytkownicy')
    );
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'cars':
        return React.createElement(CarManagement, { cars });
      case 'reservations':
        return React.createElement(ReservationManagement, { reservations });
      case 'users':
        return React.createElement(UserManagement, { userData });
      default:
        return React.createElement('div', null, 'Wybierz zakładkę');
    }
  };

  return React.createElement('div', null,
    renderHeader(),
    React.createElement('div', { className: 'container' },
      renderTabs(),
      renderContent()
    )
  );
}

module.exports = { Dashboard }; 