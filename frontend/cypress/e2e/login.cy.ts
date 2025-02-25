describe('Login Page', () => {
  beforeEach(() => {
    cy.visit('http://localhost:4200/login');
  });

  it('should display the login form correctly', displayLoginForm);
  it('should validate password', validatePassword);
  it('should validate username', validateUsername);
  it('should enable submit button', enableSubmitButton);
  it(
    'should show/hide password when toggle button is clicked',
    toggleShowPassword
  );
  it('should switch between login and signup prompts', toggleSignIn);
  it('should attempt to submit the form', sendRequest);

  function displayLoginForm() {
    //Elements should exist
    cy.get('#auth-card').should('exist');
    cy.get('input[formControlName="username"]').should('exist');
    cy.get('input[formControlName="password"]').should('exist');
    cy.get('button[type=submit]').contains('Sign In').should('exist');
    cy.contains("Don't have an account?").should('exist');
  }

  function validatePassword() {
    // Required validator
    cy.get('input[formControlName="password"]').click().blur();
    cy.contains('Password field is required').should('exist');

    // Error shows up in the mat-error of the input
    cy.get('input[formControlName="password"]')
      .parents('mat-form-field')
      .find('mat-error')
      .should('exist');

    // MinLength validator
    cy.get('input[formControlName="password"]').type('short').blur();
    cy.contains('Password has to be at least 8 characters long').should(
      'exist'
    );

    // Custom Password Validator
    cy.get('input[formControlName="password"]')
      .clear()
      .type('PASSWORD1')
      .blur();
    cy.contains('Password must contain at least one lowercase letter').should(
      'exist'
    );

    // Custom Password Validator
    cy.get('input[formControlName="password"]')
      .clear()
      .type('password1')
      .blur();
    cy.contains('Password must contain at least one uppercase letter').should(
      'exist'
    );

    // Custom Password Validator
    cy.get('input[formControlName="password"]').clear().type('Password').blur();
    cy.contains('Password must contain at least one number').should('exist');

    // Mat-error should not exist if valid password is given
    cy.get('input[formControlName="password"]')
      .clear()
      .type('Password1')
      .blur();
    cy.get('input[formControlName="password"]')
      .parents('mat-form-field')
      .find('mat-error')
      .should('not.exist');
  }

  function validateUsername() {
    // Required validator
    cy.get('input[formControlName="username"]').click().blur();
    cy.contains('Username field is required');

    // Error shows up in the mat-error of the input
    cy.get('input[formControlName="username"]')
      .parents('mat-form-field')
      .find('mat-error')
      .should('exist');

    // MinLength validator
    cy.get('input[formControlName="username"]').type('a').blur();
    cy.contains('Username has to be at least 8 characters long').should(
      'exist'
    );

    // Username Pattern (regEx) Validator
    cy.get('input[formControlName="username"]').clear().type('aaaaaaa@').blur();
    cy.contains(
      'Username can only contain letters, numbers, underscores, and dashes'
    ).should('exist');

    // Mat-error should not exist if valid username is given
    cy.get('input[formControlName="username"]').clear().type('aaaaaaaa').blur();
    cy.get('input[formControlName="username"]')
      .parents('mat-form-field')
      .find('mat-error')
      .should('not.exist');
  }

  function enableSubmitButton() {
    cy.get('button[type="submit"]').should('be.disabled');

    cy.get('input[formControlName="username"]').type('validUser');
    cy.get('input[formControlName="password"]').type('validPass123@_');

    cy.get('button[type="submit"]').should('not.be.disabled');
  }

  function toggleShowPassword() {
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
    cy.contains("Don't have an account?").should('exist');
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
