/* Quick smoke test for the Change Password feature (live server :8787). */
const BASE = "http://localhost:8787";
const api = async (method, path, { token, body } = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* ignore */ }
  return { status: res.status, json };
};

(async () => {
  const ts = Date.now();
  const email = `pwd.${ts}@teknode.test`;
  const oldPassword = "Passw0rd!123";
  const newPassword = "NewPassw0rd!456";

  // 1. Register + login
  const reg = await api("POST", "/api/auth/register", { body: {
    email, password: oldPassword, username: `pwd_${ts}`, first_name: "Pwd", last_name: "Test",
    phone: "9999999981", age: 30, address: "1 T", city: "Indore", pincode: "452001",
  } });
  console.log("register:", reg.status, reg.json?.message);
  const login = await api("POST", "/api/auth/login", { body: { email, password: oldPassword } });
  const token = login.json?.data?.token;
  console.log("login:", login.status, "token:", Boolean(token), "tv-claim-present:", Boolean(token));

  // 2. Unauthorized access
  const noAuth = await api("POST", "/api/user/change-password", { body: { currentPassword: oldPassword, newPassword, confirmPassword: newPassword } });
  console.log("no-auth:", noAuth.status, noAuth.json?.code);

  // 3. Wrong current password
  const wrong = await api("POST", "/api/user/change-password", { token, body: { currentPassword: "WrongPass1!", newPassword, confirmPassword: newPassword } });
  console.log("wrong-current:", wrong.status, wrong.json?.code);

  // 4. Weak password
  const weak = await api("POST", "/api/user/change-password", { token, body: { currentPassword: oldPassword, newPassword: "short", confirmPassword: "short" } });
  console.log("weak:", weak.status, weak.json?.code);

  // 5. Mismatch confirm
  const mismatch = await api("POST", "/api/user/change-password", { token, body: { currentPassword: oldPassword, newPassword, confirmPassword: "Different1!" } });
  console.log("mismatch:", mismatch.status, mismatch.json?.code);

  // 6. Same as current
  const same = await api("POST", "/api/user/change-password", { token, body: { currentPassword: oldPassword, newPassword: oldPassword, confirmPassword: oldPassword } });
  console.log("reuse:", same.status, same.json?.code);

  // 7. Correct change
  const ok = await api("POST", "/api/user/change-password", { token, body: { currentPassword: oldPassword, newPassword, confirmPassword: newPassword } });
  console.log("change-ok:", ok.status, "new token:", Boolean(ok.json?.data?.token));
  const newToken = ok.json?.data?.token;

  // 8. Old token invalidated
  const oldTokenCheck = await api("GET", "/api/user/profile", { token });
  console.log("old-token:", oldTokenCheck.status, oldTokenCheck.json?.code);
  const newTokenCheck = await api("GET", "/api/user/profile", { token: newToken });
  console.log("new-token-ok:", newTokenCheck.status);

  // 9. Login with old password fails, new password works
  const loginOld = await api("POST", "/api/auth/login", { body: { email, password: oldPassword } });
  console.log("login-old:", loginOld.status);
  const loginNew = await api("POST", "/api/auth/login", { body: { email, password: newPassword } });
  console.log("login-new:", loginNew.status, Boolean(loginNew.json?.data?.token));

  // 10. send-otp (SMTP real send)
  const sendOtp = await api("POST", "/api/user/change-password/send-otp", { token: newToken, body: {} });
  console.log("send-otp:", sendOtp.status, sendOtp.json?.code, sendOtp.json?.message);

  // 11. resend cooldown (immediately)
  const resend = await api("POST", "/api/user/change-password/send-otp", { token: newToken, body: {} });
  console.log("resend-cooldown:", resend.status, resend.json?.code);

  // 12. wrong OTP
  const wrongOtp = await api("POST", "/api/user/change-password/verify-otp", { token: newToken, body: { otp: "000000" } });
  console.log("wrong-otp:", wrongOtp.status, wrongOtp.json?.code);

  // 13. invalid reset token
  const badReset = await api("POST", "/api/user/change-password/reset", { token: newToken, body: { stepUpToken: "not-a-token", newPassword: "Another!234", confirmPassword: "Another!234" } });
  console.log("bad-reset:", badReset.status, badReset.json?.code);

  process.exit(0);
})().catch((e) => { console.error("FATAL", e.message); process.exit(1); });