const React = require('react');

function CarManagement({ cars = [] }) {
  const renderCarTable = () => {
    return React.createElement('table', { className: 'table' },
      React.createElement('thead', null,
        React.createElement('tr', null,
          React.createElement('th', null, 'ID'),
          React.createElement('th', null, 'Marka'),
          React.createElement('th', null, 'Model'),
          React.createElement('th', null, 'Nr Rejestracyjny'),
          React.createElement('th', null, 'Cena/dzień'),
          React.createElement('th', null, 'Dostępność'),
          React.createElement('th', null, 'Akcje')
        )
      ),
      React.createElement('tbody', null,
        cars.length === 0 
          ? React.createElement('tr', null,
              React.createElement('td', { colSpan: '7', style: { textAlign: 'center' } }, 'Brak samochodów')
            )
          : cars.map(car => {
              return React.createElement('tr', { key: car.id },
                React.createElement('td', null, car.id),
                React.createElement('td', null, car.brand),
                React.createElement('td', null, car.model),
                React.createElement('td', null, car.registrationNumber),
                React.createElement('td', null, `${car.dailyRate} zł`),
                React.createElement('td', null, car.available ? 'Dostępny' : 'Niedostępny'),
                React.createElement('td', null,
                  React.createElement('div', { style: { display: 'flex', gap: '5px' } },
                    React.createElement('a', { 
                      href: `/edit-car?id=${car.id}`,
                      className: 'btn btn-primary'
                    }, 'Edytuj'),
                    React.createElement('form', { 
                      action: `/delete-car`,
                      method: 'POST',
                      style: { margin: 0 }
                    },
                      React.createElement('input', { 
                        type: 'hidden',
                        name: 'carId',
                        value: car.id
                      }),
                      React.createElement('button', { 
                        type: 'submit',
                        className: 'btn btn-danger'
                      }, 'Usuń')
                    )
                  )
                )
              );
            })
      )
    );
  };

  const renderCarForm = () => {
    return React.createElement('div', { className: 'card' },
      React.createElement('div', { className: 'card-header' }, 'Dodaj nowy samochód'),
      React.createElement('div', { className: 'card-body' },
        React.createElement('form', { action: '/add-car', method: 'POST' },
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', { htmlFor: 'brand' }, 'Marka:'),
            React.createElement('input', { 
              type: 'text',
              className: 'form-control',
              id: 'brand',
              name: 'brand',
              required: true
            })
          ),
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', { htmlFor: 'model' }, 'Model:'),
            React.createElement('input', { 
              type: 'text',
              className: 'form-control',
              id: 'model',
              name: 'model',
              required: true
            })
          ),
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', { htmlFor: 'registrationNumber' }, 'Nr Rejestracyjny:'),
            React.createElement('input', { 
              type: 'text',
              className: 'form-control',
              id: 'registrationNumber',
              name: 'registrationNumber',
              required: true
            })
          ),
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', { htmlFor: 'dailyRate' }, 'Cena za dzień:'),
            React.createElement('input', { 
              type: 'number',
              step: '0.01',
              className: 'form-control',
              id: 'dailyRate',
              name: 'dailyRate',
              required: true
            })
          ),
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', { htmlFor: 'imageUrl' }, 'URL zdjęcia:'),
            React.createElement('input', { 
              type: 'url',
              className: 'form-control',
              id: 'imageUrl',
              name: 'imageUrl'
            })
          ),
          React.createElement('div', { className: 'form-group' },
            React.createElement('button', { 
              type: 'submit',
              className: 'btn btn-success'
            }, 'Dodaj samochód')
          )
        )
      )
    );
  };

  return React.createElement('div', null,
    React.createElement('h2', null, 'Zarządzanie samochodami'),
    React.createElement('div', { className: 'card' },
      React.createElement('div', { className: 'card-header' }, 'Lista samochodów'),
      React.createElement('div', { className: 'card-body' },
        renderCarTable()
      )
    ),
    renderCarForm()
  );
}

module.exports = { CarManagement }; 