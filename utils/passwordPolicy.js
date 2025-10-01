const bcrypt = require('bcryptjs');

class PasswordPolicy {
  constructor() {
    this.minLength = parseInt(process.env.PASSWORD_MIN_LENGTH) || 8;
    this.maxLength = parseInt(process.env.PASSWORD_MAX_LENGTH) || 128;
    this.requireUppercase = process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false';
    this.requireLowercase = process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false';
    this.requireNumbers = process.env.PASSWORD_REQUIRE_NUMBERS !== 'false';
    this.requireSpecialChars = process.env.PASSWORD_REQUIRE_SPECIAL !== 'false';
    this.saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
  }

  validate(password) {
    const errors = [];

    if (!password) {
      errors.push('Password is required');
      return { valid: false, errors };
    }

    if (password.length < this.minLength) {
      errors.push(`Password must be at least ${this.minLength} characters long`);
    }

    if (password.length > this.maxLength) {
      errors.push(`Password must not exceed ${this.maxLength} characters`);
    }

    if (this.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (this.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (this.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (this.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)');
    }

    // Check for common weak patterns
    const weakPatterns = [
      /(.)\1{2,}/, // Three or more consecutive identical characters
      /123|234|345|456|567|678|789|890/, // Sequential numbers
      /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i, // Sequential letters
      /password|pass|admin|user|login|qwerty|asdf|zxcv/i // Common weak words
    ];

    for (const pattern of weakPatterns) {
      if (pattern.test(password)) {
        errors.push('Password contains weak patterns and is too predictable');
        break;
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async hash(password) {
    const validation = this.validate(password);
    if (!validation.valid) {
      throw new Error(`Password validation failed: ${validation.errors.join(', ')}`);
    }

    return await bcrypt.hash(password, this.saltRounds);
  }

  async compare(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  generateStrongPassword(length = 12) {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let password = '';

    // Ensure at least one character from each required category
    if (this.requireUppercase) password += uppercase[Math.floor(Math.random() * uppercase.length)];
    if (this.requireLowercase) password += lowercase[Math.floor(Math.random() * lowercase.length)];
    if (this.requireNumbers) password += numbers[Math.floor(Math.random() * numbers.length)];
    if (this.requireSpecialChars) password += specialChars[Math.floor(Math.random() * specialChars.length)];

    // Fill the rest randomly
    const allChars = uppercase + lowercase + numbers + specialChars;
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  getPolicy() {
    return {
      minLength: this.minLength,
      maxLength: this.maxLength,
      requireUppercase: this.requireUppercase,
      requireLowercase: this.requireLowercase,
      requireNumbers: this.requireNumbers,
      requireSpecialChars: this.requireSpecialChars
    };
  }

  getPolicyDescription() {
    const requirements = [];

    requirements.push(`Must be between ${this.minLength} and ${this.maxLength} characters long`);

    if (this.requireUppercase) requirements.push('Must contain at least one uppercase letter (A-Z)');
    if (this.requireLowercase) requirements.push('Must contain at least one lowercase letter (a-z)');
    if (this.requireNumbers) requirements.push('Must contain at least one number (0-9)');
    if (this.requireSpecialChars) requirements.push('Must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)');

    requirements.push('Must not contain common weak patterns');
    requirements.push('Must not be a commonly used password');

    return requirements;
  }
}

module.exports = new PasswordPolicy();