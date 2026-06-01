const { query } = require("../config/db");
const AppError = require("../utils/appError");
const {
  OTP_TTL_MINUTES,
  generateOtp,
  getOtpExpiry,
  hashOtp,
  verifyOtpHash,
} = require("../utils/generateOtp");

const SEND_COOLDOWN_SECONDS = 60;
const OTP_WINDOW_MINUTES = 15;
const MAX_OTP_REQUESTS = 5;
const MAX_OTP_ATTEMPTS = 5;

const parsePayload = (payloadJson) => {
  if (!payloadJson) return {};

  try {
    return JSON.parse(payloadJson);
  } catch (error) {
    console.warn("[otpService] Failed to parse OTP payload JSON:", error.message);
    return {};
  }
};

const cleanupExpiredSessions = async () => {
  const staleBefore = new Date(Date.now() - OTP_WINDOW_MINUTES * 60 * 1000);

  await query(
    `DELETE FROM email_otps
     WHERE expires_at < ? AND window_start < ?`,
    [new Date(), staleBefore]
  );
};

const getOtpSession = async (email) => {
  const rows = await query(
    `SELECT email,
            purpose,
            otp_hash,
            payload_json,
            attempts,
            expires_at,
            last_sent_at,
            request_count,
            window_start
     FROM email_otps
     WHERE email = ?
     LIMIT 1`,
    [email]
  );

  return rows[0] || null;
};

const assertCanSendOtp = (email, existingSession) => {
  if (!existingSession) return;

  const currentTime = Date.now();
  const lastSentAt = existingSession.last_sent_at
    ? new Date(existingSession.last_sent_at).getTime()
    : 0;
  const windowStart = existingSession.window_start
    ? new Date(existingSession.window_start).getTime()
    : currentTime;
  const insideWindow = currentTime - windowStart < OTP_WINDOW_MINUTES * 60 * 1000;

  if (lastSentAt && currentTime - lastSentAt < SEND_COOLDOWN_SECONDS * 1000) {
    const waitSeconds = Math.ceil(
      (SEND_COOLDOWN_SECONDS * 1000 - (currentTime - lastSentAt)) / 1000
    );

    console.warn(`[otpService] OTP cooldown blocked for ${email}. Wait ${waitSeconds}s.`);
    throw new AppError(
      `Please wait ${waitSeconds} seconds before requesting another OTP`,
      429,
      "OTP_COOLDOWN"
    );
  }

  if (insideWindow && Number(existingSession.request_count || 0) >= MAX_OTP_REQUESTS) {
    console.warn(`[otpService] OTP request limit blocked for ${email}.`);
    throw new AppError("Too many OTP requests. Please try again later.", 429, "OTP_RATE_LIMITED");
  }
};

const createOtpSession = async ({ email, payload = {}, purpose = "registration" }) => {
  await cleanupExpiredSessions();

  const existingSession = await getOtpSession(email);
  assertCanSendOtp(email, existingSession);

  const currentTime = Date.now();
  const existingWindowStart = existingSession?.window_start
    ? new Date(existingSession.window_start).getTime()
    : 0;
  const insideWindow =
    existingWindowStart && currentTime - existingWindowStart < OTP_WINDOW_MINUTES * 60 * 1000;
  const otp = generateOtp();
  const now = new Date();
  const expiresAt = getOtpExpiry();
  const requestCount = insideWindow ? Number(existingSession.request_count || 0) + 1 : 1;
  const windowStart = insideWindow ? existingSession.window_start : now;

  await query(
    `INSERT INTO email_otps (
       email,
       purpose,
       otp_hash,
       payload_json,
       attempts,
       expires_at,
       last_sent_at,
       request_count,
       window_start
     )
     VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       purpose = VALUES(purpose),
       otp_hash = VALUES(otp_hash),
       payload_json = VALUES(payload_json),
       attempts = 0,
       expires_at = VALUES(expires_at),
       last_sent_at = VALUES(last_sent_at),
       request_count = VALUES(request_count),
       window_start = VALUES(window_start),
       updated_at = CURRENT_TIMESTAMP`,
    [
      email,
      purpose,
      hashOtp(otp),
      JSON.stringify(payload),
      expiresAt,
      now,
      requestCount,
      windowStart,
    ]
  );

  console.log("[otpService] OTP saved to MySQL:", {
    email,
    purpose,
    expiresInMinutes: OTP_TTL_MINUTES,
    requestCount,
  });

  return {
    otp,
    expiresAt,
    expiresInMinutes: OTP_TTL_MINUTES,
  };
};

const verifyOtpSession = async (email, otp) => {
  await cleanupExpiredSessions();

  const session = await getOtpSession(email);
  if (!session) {
    console.warn(`[otpService] No OTP session found for ${email}`);
    throw new AppError("Invalid OTP", 401, "INVALID_OTP");
  }

  if (new Date(session.expires_at).getTime() < Date.now()) {
    await query("DELETE FROM email_otps WHERE email = ?", [email]);
    console.warn(`[otpService] OTP expired for ${email}`);
    throw new AppError("OTP Expired", 401, "OTP_EXPIRED");
  }

  if (Number(session.attempts || 0) >= MAX_OTP_ATTEMPTS) {
    await query("DELETE FROM email_otps WHERE email = ?", [email]);
    console.warn(`[otpService] Max OTP attempts exceeded for ${email}`);
    throw new AppError("Invalid OTP", 401, "INVALID_OTP");
  }

  if (!verifyOtpHash(otp, session.otp_hash)) {
    await query("UPDATE email_otps SET attempts = attempts + 1 WHERE email = ?", [email]);
    console.warn(`[otpService] Invalid OTP for ${email}. Attempt ${Number(session.attempts || 0) + 1}.`);
    throw new AppError("Invalid OTP", 401, "INVALID_OTP");
  }

  await query("DELETE FROM email_otps WHERE email = ?", [email]);
  console.log(`[otpService] OTP verified and cleared for ${email}`);

  return {
    email,
    purpose: session.purpose,
    payload: parsePayload(session.payload_json),
  };
};

module.exports = {
  createOtpSession,
  verifyOtpSession,
};
