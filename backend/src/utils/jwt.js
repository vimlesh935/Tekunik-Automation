const crypto = require("node:crypto");
const env = require("../config/env");

let jsonwebtoken = null;
try {
  jsonwebtoken = require("jsonwebtoken");
} catch (error) {
  // Fallback is used only until npm install is available.
}

const base64Url = (input) =>
  Buffer.from(JSON.stringify(input)).toString("base64url");

const signFallback = (payload) => {
  const header = base64Url({ alg: "HS256", typ: "JWT" });
  const body = base64Url({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
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

const signToken = (payload) => {
  if (jsonwebtoken) {
    return jsonwebtoken.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
  }
  return signFallback(payload);
};

const verifyToken = (token) => {
  if (jsonwebtoken) return jsonwebtoken.verify(token, env.jwtSecret);
  return verifyFallback(token);
};

module.exports = {
  signToken,
  verifyToken,
};
