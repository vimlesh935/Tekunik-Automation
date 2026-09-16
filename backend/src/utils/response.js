const { CODE_TO_TRANSLATION_KEY, MESSAGE_TEXT_TO_CODE } = require('./messageCodes');

const success = (res, message, data = {}, statusCode = 200, messageCode = null) => {
  const resolvedMessageCode = messageCode || MESSAGE_TEXT_TO_CODE[message] || null;
  const response = {
    success: true,
    message,
    data,
  };
  // Include messageCode if provided for frontend translation mapping
  if (resolvedMessageCode) {
    response.messageCode = resolvedMessageCode;
    response.translationKey = CODE_TO_TRANSLATION_KEY[resolvedMessageCode] || null;
  }
  return res.status(statusCode).json(response);
};

const failure = (res, message, statusCode = 500, code = 'ERROR', details = null) => {
  const response = {
    success: false,
    message,
    code,
    ...(details ? { details } : {}),
  };
  // Map error codes to translation keys when applicable
  if (code && CODE_TO_TRANSLATION_KEY[code]) {
    response.translationKey = CODE_TO_TRANSLATION_KEY[code];
  }
  return res.status(statusCode).json(response);
};

module.exports = {
  success,
  failure,
};
