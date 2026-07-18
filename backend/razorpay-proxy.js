const express = require("express");
const http = require("http");
const cors = require("cors");
require("dotenv").config({ override: true });

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/orders", require("./src/routes/paymentRoutes"));

app.use("/api", (req, res) => {
  const body = req.body ? Buffer.from(JSON.stringify(req.body)) : Buffer.alloc(0);
  const opts = {
    hostname: "localhost",
    port: 8787,
    path: req.originalUrl,
    method: req.method,
    headers: { ...req.headers, "content-length": body.length, "content-type": "application/json" },
  };
  delete opts.headers.host;
  delete opts.headers["transfer-encoding"];
  const proxy = http.request(opts, (pr) => {
    res.writeHead(pr.statusCode, pr.headers);
    pr.pipe(res);
  });
  proxy.on("error", (err) => {
    if (!res.headersSent) res.status(502).json({ error: err.message });
  });
  proxy.end(body);
});

app.use("/uploads", (req, res) => {
  const opts = {
    hostname: "localhost",
    port: 8787,
    path: req.originalUrl,
    method: req.method,
    headers: req.headers,
  };
  delete opts.headers.host;
  delete opts.headers["transfer-encoding"];
  const proxy = http.request(opts, (pr) => {
    res.writeHead(pr.statusCode, pr.headers);
    pr.pipe(res);
  });
  proxy.on("error", (err) => {
    if (!res.headersSent) res.status(502).json({ error: err.message });
  });
  const body = req.body ? Buffer.from(JSON.stringify(req.body)) : Buffer.alloc(0);
  proxy.end(body);
});

const PORT = 8794;
app.listen(PORT, () => {
  console.log(`Razorpay proxy running on port ${PORT}`);
  console.log(`Update Vite proxy from :8787 to :${PORT} in frontend/vite.config.js`);
});
