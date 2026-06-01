const parseCookies = (req, res, next) => {
  req.cookies = {};

  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return next();

  cookieHeader.split(";").forEach((cookie) => {
    const [rawKey, ...rawValue] = cookie.trim().split("=");
    if (!rawKey) return;
    req.cookies[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue.join("="));
  });

  next();
};

module.exports = parseCookies;
