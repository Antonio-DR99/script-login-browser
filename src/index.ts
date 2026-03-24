import readlineSync from "readline-sync";

const email = readlineSync.question("Introduce tu correo: ");
const password = readlineSync.question("Introduce tu contraseña: ", { hideEchoBack: true });

console.log("\nTus datos son:");
console.log("Correo:", email);
console.log("Contraseña:", password); 