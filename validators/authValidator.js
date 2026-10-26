// Server-side validation for Register and Login forms.
// Each function returns { values, errors }: values are cleaned inputs, errors maps field name -> message.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_BYTES = 72; // bcrypt ignores anything after 72 bytes

// Form fields arrive as strings, but a crafted request could send an array or nothing.
const text = (value) => (typeof value === 'string' ? value.trim() : '');
const raw = (value) => (typeof value === 'string' ? value : ''); // passwords are not trimmed

function validateRegistration(body) {
  const values = {
    fullName: text(body.fullName),
    email: text(body.email).toLowerCase(),
    major: text(body.major),
  };
  const password = raw(body.password);
  const confirmPassword = raw(body.confirmPassword);
  const errors = {};

  if (!values.fullName) errors.fullName = 'Enter your full name.';
  else if (values.fullName.length > 100) errors.fullName = 'Full name must be 100 characters or fewer.';

  if (!values.email) errors.email = 'Enter your email address.';
  else if (values.email.length > 255 || !EMAIL_PATTERN.test(values.email)) {
    errors.email = 'Enter a valid email address, like name@example.com.';
  }

  if (values.major.length > 100) errors.major = 'Major must be 100 characters or fewer.';

  if (!password) errors.password = 'Enter a password.';
  else if (password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  } else if (Buffer.byteLength(password) > PASSWORD_MAX_BYTES) {
    errors.password = 'Password is too long (maximum 72 characters).';
  }

  if (!confirmPassword) errors.confirmPassword = 'Confirm your password.';
  else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';

  return { values, password, errors };
}

function validateLogin(body) {
  const values = { email: text(body.email).toLowerCase() };
  const password = raw(body.password);
  const errors = {};

  if (!values.email) errors.email = 'Enter your email address.';
  if (!password) errors.password = 'Enter your password.';

  return { values, password, errors };
}

// My Account: only name and major can be changed (email is the login).
function validateProfile(body) {
  const values = { fullName: text(body.fullName), major: text(body.major) };
  const errors = {};

  if (!values.fullName) errors.fullName = 'Enter your full name.';
  else if (values.fullName.length > 100) errors.fullName = 'Full name must be 100 characters or fewer.';
  if (values.major.length > 100) errors.major = 'Major must be 100 characters or fewer.';

  return { values, errors };
}

module.exports = { validateRegistration, validateLogin, validateProfile };
