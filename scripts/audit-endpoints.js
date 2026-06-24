const api = 'http://localhost:8787';
const rand = Math.random().toString(36).slice(2, 10);
const userEmail = `audit+${rand}@example.com`;
const userPassword = 'Passw0rd!';
const adminEmail = 'admin@tekunik.com';
const adminSecret = 'AutoAdmin2024!';

const log = (...args) => console.log(...args);
const req = async (path, opts = {}) => {
  const url = `${api}${path}`;
  const response = await fetch(url, opts);
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { url, status: response.status, ok: response.ok, body };
};

const run = async () => {
  log('health');
  log(await req('/health'));

  log('categories');
  log(await req('/api/categories'));

  log('products');
  log(await req('/api/products?limit=1'));

  log('register');
  const register = await req('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      first_name: 'Audit',
      last_name: 'User',
      email: userEmail,
      password: userPassword,
      phone: '1234567890',
      age: 25,
      address: '123 Test St',
      city: 'Testville',
      pincode: '123456'
    }),
  });
  log(register);

  log('login');
  const login = await req('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userEmail, password: userPassword }),
  });
  log(login);
  const token = (login.body && login.body.data && login.body.data.token) || login.body?.token;
  if (!token) throw new Error('User login did not return token');

  log('user profile');
  log(await req('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } }));
  log('user orders');
  log(await req('/api/user/orders', { headers: { Authorization: `Bearer ${token}` } }));

  log('admin login');
  const adminLogin = await req('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, secretKey: adminSecret }),
  });
  log(adminLogin);
  const adminToken = (adminLogin.body && adminLogin.body.data && adminLogin.body.data.token) || adminLogin.body?.token;
  if (!adminToken) throw new Error('Admin login did not return token');

  log('admin dashboard stats');
  log(await req('/api/admin/dashboard/stats', { headers: { Authorization: `Bearer ${adminToken}` } }));
  log('admin users');
  log(await req('/api/admin/users?page=1', { headers: { Authorization: `Bearer ${adminToken}` } }));
  log('admin categories');
  log(await req('/api/admin/categories', { headers: { Authorization: `Bearer ${adminToken}` } }));
  log('admin products');
  log(await req('/api/admin/products?page=1', { headers: { Authorization: `Bearer ${adminToken}` } }));
  log('admin orders');
  log(await req('/api/admin/orders?page=1', { headers: { Authorization: `Bearer ${adminToken}` } }));

  log('guest order track');
  log(await req('/api/guest/orders/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userEmail, orderId: '0' }),
  }));

  log('done');
};

run().catch((error) => {
  console.error('AUDIT FAILED:', error);
  process.exit(1);
});
