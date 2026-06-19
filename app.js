const clientes = require("./clientes");
const { enviarWhatsApp, enviarPDF } = require("./whatsapp");
const express = require("express");
const respuestas = require("./respuestas");
const preguntarGemini = require("./gemini");

const app = express();

app.use(express.json());
app.use(express.static("public"));
app.use("/media", express.static("media"));

const VERIFY_TOKEN = "kona_verify_2026";

// WEBHOOK META

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

// RECIBIR MENSAJES DE WHATSAPP

app.post("/webhook", async (req, res) => {

  console.log("📩 WEBHOOK RECIBIDO");

  try {

    const mensaje =
      req.body.entry?.[0]
        ?.changes?.[0]
        ?.value?.messages?.[0];

    if (!mensaje) {
      return res.sendStatus(200);
    }

    const numero = mensaje.from;
    const texto = mensaje.text?.body || "";

    if (!clientes[numero]) {
      clientes[numero] = {
        saludado: false
      };
    }

    console.log(
      "📩 Mensaje recibido:",
      numero,
      texto
    );

    const respuesta =
      await obtenerRespuesta(
        texto,
        numero
      );

    if (
      typeof respuesta === "object" &&
      respuesta.tipo === "pdf"
    ) {

      await enviarWhatsApp(
        numero,
        respuesta.texto
      );

      await enviarPDF(numero);

    } else {

      await enviarWhatsApp(
        numero,
        typeof respuesta === "object"
          ? respuesta.texto
          : respuesta
      );

    }

    return res.sendStatus(200);

  } catch (error) {

    console.error(
      "❌ Error webhook:",
      error
    );

    return res.sendStatus(500);

  }

});

// LÓGICA DEL BOT

async function obtenerRespuesta(
  mensaje,
  numero
) {

  mensaje = (
    mensaje || ""
  ).toLowerCase();

  const saludos = [
    "hola",
    "buenas",
    "buenos dias",
    "buenas tardes",
    "buenas noches"
  ];

  // SALUDOS HUMANIZADOS

  if (
    saludos.includes(
      mensaje.trim()
    )
  ) {

    if (
      !clientes[numero].saludado
    ) {

      clientes[numero].saludado = true;

      return respuestas.bienvenida;

    }

    const respuestasCortas = [
      "☕ Hola nuevamente. ¿Qué te provoca hoy?",
      "☕ Bienvenido de nuevo. ¿Buscas café, postres o nuestro menú?",
      "☕ Qué bueno tenerte de vuelta. ¿Cómo puedo ayudarte?",
      "☕ Aquí estoy. ¿Qué deseas consultar?"
    ];

    return respuestasCortas[
      Math.floor(
        Math.random() *
        respuestasCortas.length
      )
    ];

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

    console.log(
      "🤖 Consultando Gemini:",
      mensaje
    );

    return await preguntarGemini(
      mensaje
    );

  } catch (error) {

    console.error(
      "❌ Error Gemini:",
      error
    );

    return "☕ En este momento estoy teniendo una alta demanda.\n\nMientras tanto puedo ayudarte con:\n\n📍 Dirección\n🕒 Horario\n📋 Menú\n🚚 Domicilios\n📅 Reservas";

  }

}

// HOME

app.get("/", (req, res) => {

  res.send(
    "☕ KONA BOT funcionando"
  );

});

// PRUEBAS

app.get("/probar", async (req, res) => {

  const mensaje =
    req.query.mensaje || "";

  if (!clientes["prueba"]) {
    clientes["prueba"] = {
      saludado: false
    };
  }

  const respuesta =
    await obtenerRespuesta(
      mensaje,
      "prueba"
    );

  res.json(respuesta);

});

// CHAT WEB

app.post("/chat", async (req, res) => {

  try {

    const mensaje =
      req.body.mensaje || "";

    if (!clientes["web"]) {
      clientes["web"] = {
        saludado: false
      };
    }

    const respuesta =
      await obtenerRespuesta(
        mensaje,
        "web"
      );

    if (
  typeof respuesta === "object" &&
  respuesta.tipo === "pdf"
) {

  return res.json({
    respuesta: respuesta.texto,
    pdf: "/media/menu.pdf"
  });

}


if (typeof respuesta === "object") {

  return res.json({
    respuesta: respuesta.texto
  });

}
    res.json({
      respuesta
    });

  } catch (error) {

    console.error(
      "Error en /chat:",
      error
    );

    res.status(500).json({
      respuesta:
        "☕ Ocurrió un error procesando tu mensaje."
    });

  }

});

// INICIO DEL SERVIDOR

const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    `☕ KONA BOT iniciado en puerto ${PORT}`
  );

});