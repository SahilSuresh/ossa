// Shares Ossa with phones that are NOT on your Wi-Fi, using a free Cloudflare tunnel
// (Expo's own --tunnel relies on a shared ngrok account that often fails).
// Needs cloudflared installed once:  winget install --id Cloudflare.cloudflared
const { spawn } = require("child_process");

const PORT = 8081;
// a portable copy in tools/ (no installer, no admin prompt) wins over an installed one
const path = require("path"), fs = require("fs");
const local = path.join(__dirname, "..", "tools", "cloudflared.exe");
const bin = fs.existsSync(local) ? `"${local}"` : "cloudflared";
const cf = spawn(bin, ["tunnel", "--url", `http://localhost:${PORT}`], { shell: true });
let started = false;

cf.on("error", () => {
  console.log("\nCouldn't start cloudflared. Install it once with:\n  winget install --id Cloudflare.cloudflared\nthen close this window, open a new one, and run  npm run share  again.\n");
  process.exit(1);
});

const watch = (buf) => {
  const m = String(buf).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
  if (!m || started) return;
  started = true;
  const url = m[0];
  const host = url.replace("https://", "");
  console.log("\n==============================================================");
  console.log("  Send this link to your friends (WhatsApp is fine):");
  console.log("  exps://" + host);
  console.log("  They need Expo Go installed. Tapping the link opens Ossa.");
  console.log("==============================================================\n");
  const expo = spawn("npx", ["expo", "start", "--lan", "--go", "--port", String(PORT)], {
    shell: true,
    stdio: "inherit",
    env: { ...process.env, EXPO_PACKAGER_PROXY_URL: url },
  });
  expo.on("exit", (c) => { cf.kill(); process.exit(c || 0); });
};
cf.on("exit", () => { if (!started) { console.log("\nCouldn't start cloudflared. Install it once with:\n  winget install --id Cloudflare.cloudflared\nthen close this window, open a new one, and run  npm run share  again.\n"); process.exit(1); } });
cf.stdout.on("data", watch);
cf.stderr.on("data", watch);
setTimeout(() => { if (!started) console.log("Still waiting for Cloudflare… (this can take up to 30 seconds)"); }, 15000);
process.on("SIGINT", () => { cf.kill(); process.exit(0); });
