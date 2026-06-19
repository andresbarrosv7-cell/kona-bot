const axios = require("axios");

async function enviarWhatsApp(numero, mensaje) {

try {

```
await axios.post(
  `https://graph.facebook.com/v23.0/${process.env.PHONE_NUMBER_ID}/messages`,
  {
    messaging_product: "whatsapp",
    to: numero,
    type: "text",
    text: {
      body: mensaje
    }
  },
  {
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json"
    }
  }
);

console.log("✅ Mensaje enviado");
```

} catch (error) {

```
console.error(
  "❌ Error enviando mensaje:",
  error.response?.data || error.message
);
```

}

}

module.exports = enviarWhatsApp;
