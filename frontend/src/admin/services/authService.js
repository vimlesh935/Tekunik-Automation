import { getApiUrl } from "../../services/api";

export const adminLogin = async (email, password) => {
  const res = await fetch(getApiUrl("/api/admin/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
};
