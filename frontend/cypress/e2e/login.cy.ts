describe('Login Page', () => {
  beforeEach(() => {
    cy.visit('http://localhost:4200/login');
  });

  it('should display the login form correctly', displayLoginForm);
  it('should validate required fields', validateRequiredFields);
  it('should enable submit button', enableSubmitButton);
  it('should show/hide password when toggle button is clicked', togglePassword);
  it('should switch between login and signup prompts', toggleSignIn);
  it('should attempt to submit the form', sendRequest);

  function displayLoginForm() {
    cy.get('#auth-card').should('exist');
    cy.get('input[formControlName="username"]').should('exist');
    cy.get('input[formControlName="password"]').should('exist');
    cy.contains("Don't have an account?").should('exist');
  }

  function validateRequiredFields() {
    cy.get('button[type="submit"]').should('be.disabled');

    cy.get('input[formControlName="username"]').click().blur();
    cy.contains('Username field is required').should('exist');

    cy.get('input[formControlName="password"]').click().blur();
    cy.contains('Password field is required').should('exist');
  }

  function enableSubmitButton() {
    cy.get('button[type="submit"]').should('be.disabled');

    cy.get('input[formControlName="username"]').type('validUser');
    cy.get('input[formControlName="password"]').type('validPass123@_');

    cy.get('button[type="submit"]').should('not.be.disabled');
  }

  function togglePassword() {
    cy.get('input[formControlName="password"]').should(
      'have.attr',
      'type',
      'password'
    );

    cy.get('button[aria-label="Hide password"]').click();
    cy.get('input[formControlName="password"]').should(
      'have.attr',
      'type',
      'text'
    );

    cy.get('button[aria-label="Hide password"]').click();
    cy.get('input[formControlName="password"]').should(
      'have.attr',
      'type',
      'password'
    );
  }

  function toggleSignIn() {
    cy.contains('Sign In').should('exist');
    cy.contains("Don't have an account?").click();

    cy.contains('Have an account?').should('exist');
    cy.contains('Sign Up').should('exist');

    cy.contains('Have an account?').click();
    cy.contains("Don't have an account?").should('exist');
    cy.contains('Sign In').should('exist');
  }

  function sendRequest() {
    cy.intercept('POST', '/auth/login').as('loginRequest');

    cy.get('input[formControlName="username"]').type('validUser');
    cy.get('input[formControlName="password"]').type('validPass123@_');
    cy.get('button[type="submit"]').should('not.be.disabled');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest').its('request.body').should('deep.equal', {
      username: 'validUser',
      password: 'validPass123@_',
    });
  }
});
