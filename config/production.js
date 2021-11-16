const config = {
  redis: {
    connection: process.env.REDIS_URL,
    options: {
      tls: {
        rejectUnauthorized: false
      }
    }
  }
};

module.exports = config;
