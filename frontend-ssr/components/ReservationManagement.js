const React = require('react');

function ReservationManagement({ reservations = [] }) {
  const getStatusBadgeClass = (status) => {
    switch(status?.toUpperCase()) {
      case 'CONFIRMED':
        return 'btn-success';
      case 'PENDING':
        return 'btn-warning';
      case 'CANCELLED':
        return 'btn-danger';
      default:
        return 'btn-secondary';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL');
  };

  const renderReservationTable = () => {
    return React.createElement('table', { className: 'table' },
      React.createElement('thead', null,
        React.createElement('tr', null,
          React.createElement('th', null, 'ID'),
          React.createElement('th', null, 'Użytkownik'),
          React.createElement('th', null, 'Samochód'),
          React.createElement('th', null, 'Od'),
          React.createElement('th', null, 'Do'),
          React.createElement('th', null, 'Kwota'),
          React.createElement('th', null, 'Status'),
          React.createElement('th', null, 'Akcje')
        )
      ),
      React.createElement('tbody', null,
        reservations.length === 0 
          ? React.createElement('tr', null,
              React.createElement('td', { colSpan: '8', style: { textAlign: 'center' } }, 'Brak rezerwacji')
            )
          : reservations.map(reservation => {
              return React.createElement('tr', { key: reservation.id },
                React.createElement('td', null, reservation.id),
                React.createElement('td', null, reservation.userId),
                React.createElement('td', null, reservation.Car ? `${reservation.Car.brand} ${reservation.Car.model}` : 'Brak danych'),
                React.createElement('td', null, formatDate(reservation.startDate)),
                React.createElement('td', null, formatDate(reservation.endDate)),
                React.createElement('td', null, `${reservation.totalPrice} zł`),
                React.createElement('td', null, 
                  React.createElement('span', { 
                    className: `btn btn-sm ${getStatusBadgeClass(reservation.status)}`
                  }, reservation.status)
                ),
                React.createElement('td', null,
                  React.createElement('div', { style: { display: 'flex', gap: '5px' } },
                    React.createElement('form', { 
                      action: `/update-reservation-status`,
                      method: 'POST',
                      style: { margin: 0 }
                    },
                      React.createElement('input', { 
                        type: 'hidden',
                        name: 'reservationId',
                        value: reservation.id
                      }),
                      React.createElement('input', { 
                        type: 'hidden',
                        name: 'status',
                        value: 'CONFIRMED'
                      }),
                      React.createElement('button', { 
                        type: 'submit',
                        className: 'btn btn-success btn-sm',
                        disabled: reservation.status === 'CONFIRMED'
                      }, 'Potwierdź')
                    ),
                    React.createElement('form', { 
                      action: `/update-reservation-status`,
                      method: 'POST',
                      style: { margin: 0 }
                    },
                      React.createElement('input', { 
                        type: 'hidden',
                        name: 'reservationId',
                        value: reservation.id
                      }),
                      React.createElement('input', { 
                        type: 'hidden',
                        name: 'status',
                        value: 'CANCELLED'
                      }),
                      React.createElement('button', { 
                        type: 'submit',
                        className: 'btn btn-danger btn-sm',
                        disabled: reservation.status === 'CANCELLED'
                      }, 'Anuluj')
                    )
                  )
                )
              );
            })
      )
    );
  };

  return React.createElement('div', null,
    React.createElement('h2', null, 'Zarządzanie rezerwacjami'),
    React.createElement('div', { className: 'card' },
      React.createElement('div', { className: 'card-header' }, 'Lista rezerwacji'),
      React.createElement('div', { className: 'card-body' },
        renderReservationTable()
      )
    )
  );
}

module.exports = { ReservationManagement }; 