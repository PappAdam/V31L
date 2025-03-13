describe('Login Page Validation', () => {
  beforeEach(() => {
    cy.visit('http://localhost:4200/login');
    cy.task('seedDatabase');
  });

  it('should display the login form correctly', displayLoginForm);
  it('should validate password', validatePassword);
  it('should validate username', validateUsername);
  it('should enable submit button', enableSubmitButton);
  it('should toggle password', toggleShowPassword);
  it('should switch between login and signup prompts', toggleSignIn);
  it('should attempt to submit the form', sendRequest);

  function displayLoginForm() {
    //Elements should exist
    cy.get('#auth-card').should('exist');
    cy.get('[data-cy="username-input"]').should('exist');
    cy.get('[data-cy="password-input"]').should('exist');
    cy.get('button[data-cy="submit-button"]')
      .contains('Sign In')
      .should('exist');
    cy.get('[data-cy="toggle-signin-button"]').contains(
      "Don't have an account?"
    );
  }

  function validatePassword() {
    // Required validator
    cy.get('[data-cy="password-input"]').click().blur();
    cy.get('[data-cy="password-error"]').contains('Password field is required');

    // MinLength validator
    cy.get('[data-cy="password-input"]').type('short').blur();
    cy.get('[data-cy="password-error"]').contains(
      'Password has to be at least 8 characters long'
    );

    // Custom Password Validator
    cy.get('[data-cy="password-input"]').clear().type('PASSWORD1').blur();
    cy.get('[data-cy="password-error"]').contains(
      'Password must contain at least one lowercase letter'
    );

    // Custom Password Validator
    cy.get('[data-cy="password-input"]').clear().type('password1').blur();
    cy.get('[data-cy="password-error"]').contains(
      'Password must contain at least one uppercase letter'
    );

    // Custom Password Validator
    cy.get('[data-cy="password-input"]').clear().type('Password').blur();
    cy.get('[data-cy="password-error"]').contains(
      'Password must contain at least one number'
    );

    // Mat-error should not exist if valid password is given
    cy.get('[data-cy="password-input"]').clear().type('Password1').blur();
    cy.get('[data-cy="password-error"]').should('not.exist');
  }

  function validateUsername() {
    // Required validator
    cy.get('[data-cy="username-input"]').click().blur();
    cy.get('[data-cy="username-error"]').contains('Username field is required');

    // MinLength validator
    cy.get('[data-cy="username-input"]').type('a').blur();
    cy.get('[data-cy="username-error"]').contains(
      'Username has to be at least 8 characters long'
    );

    // Username Pattern (regEx) Validator
    cy.get('[data-cy="username-input"]').clear().type('aaaaaaa@').blur();
    cy.get('[data-cy="username-error"]').contains(
      'Username can only contain letters, numbers, underscores, and dashes'
    );

    // Mat-error should not exist if valid username is given
    cy.get('[data-cy="username-input"]').clear().type('aaaaaaaa').blur();
    cy.get('[data-cy="username-error"]').should('not.exist');
  }

  function enableSubmitButton() {
    cy.get('[data-cy="submit-button"]').should('be.disabled');

    cy.get('[data-cy="username-input"]').type('validUser');
    cy.get('[data-cy="password-input"]').type('validPass123@_');

    cy.get('[data-cy="submit-button"]').should('not.be.disabled');
  }

  function toggleShowPassword() {
    cy.get('[data-cy="password-input"]').should(
      'have.attr',
      'type',
      'password'
    );

    cy.get('[data-cy="toggle-password-button"]').click();
    cy.get('[data-cy="password-input"]').should('have.attr', 'type', 'text');

    cy.get('[data-cy="toggle-password-button"]').click();
    cy.get('[data-cy="password-input"]').should(
      'have.attr',
      'type',
      'password'
    );
  }

  function toggleSignIn() {
    // Initial state
    cy.get('[data-cy="toggle-signin-button"]').contains(
      "Don't have an account?"
    );
    cy.get('[data-cy="submit-button"]').contains('Sign In');

    // Switching to sign up
    cy.get('[data-cy="toggle-signin-button"]').click();

    cy.get('[data-cy="toggle-signin-button"]').contains('Have an account?');
    cy.get('[data-cy="submit-button"]').contains('Sign Up');

    //Switching back to sign in
    cy.get('[data-cy="toggle-signin-button"]').click();

    cy.get('[data-cy="toggle-signin-button"]').contains(
      "Don't have an account?"
    );
    cy.get('[data-cy="submit-button"]').contains('Sign In');
  }

  function sendRequest() {
    cy.intercept('POST', '/auth/login').as('loginRequest');

    cy.get('[data-cy="username-input"]').type('validUser');
    cy.get('[data-cy="password-input"]').type('validPass123@_');

    cy.get('[data-cy="submit-button"]').should('not.be.disabled');
    cy.get('[data-cy="submit-button"]').click();

    cy.wait('@loginRequest').its('request.body').should('deep.equal', {
      username: 'validUser',
      password: 'validPass123@_',
    });
  }
});
