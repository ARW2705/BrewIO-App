 // require at least one lower case letter, upper case letter, number, and special character
export const PASSWORD_PATTERN: RegExp = RegExp(
  '(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])(?=.*?[!@#%&\$\^\*])',
  'g'
);
