import React, { useState, useEffect } from 'react';
import { 
  Thermometer, Droplets, Sun, Mic, Activity, RefreshCw, 
  ArrowUpRight, ArrowDownRight, Minus, Zap, User
} from 'lucide-react';

// --- Estilos CSS (Integrados y Forzando Dark Mode) ---
const styles = `
  /* Reset básico */
  * { box-sizing: border-box; margin: 0; padding: 0; }

  /* Envoltorio principal que fuerza el fondo oscuro en toda la pantalla */
  .weather-wrapper {
    background-color: #0f172a; /* Slate 900 - Fondo Oscuro Profundo */
    color: #f1f5f9; /* Texto claro */
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    min-height: 100vh;
    width: 100%;
    position: absolute; /* Asegura cubrir todo */
    top: 0;
    left: 0;
  }

  .app-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem;
  }

  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  h1 {
    font-size: 2rem;
    font-weight: 700;
    /* Gradiente neón sutil */
    background: linear-gradient(to right, #818cf8, #22d3ee);
    -webkit-background-clip: text;
    color: transparent;
    margin-bottom: 0.5rem;
  }

  .status-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
    color: #94a3b8;
  }

  .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
  .dot.yellow { background-color: #facc15; box-shadow: 0 0 8px #facc15; }
  .dot.green { background-color: #4ade80; box-shadow: 0 0 8px #4ade80; }

  .btn-toggle {
    background: #1e293b;
    border: 1px solid #334155;
    color: #e2e8f0;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }
  .btn-toggle:hover { background: #334155; border-color: #475569; }

  /* Grid y Tarjetas */
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.5rem;
  }

  .card {
    /* Fondo oscuro semitransparente más fuerte para contraste */
    background: rgba(30, 41, 59, 0.7); 
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: transform 0.2s;
  }

  .card:hover { 
    transform: translateY(-2px); 
    background: rgba(30, 41, 59, 0.85);
    border-color: rgba(255, 255, 255, 0.15);
  }
  
  .card.alert-border { 
    border-color: rgba(248, 113, 113, 0.5); 
    box-shadow: 0 0 15px rgba(220, 38, 38, 0.15); 
  }

  /* Contenido Interno */
  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    text-transform: uppercase;
    font-size: 0.75rem;
    font-weight: bold;
    letter-spacing: 1px;
    color: #94a3b8;
    margin-bottom: 1rem;
  }

  .value-display { margin-bottom: 0.5rem; }
  .value-text { font-size: 2.5rem; font-weight: bold; line-height: 1; }
  .unit { font-size: 1.25rem; color: #64748b; font-weight: normal; margin-left: 4px; }
  .subtext { font-size: 0.75rem; color: #64748b; margin-top: 4px; }

  .insight {
    font-size: 0.85rem;
    color: #cbd5e1;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    margin-top: auto;
  }

  .row-center { display: flex; justify-content: space-between; align-items: center; }
  .flex-gap { display: flex; align-items: center; gap: 6px; }

  /* Colores Neón Suaves */
  .text-orange { color: #fdba74; text-shadow: 0 0 10px rgba(253, 186, 116, 0.2); }
  .text-cyan { color: #67e8f9; text-shadow: 0 0 10px rgba(103, 232, 249, 0.2); }
  .text-yellow { color: #fde047; text-shadow: 0 0 10px rgba(253, 224, 71, 0.2); }
  .text-red { color: #fca5a5; text-shadow: 0 0 10px rgba(252, 165, 165, 0.2); }
  .text-green { color: #86efac; }

  .icon-orange { color: #fb923c; }
  .icon-cyan { color: #22d3ee; }
  .icon-yellow { color: #facc15; }
  .icon-red { color: #f87171; }
  .icon-green { color: #4ade80; }
  .icon-purple { color: #a78bfa; }
  .icon-gray { color: #64748b; }

  /* Utilidades */
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { 100% { transform: rotate(360deg); } }

  .error-msg {
    text-align: center;
    margin-top: 2rem;
    color: #fca5a5;
    background: rgba(127, 29, 29, 0.3);
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid rgba(248, 113, 113, 0.3);
  }
`;

// --- Componentes UI Simples ---

const Card = ({ children, className = "" }) => (
  <div className={`card ${className}`}>
    {children}
  </div>
);

const ValueDisplay = ({ value, unit, subtext, colorClass = "" }) => (
  <div className="value-display">
    <div className={`value-text ${colorClass}`}>
      {value}<span className="unit">{unit}</span>
    </div>
    {subtext && <div className="subtext">{subtext}</div>}
  </div>
);

// --- Lógica del Clima ---

const calculateHeatIndex = (temp, humidity) => {
  const T = parseFloat(temp);
  if (T < 26) return T; // La fórmula solo funciona bien con calor
  return (T + 0.5555 * ((6.11 * Math.exp(5417.7530 * ((1/273.16) - (1/(273.15 + T))))) - 10)).toFixed(1);
};

