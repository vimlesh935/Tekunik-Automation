/* Comprehensive OTP test for Change Password (live server :8787). */
const BASE = "http://localhost:8787";
const { query } = require("./src/config/db");
const { verifyOtpHash } = require("./src/utils/generateOtp");

const api = async (method, path, { token, body } = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
};

const findOtpFromDb = async (email) => {
  const rows = await query("SELECT otp_hash FROM email_otps WHERE email = ? ORDER BY created_at DESC LIMIT 1", [email]);
  if (!rows.length) return null;
  const saved = rows[0].otp_hash;
  for (let i = 100000; i <= 999999; i++) {
    if (verifyOtpHash(String(i), saved)) return String(i);
  }
  return null;
};

const step = (label, cond) => {
  console.log(cond ? "  PASS " + label : "  FAIL " + label);
  return cond;
};

(async () => {
  const ts = Date.now();
  const email = "otp." + ts + "@teknode.test";
  const oldPassword = "Passw0rd!123";
  const newPassword = "OtpNewPass!999";

  const reg = await api("POST", "/api/auth/register", { body: {
    email, password: oldPassword, username: "otp_" + ts, first_name: "Otp", last_name: "Test",
    phone: "9999999971", age: 30, address: "1 O", city: "Indore", pincode: "452001",
  } });
  step("register", reg.status === 201);

  const login = await api("POST", "/api/auth/login", { body: { email, password: oldPassword } });
  let token = login.json?.data?.token;
  step("login", login.status === 200 && Boolean(token));

  // ── Email OTP Method ──

  // 1. OTP successfully sent
  const send = await api("POST", "/api/user/change-password/send-otp", { token, body: {} });
  step("OTP sent (200)", send.status === 200);

  // 2. Resend cooldown (immediately)
  const resend = await api("POST", "/api/user/change-password/send-otp", { token, body: {} });
  step("resend cooldown (429)", resend.status === 429 && resend.json?.code === "OTP_COOLDOWN");

  // 3. Wrong OTP
  const wrongOtp = await api("POST", "/api/user/change-password/verify-otp", { token, body: { otp: "000000" } });
  step("wrong OTP (401)", wrongOtp.status === 401 && wrongOtp.json?.code === "INVALID_OTP");

  // 4. Extract real OTP from DB and verify
  const realOtp = await findOtpFromDb(email);
  step("OTP extracted from DB", realOtp !== null);

  const verify = await api("POST", "/api/user/change-password/verify-otp", { token, body: { otp: realOtp } });
  step("OTP verified (200)", verify.status === 200 && Boolean(verify.json?.data?.stepUpToken));
  const stepUpToken = verify.json?.data?.stepUpToken;

  // 5. Successful OTP password change
  const reset = await api("POST", "/api/user/change-password/reset", {
    token, body: { stepUpToken, newPassword, confirmPassword: newPassword },
  });
  step("password changed via OTP (200)", reset.status === 200 && Boolean(reset.json?.data?.token));
  const newToken = reset.json?.data?.token;