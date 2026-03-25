import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';
import { Command } from 'commander';
import fs from 'fs';

interface Platform {
  id: string;
  name: string;
  url: string;
  usernameSelector: string;
  passwordSelector: string;
  submitSelector: string;
}

const program = new Command();

program
  .requiredOption("-u, --user <email>", "Correo o usuario")
  .requiredOption("-p, --password <password>", "Contraseña")
  .requiredOption("-s, --site <siteId>", "Nombre o id de la plataforma (ej: testlogin)");

program.parse(process.argv);
const options = program.opts();

const email = options.user.trim();
const password = options.password.trim();
const siteId = options.site.trim();

// Leer JSON de plataformas
const platforms: Platform[] = JSON.parse(fs.readFileSync('platforms.json', 'utf-8'));

// Buscar la plataforma por id o nombre
const platform = platforms.find(p => p.id === siteId || p.name.toLowerCase() === siteId.toLowerCase());

if (!platform) {
  console.error(`No se encontró la plataforma con id o nombre "${siteId}"`);
  process.exit(1);
}

// Ruta del ejecutable de Edge
const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

(async () => {
  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({
      headless: false,
      executablePath: edgePath,
      args: ["--start-maximized"]
    });

    const page: Page = await browser.newPage();
    await page.setViewportSize({ width: 1366, height: 768 });

    console.log(`Abriendo ${platform.name}...`);
    await page.goto(platform.url, { waitUntil: 'networkidle', timeout: 60000 });

    await page.waitForSelector(platform.usernameSelector, { timeout: 10000 });
    await page.waitForSelector(platform.passwordSelector, { timeout: 10000 });

    await page.fill(platform.usernameSelector, email);
    await page.fill(platform.passwordSelector, password);
    await page.click(platform.submitSelector);

    console.log("Login automático completado.");

  } catch (error) {
    console.error("Error automatizando el login:", error);
    if (browser) await browser.close();
  }
})();