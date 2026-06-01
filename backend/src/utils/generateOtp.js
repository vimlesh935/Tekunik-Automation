const crypto = require("node:crypto");

const OTP_TTL_MINUTES = 5;

const generateOtp = () => String(crypto.randomInt(100000, 1000000));

const hashOtp = (otp) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.createHash("sha256").update(`${salt}:${otp}`).digest("hex");
  return `sha256:${salt}:${hash}`;
};

const verifyOtpHash = (otp, savedOtp) => {
  if (!savedOtp) return false;

  const parts = String(savedOtp).split(":");
  if (parts.length !== 3 || parts[0] !== "sha256") {
    return String(savedOtp) === String(otp);
  }

  const [, salt, savedHash] = parts;
  const inputHash = crypto.createHash("sha256").update(`${salt}:${otp}`).digest("hex");

  return crypto.timingSafeEqual(Buffer.from(savedHash), Buffer.from(inputHash));
};

const getOtpExpiry = () => new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

module.exports = {
  OTP_TTL_MINUTES,
  generateOtp,
  hashOtp,
  verifyOtpHash,
  getOtpExpiry,
};
