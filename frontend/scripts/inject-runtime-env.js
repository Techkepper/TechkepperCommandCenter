const fs = require("fs");
const path = require("path");

const buildDir = path.join(__dirname, "..", "build");
const indexPath = path.join(buildDir, "index.html");
const marker = '<noscript id="env-insertion-point"></noscript>';

const viteVars = Object.fromEntries(
  Object.entries(process.env).filter(([key, value]) => key.startsWith("VITE_") && value)
);

if (!fs.existsSync(indexPath)) {
  console.warn("[inject-runtime-env] build/index.html no encontrado, omitiendo inyección.");
  process.exit(0);
}

if (Object.keys(viteVars).length === 0) {
  console.warn("[inject-runtime-env] Sin variables VITE_* en el entorno.");
  process.exit(0);
}

let html = fs.readFileSync(indexPath, "utf8");
const envScript = `<script>window.ENV=${JSON.stringify(viteVars)};</script>`;

if (html.includes("window.ENV=")) {
  html = html.replace(/<script>window\.ENV=.*?<\/script>/, envScript);
} else if (html.includes(marker)) {
  html = html.replace(marker, `${envScript}${marker}`);
} else {
  html = html.replace("</head>", `  ${envScript}\n  </head>`);
}

fs.writeFileSync(indexPath, html);
console.log("[inject-runtime-env] window.ENV inyectado:", Object.keys(viteVars).join(", "));
