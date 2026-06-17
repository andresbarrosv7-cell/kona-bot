const enviarWhatsApp = require("./whatsapp");
const express = require("express");
const respuestas = require("./respuestas");
const preguntarGemini = require("./gemini");

const app = express();

app.use(express.json());
app.use(express.static("public"));

const VERIFY_TOKEN = "kona_verify_2026";

// WEBHOOK META
console.log(
  "🔥 WEBHOOK POST RECIBIDO",
  JSON.stringify(req.body, null, 2)
);
app.get("/webhook", (req, res) => {

const mode = req.query["hub.mode"];
const token = req.query["hub.verify_token"];
const challenge = req.query["hub.challenge"];

if (
mode === "subscribe" &&
token === VERIFY_TOKEN
) {
console.log("✅ Webhook verificado");
return res.status(200).send(challenge);
}

res.sendStatus(403);
app.post("/webhook", async (req, res) => {

try {

```
const mensaje =
  req.body.entry?.[0]
  ?.changes?.[0]
  ?.value?.messages?.[0];

if (!mensaje) {
  return res.sendStatus(200);
}

const numero = mensaje.from;
const texto = mensaje.text?.body || "";

console.log(
  "📩 Mensaje recibido:",
  numero,
  texto
);

const respuesta =
  await obtenerRespuesta(texto);

const textoRespuesta =
  typeof respuesta === "object"
    ? respuesta.texto
    : respuesta;

await enviarWhatsApp(
  numero,
  textoRespuesta
);

res.sendStatus(200);
```

} catch (error) {

```
console.error(
  "❌ Error webhook:",
  error
);

res.sendStatus(500);
```

}

});

});

// LÓGICA DEL BOT

async function obtenerRespuesta(mensaje) {

mensaje = (mensaje || "").toLowerCase();

// SALUDO

const saludos = [
"hola",
"buenas",
"buenos dias",
"buenas tardes",
"buenas noches"
];

if (saludos.includes(mensaje.trim())) {
return respuestas.bienvenida;
}

// MENÚ PDF

if (
mensaje.includes("menu") ||
mensaje.includes("menú") ||
mensaje.includes("carta")
) {
return {
tipo: "pdf",
archivo: "./media/menu.pdf",
texto:
"☕ Te compartimos nuestro menú. Si tienes alguna pregunta estaremos encantados de ayudarte."
};
}

// DOMICILIOS

if (
mensaje.includes("domicilio") ||
mensaje.includes("domicilios") ||
mensaje.includes("envio") ||
mensaje.includes("envío") ||
mensaje.includes("envios") ||
mensaje.includes("envíos")
) {
return respuestas.domicilios;
}

// RESERVAS

if (
mensaje.includes("reserva") ||
mensaje.includes("reservar") ||
mensaje.includes("reservas")
) {
return respuestas.reservas;
}

// ESCALAR A HUMANO

if (
mensaje.includes("queja") ||
mensaje.includes("reclamo") ||
mensaje.includes("gerente") ||
mensaje.includes("administrador") ||
mensaje.includes("factura") ||
mensaje.includes("empleo")
) {
return respuestas.humano;
}

// GEMINI

try {

```
console.log("🤖 Consultando Gemini:", mensaje);

return await preguntarGemini(mensaje);
```

} catch (error) {

```
console.error("Error Gemini:", error);

return "☕ En este momento estoy teniendo una alta demanda.\n\nMientras tanto puedo ayudarte con:\n\n📍 Dirección\n🕒 Horario\n📋 Menú\n🚚 Domicilios\n📅 Reservas";
```

}

}

// HOME

app.get("/", (req, res) => {
res.send("☕ KONA BOT funcionando");
});

// PRUEBAS

app.get("/probar", async (req, res) => {

const mensaje = req.query.mensaje || "";

const respuesta = await obtenerRespuesta(mensaje);

res.json(respuesta);

});

// CHAT WEB

app.post("/chat", async (req, res) => {

try {

```
const mensaje = req.body.mensaje || "";

const respuesta = await obtenerRespuesta(mensaje);

if (typeof respuesta === "object") {

  return res.json({
    respuesta: respuesta.texto
  });

}

res.json({
  respuesta
});
```

} catch (error) {

```
console.error("Error en /chat:", error);

res.status(500).json({
  respuesta:
    "☕ Ocurrió un error procesando tu mensaje."
});
```

}

});

// INICIO DEL SERVIDOR

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
console.log(`☕ KONA BOT iniciado en puerto ${PORT}`);
});
