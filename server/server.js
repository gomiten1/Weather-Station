require('dotenv').config(); // Carga las variables del archivo .env
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

// --- CONFIGURACIÓN SEGURA ---
// Ahora las claves vienen del archivo .env
const THINGSPEAK_CHANNEL_ID = process.env.THINGSPEAK_CHANNEL_ID;
const THINGSPEAK_READ_KEY = process.env.THINGSPEAK_READ_KEY;

app.get('/api/clima', async (req, res) => {
  try {
    // Validar que existan las credenciales
    if (!THINGSPEAK_CHANNEL_ID) {
      return res.status(500).json({ error: 'Faltan credenciales en el servidor (.env)' });
    }

    const url = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?results=1${THINGSPEAK_READ_KEY ? `&api_key=${THINGSPEAK_READ_KEY}` : ''}`;
    
    const response = await axios.get(url);
    const feeds = response.data.feeds;

    if (feeds && feeds.length > 0) {
      const latest = feeds[0];

      const dataLimpia = {
        temp: parseFloat(latest.field1 || 0).toFixed(1),
        humidity: parseFloat(latest.field2 || 0).toFixed(0),
        light: parseFloat(latest.field3 || 0),
        sound: parseFloat(latest.field4 || 0),
        lastUpdate: latest.created_at
      };

      res.json(dataLimpia);
    } else {
      res.status(404).json({ error: 'No hay datos disponibles en ThingSpeak' });
    }

  } catch (error) {
    console.error('Error conectando a ThingSpeak:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});