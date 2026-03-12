const errorHandler = (err, req, res, next) => {
  const status = Number(err.statusCode) || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    message,
  });
};

export default errorHandler;
