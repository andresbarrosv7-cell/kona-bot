const express = require("express");
const respuestas = require("./respuestas");
const preguntarGemini = require("./gemini");

const app = express();

app.use(express.json());
app.use(express.static("public"));
const VERIFY_TOKEN = "kona_verify_2026";

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

});

async function obtenerRespuesta(mensaje) {

  mensaje = mensaje.toLowerCase();

  // SALUDO

  const saludos = [
  "hola",
  "buenas",
  "buenos dias",
  "buenas tardes",
  "buenas noches"
];

if (
  saludos.includes(mensaje.trim())
) {
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

    console.log("🤖 Consultando Gemini:", mensaje);

    return await preguntarGemini(mensaje);

  } catch (error) {

    console.error("Error Gemini:", error);

    return `☕ En este momento estoy teniendo una alta demanda.

Mientras tanto puedo ayudarte con:

📍 Dirección
🕒 Horario
📋 Menú
🚚 Domicilios
📅 Reservas`;
  }
}

// Home

app.get("/", (req, res) => {
  res.send("☕ KONA BOT funcionando");
});

// Pruebas

app.get("/probar", async (req, res) => {

  const mensaje = req.query.mensaje || "";

  const respuesta = await obtenerRespuesta(mensaje);

  res.json(respuesta);

});

app.listen(3000, () => {
  console.log("☕ KONA BOT iniciado en puerto 3000");
});
// CHAT WEB

app.post("/chat", async (req, res) => {

  try {

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

  } catch (error) {

    console.error("Error en /chat:", error);

    res.status(500).json({
      respuesta:
        "☕ Ocurrió un error procesando tu mensaje."
    });

  }
});