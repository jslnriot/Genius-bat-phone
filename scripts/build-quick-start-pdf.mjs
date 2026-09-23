import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const htmlPath = path.join(root, "docs", "quick-start-print.html");
const pdfPath = path.join(root, "docs", "QUICK_START_GUIDE.pdf");

if (!fs.existsSync(htmlPath)) {
  console.error("Missing docs/quick-start-print.html");
  process.exit(1);
}

const htmlUrl = pathToFileURL(htmlPath).href;

let puppeteer;
try {
  puppeteer = (await import("puppeteer")).default;
} catch {
  console.error(
    "Puppeteer is required. Run: npm install --save-dev puppeteer",
  );
  process.exit(1);
}

const browser = await puppeteer.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto(htmlUrl, { waitUntil: "networkidle0", timeout: 60_000 });
  await page.pdf({
    path: pdfPath,
    format: "Letter",
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  console.log(`Wrote ${path.relative(root, pdfPath)}`);
} finally {
  await browser.close();
}
