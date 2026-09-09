const crypto = require("node:crypto");
const env = require("../config/env");
const settingsService = require("../config/settingsService");

let jsonwebtoken = null;
try {
  jsonwebtoken = require("jsonwebtoken");
} catch (error) {
  // Fallback is used only until npm install is available.
}

const base64Url = (input) =>
  Buffer.from(JSON.stringify(input)).toString("base64url");

const signFallback = (payload, expiresIn = "1d") => {
  const header = base64Url({ alg: "HS256", typ: "JWT" });
  const secondsLeft = typeof expiresIn === "number"
    ? expiresIn
    : Math.max(1, Math.round(/(\d+)m/.test(expiresIn) ? Number(/(\d+)m/.exec(expiresIn)[1]) * 60 : 24 * 60 * 60));
  const body = base64Url({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + secondsLeft,
  });
  const signature = crypto
    .createHmac("sha256", env.jwtSecret)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
};

const verifyFallback = (token) => {
  const [header, body, signature] = String(token).split(".");
  const expected = crypto
    .createHmac("sha256", env.jwtSecret)
    .update(`${header}.${body}`)
    .digest("base64url");

  if (!signature || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error("Invalid token");
  }

  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token expired");
  }
  return payload;
};

const signToken = (payload, options = {}) => {
  // Custom override (e.g. short-lived step-up tokens) wins; otherwise the
  // database value is used (e.g. "1d"), with .env JWT_EXPIRES_IN as the
  // fallback. Read at issue time — existing tokens keep their expiry.
  const dynamicExpiry =
    options.expiresIn ||
    settingsService.getCached("jwt.expiresIn") ||
    env.jwtExpiresIn;
  if (jsonwebtoken) {
    return jsonwebtoken.sign(payload, env.jwtSecret, { expiresIn: dynamicExpiry });
  }
  return signFallback(payload, dynamicExpiry);
};

const verifyToken = (token) => {
  if (jsonwebtoken) return jsonwebtoken.verify(token, env.jwtSecret);
  return verifyFallback(token);
};

module.exports = {
  signToken,
  verifyToken,
};
