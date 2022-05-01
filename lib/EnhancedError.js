class EnhancedError extends Error {
  constructor (message, isUserError) {
    super(message);
    this.name = this.constructor.name;
    this.isUserError = isUserError;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = EnhancedError;
