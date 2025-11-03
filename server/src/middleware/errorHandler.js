export const errorHandler = (err, req, res, next) => {
  console.error(err);

  const status = err.status || 500;
  const message = err.message || 'Unexpected server error';

  res.status(status).json({
    status: 'error',
    message,
  });
};