export default function WeatherStation() {
  // CONFIGURACIÓN: Pon aquí tu ID directo para evitar líos de backend
  const CHANNEL_ID = '3179245'; 
  const READ_KEY = ''; // Si es privado, pon la key. Si es público, déjalo vacío.

  const [useDemo, setUseDemo] = useState(true);
  const [data, setData] = useState({ temp: 0, humidity: 0, light: 0, sound: 0, lastUpdate: null });
  const [lightTrend, setLightTrend] = useState('stable');
  const [isNoisy, setIsNoisy] = useState(false);
  const [heatIndex, setHeatIndex] = useState(0);
  const [roomStatus, setRoomStatus] = useState("Desconocido");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [useDemo]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (useDemo) {
        // Simulación
        await new Promise(r => setTimeout(r, 500));
        processData({
          field1: (24 + Math.random() * 5).toFixed(1),
          field2: Math.floor(40 + Math.random() * 20),
          field3: Math.floor(Math.random() * 100),
          field4: Math.floor(Math.random() * 100),
          created_at: new Date().toISOString()
        });
      } else {
        // Conexión Directa a ThingSpeak (Sin Backend Node)
        if (!CHANNEL_ID) throw new Error("Falta ID del Canal");
        const url = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?results=1${READ_KEY ? `&api_key=${READ_KEY}` : ''}`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.feeds && json.feeds.length > 0) processData(json.feeds[0]);
      }
    } catch (err) {
      console.error(err);
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const processData = (feed) => {
    const t = parseFloat(feed.field1 || 0); // Asumiendo Temp
    const h = parseFloat(feed.field2 || 0); // Asumiendo Humedad
    const l = parseFloat(feed.field3 || 0); // Asumiendo Luz
    const s = parseFloat(feed.field4 || 0); // Asumiendo Sonido

    // Tendencia Luz
    if (l > data.light + 5) setLightTrend('up');
    else if (l < data.light - 5) setLightTrend('down');
    else setLightTrend('stable');

    setIsNoisy(s > 60); // Umbral ruido
    setHeatIndex(calculateHeatIndex(t, h));
    setRoomStatus((s > 40 || l > 20) ? "Ocupada" : "Vacía");

    setData({ temp: t, humidity: h, light: l, sound: s, lastUpdate: new Date(feed.created_at) });
  };

  return (
    /* Usamos un wrapper con clase 'weather-wrapper' que tiene position:absolute 
       para asegurar que cubra toda la pantalla con el fondo oscuro */
    <div className="weather-wrapper">
      {/* Inyectamos los estilos aquí */}
      <style>{styles}</style>
      
      <div className="app-container">
        <header className="header">
          <div>
            <h1>Estación Clima</h1>
            <div className="status-badge">
              <span className={`dot ${useDemo ? 'yellow' : 'green'}`}></span>
              {useDemo ? "Modo Demo" : "En Vivo"}
              {loading && <RefreshCw size={14} className="spin" />}
            </div>
          </div>
          <button onClick={() => setUseDemo(!useDemo)} className="btn-toggle">
            {useDemo ? "Ver Real" : "Ver Demo"}
          </button>
        </header>

        <div className="grid">
          {/* Temperatura */}
          <Card>
            <div className="card-header">
              <Thermometer className="icon-orange" size={20} />
              <span>Temperatura</span>
            </div>
            <ValueDisplay value={data.temp} unit="°C" colorClass="text-orange" />
            <div className="insight">Sensación: {heatIndex}°C</div>
          </Card>

          {/* Humedad */}
          <Card>
            <div className="card-header">
              <Droplets className="icon-cyan" size={20} />
              <span>Humedad</span>
            </div>
            <ValueDisplay value={data.humidity} unit="%" colorClass="text-cyan" />
            <div className="insight">{data.humidity > 60 ? "Aire Húmedo" : "Confortable"}</div>
          </Card>

          {/* Luz */}
          <Card>
            <div className="card-header">
              <Sun className="icon-yellow" size={20} />
              <span>Luz</span>
            </div>
            <div className="row-center">
              <ValueDisplay value={data.light} unit="%" colorClass="text-yellow" />
              {lightTrend === 'up' ? <ArrowUpRight className="icon-yellow" size={32}/> : 
              lightTrend === 'down' ? <ArrowDownRight className="icon-purple" size={32}/> : 
              <Minus className="icon-gray" size={32}/>}
            </div>
          </Card>

          {/* Ruido */}
          <Card className={isNoisy ? "alert-border" : ""}>
            <div className="card-header">
              <Mic className={isNoisy ? "icon-red" : "icon-green"} size={20} />
              <span>Ruido</span>
            </div>
            <ValueDisplay value={data.sound} unit="dB" colorClass={isNoisy ? "text-red" : "text-green"} />
            <div className="insight flex-gap">
              <User size={14}/> {roomStatus}
            </div>
          </Card>
        </div>

        {error && <div className="error-msg">{error} - Revisa tu Channel ID</div>}
      </div>
    </div>
  );
}