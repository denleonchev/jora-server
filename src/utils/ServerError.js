class ServerError extends Error {
  constructor(options) {
    super(options.message);
    this.code = options.code;
  }
}

module.exports = ServerError;
