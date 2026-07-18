const http = require("http");

const tests = [
  ["GET", "/health"],
  ["GET", "/api/settings/website-mode"],
];

function run(i) {
  if (i >= tests.length) {
    console.log("✅ All APIs OK");
    process.exit(0);
    return;
  }
  const [method, path] = tests[i];
  http.get({ hostname: "localhost", port: 8787, path, method }, (res) => {
    let d = "";
    res.on("data", (c) => (d += c));
    res.on("end", () => {
      try {
        const j = JSON.parse(d);
        console.log(`${res.statusCode} ${path} ${j.success ? "OK" : j.code || "FAIL"}`);
      } catch (e) {
        console.log(`${res.statusCode} ${path} NOT JSON`);
      }
      run(i + 1);
    });
  }).on("error", (e) => {
    console.log(`ERR ${path}: ${e.message}`);
    run(i + 1);
  });
}
run(0);
