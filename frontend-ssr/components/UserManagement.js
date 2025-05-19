const React = require('react');

function UserManagement({ userData = [] }) {
  
  const renderUserTable = () => {
    return React.createElement('table', { className: 'table' },
      React.createElement('thead', null,
        React.createElement('tr', null,
          React.createElement('th', null, 'ID'),
          React.createElement('th', null, 'Nazwa użytkownika'),
          React.createElement('th', null, 'Email'),
          React.createElement('th', null, 'Imię'),
          React.createElement('th', null, 'Nazwisko'),
          React.createElement('th', null, 'Role'),
          React.createElement('th', null, 'Akcje')
        )
      ),
      React.createElement('tbody', null,
        userData.length === 0 
          ? React.createElement('tr', null,
              React.createElement('td', { colSpan: '7', style: { textAlign: 'center' } }, 'Brak danych o użytkownikach')
            )
          : userData.map(user => {
              return React.createElement('tr', { key: user.id },
                React.createElement('td', null, user.id),
                React.createElement('td', null, user.username),
                React.createElement('td', null, user.email),
                React.createElement('td', null, user.firstName || '-'),
                React.createElement('td', null, user.lastName || '-'),
                React.createElement('td', null, 
                  user.roles && user.roles.length > 0 
                    ? user.roles.join(', ') 
                    : '-'
                ),
                React.createElement('td', null,
                  React.createElement('div', { style: { display: 'flex', gap: '5px' } },
                    React.createElement('a', { 
                      href: `/edit-user?id=${user.id}`,
                      className: 'btn btn-primary btn-sm'
                    }, 'Edytuj'),
                    React.createElement('form', { 
                      action: `/reset-password`,
                      method: 'POST',
                      style: { margin: 0 }
                    },
                      React.createElement('input', { 
                        type: 'hidden',
                        name: 'userId',
                        value: user.id
                      }),
                      React.createElement('button', { 
                        type: 'submit',
                        className: 'btn btn-warning btn-sm'
                      }, 'Reset hasła')
                    )
                  )
                )
              );
            })
      )
    );
  };

  return React.createElement('div', null,
    React.createElement('h2', null, 'Zarządzanie użytkownikami'),
    React.createElement('div', { className: 'card' },
      React.createElement('div', { className: 'card-header' }, 'Lista użytkowników'),
      React.createElement('div', { className: 'card-body' },
        React.createElement('p', null, 
          'Zarządzanie użytkownikami dostępne przez panel Keycloak: ',
          React.createElement('a', 
            { 
              href: 'http://localhost:8080/admin/master/console/',
              target: '_blank',
              className: 'btn btn-primary'
            }, 
            'Otwórz panel Keycloak'
          )
        ),
        renderUserTable()
      )
    )
  );
}

module.exports = { UserManagement }; 