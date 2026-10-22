// Serves the desktop preview of the app at http://localhost:5178 (rebuilds on each page load).
const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const PORT = 5178;
http.createServer((req, res) => {
  try {
    execFileSync(process.execPath, [path.join(__dirname, "build-html.js")], { stdio: "ignore" });
    res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    res.end(fs.readFileSync(path.join(__dirname, "..", "web", ".preview.html")));
  } catch (e) {
    res.writeHead(500, { "content-type": "text/plain" });
    res.end(String(e && e.stack || e));
  }
}).listen(PORT, () => console.log("Ossa preview on http://localhost:" + PORT));
