const success = (res, message, data = {}, statusCode = 200) =>
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });

const failure = (res, message, statusCode = 500, code = "ERROR", details = null) =>
  res.status(statusCode).json({
    success: false,
    message,
    code,
    ...(details ? { details } : {}),
  });

module.exports = {
  success,
  failure,
};
