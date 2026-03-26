//importamos las librerías necesarias para el proyecto
import { chromium } from 'playwright';  //controla el navegador
import type { Browser, Page } from 'playwright'; //tipos de typescript para el navegador y la página
import { Command } from 'commander'; //leer arguntos por terminal
import fs from 'fs'; //leer archivos de JSON


//Definimos la estructura del JSON
interface Platform {
  id: string; 
  name: string;
  url: string;
  usernameSelector: string;
  passwordSelector: string;
  submitSelector: string;
}

//Aqui definimos lo que pasamos por terminal 
const program = new Command();
program
  .requiredOption("-u, --user <email>", "Correo o usuario")
  .requiredOption("-p, --password <password>", "Contraseña")
  .requiredOption("-s, --site <siteId>", "Nombre o id de la plataforma (ej: testlogin)");

//Leermos los argumentos pasados por terminal  
program.parse(process.argv);
const options = program.opts();

const email = options.user.trim();
const password = options.password.trim();
const siteId = options.site.trim();

// Leer JSON de plataformas
const platforms: Platform[] = JSON.parse(fs.readFileSync('platforms.json', 'utf-8'));

// Buscar la plataforma por id o nombre
const platform = platforms.find(p => p.id === siteId || p.name.toLowerCase() === siteId.toLowerCase());

//validacion de la plataforma
if (!platform) {
  console.error(`No se encontró la plataforma con id o nombre "${siteId}"`);
  process.exit(1);
}

// Ruta del ejecutable de Edge
const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

//Ejecucion principal
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

    //esperamos que los inputs existen antes de interactuar con ellos 
    await page.waitForSelector(platform.usernameSelector, { timeout: 10000 });
    await page.waitForSelector(platform.passwordSelector, { timeout: 10000 });

    //Rellenamos los campos de usuario y contrase;a y hacemos click en el boton de submit
    await page.fill(platform.usernameSelector, email);
    await page.fill(platform.passwordSelector, password);
    await page.click(platform.submitSelector);

    console.log("Login automático completado.");


    //manejo de errores y cierre del navegador
  } catch (error) {
    console.error("Error automatizando el login:", error);
    if (browser) await browser.close();
  }
})();