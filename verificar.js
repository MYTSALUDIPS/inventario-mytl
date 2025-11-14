import bcrypt from "bcrypt";

const passwordPlano = "M3yt3@1ps";
const hashGuardado = "$2a$10$Xl8xgO3UxR8v0F4i9Dg8E.6zXZJ3h2rbi5h3M.2VzKx6E9qEcqC3G";

bcrypt.compare(passwordPlano, hashGuardado, (err, resultado) => {
  if (resultado) {
    console.log("✅ La contraseña coincide correctamente");
  } else {
    console.log("❌ La contraseña no coincide");
  }
});
