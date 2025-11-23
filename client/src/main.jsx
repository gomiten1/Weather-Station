import React, { useState, useEffect } from 'react';
import { 
  Thermometer, 
  Droplets, 
  Sun, 
  Mic, 
  Activity, 
  Settings, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus,
  Server,
  User,
  Zap,
  AlertTriangle
} from 'lucide-react';

// --- Componentes UI Reutilizables ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl flex flex-col justify-between ${className}`}>
    {children}
  </div>
);

const Label = ({ icon: Icon, text, color = "text-slate-400" }) => (
  <div className={`flex items-center gap-2 mb-2 text-sm font-medium uppercase tracking-wider ${color}`}>
    <Icon size={16} />
    <span>{text}</span>
  </div>
);

const ValueDisplay = ({ value, unit, subtext, colorClass = "text-white" }) => (
  <div>
    <div className={`text-4xl font-bold ${colorClass}`}>
      {value}<span className="text-2xl text-slate-500 font-normal ml-1">{unit}</span>
    </div>
    {subtext && <div className="text-xs text-slate-400 mt-1">{subtext}</div>}
  </div>
);

// --- Helper Functions (Lógica de Negocio) ---

// Fórmula simplificada de Heat Index (Solo aplica significativamente > 27°C, pero usaremos una aproximación lineal para todo rango)
const calculateHeatIndex = (temp, humidity) => {
  const T = parseFloat(temp);
  const RH = parseFloat(humidity);
  // Fórmula simple aproximada para grados C
  const hi = T + 0.5555 * ((6.11 * Math.exp(5417.7530 * ((1/273.16) - (1/(273.15 + T))))) - 10); // Humidex base
  return hi.toFixed(1);
};

const getAirQualityStatus = (humidity) => {
  if (humidity < 30) return { text: "Aire Seco", color: "text-yellow-400" };
  if (humidity >= 30 && humidity <= 60) return { text: "Confortable", color: "text-emerald-400" };
  return { text: "Riesgo Moho", color: "text-red-400" };
};

// --- Componente Principal ---

export default function WeatherStation() {
  const [useDemo, setUseDemo] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Estados de Datos
  const [data, setData] = useState({
    temp: 0,
    humidity: 0,
    light: 0,
    sound: 0,
    lastUpdate: null
  });
  
  // Lógica Relativa & Derivada
  const [lightTrend, setLightTrend] = useState('stable'); 
  const [isNoisy, setIsNoisy] = useState(false);
  
  // Métricas Calculadas
  const [heatIndex, setHeatIndex] = useState(0);
  const [roomStatus, setRoomStatus] = useState("Desconocido");
  const [energyAdvice, setEnergyAdvice] = useState(null);
  
  // UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(new Date());

  const NOISE_THRESHOLD = 60;
  const BACKEND_URL = 'http://localhost:3001/api/clima'; 

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
        await new Promise(r => setTimeout(r, 500)); 
        const newTemp = (26 + Math.random() * 5).toFixed(1); // Subí un poco la temp base para probar alertas
        const newHum = Math.floor(40 + Math.random() * 40);
        const newLight = Math.floor(Math.random() * 100);
        const newSound = Math.floor(Math.random() * 100);
        
        processData({
          temp: newTemp,
          humidity: newHum,
          light: newLight,
          sound: newSound,
          lastUpdate: new Date().toISOString()
        });
      } else {
        const response = await fetch(BACKEND_URL);
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        const json = await response.json();
        processData(json);
      }
    } catch (err) {
      console.error(err);
      setError("Error conectando al servidor local");
    } finally {
      setLoading(false);
      setLastFetchTime(new Date());
    }
  };

  const processData = (newData) => {
    const temp = parseFloat(newData.temp);
    const hum = parseFloat(newData.humidity);
    const light = parseFloat(newData.light);
    const sound = parseFloat(newData.sound);

    // 1. Tendencias
    if (light > data.light + 2) setLightTrend('up');
    else if (light < data.light - 2) setLightTrend('down');
    else setLightTrend('stable');

    setIsNoisy(sound > NOISE_THRESHOLD);

    // 2. Cálculos Inteligentes (NUEVO)
    
    // Sensación Térmica
    setHeatIndex(calculateHeatIndex(temp, hum));

    // Detección de Presencia (Lógica simple: Ruido O Luz repentina)
    // Asumimos que si hay ruido > 40 o mucha luz (encendieron focos/abrieron cortinas), hay actividad.
    if (sound > 40 || light > 20) {
      setRoomStatus("Ocupada / Activa");
    } else {
      setRoomStatus("Vacía / Noche");
    }

    // Eficiencia Energética
    // Si hace calor (>25°C) y hay mucha luz (>80, sol directo probable), sugerir cerrar cortinas.
    if (temp > 25 && light > 80) {
      setEnergyAdvice("Cierra cortinas para ahorrar A/C ❄️");
    } else if (temp < 18 && light > 80) {
      setEnergyAdvice("Abre cortinas para calentar gratis ☀️");
    } else {
      setEnergyAdvice(null);
    }

    setData({
      temp: temp.toFixed(1),
      humidity: hum,
      light: light,
      sound: sound,
      lastUpdate: new Date(newData.lastUpdate)
    });
  };

  const getLightIcon = () => {
    if (lightTrend === 'up') return <ArrowUpRight className="text-yellow-400" size={32} />;
    if (lightTrend === 'down') return <ArrowDownRight className="text-indigo-400" size={32} />;
    return <Minus className="text-slate-500" size={32} />;
  };

  const getLightText = () => {
    if (lightTrend === 'up') return "Aumentando";
    if (lightTrend === 'down') return "Disminuyendo";
    return "Estable";
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 md:p-8 selection:bg-indigo-500 selection:text-white">
      
      {/* Header */}
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Estación Inteligente
          </h1>
          <p className="text-slate-400 text-sm flex items-center gap-2 mt-1">
            {useDemo ? (
              <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold border border-yellow-500/30">DEMO</span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/30">LIVE</span>
            )}
            <span className="flex items-center gap-1">
              {loading ? <RefreshCw size={12} className="animate-spin" /> : <Activity size={12} />}
              {lastFetchTime.toLocaleTimeString()}
            </span>
          </p>
        </div>

        {/* Panel de Alertas Inteligentes (Solo aparece si hay consejos) */}
        {energyAdvice && (
          <div className="flex items-center gap-3 bg-indigo-600/20 border border-indigo-500/50 px-4 py-2 rounded-lg animate-pulse">
             <Zap className="text-yellow-400" size={18} />
             <span className="text-sm font-medium text-indigo-100">{energyAdvice}</span>
          </div>
        )}

        <div className="flex gap-3">
           <button onClick={fetchData} className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400">
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-full border ${showSettings ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
            <Settings size={20} />
          </button>
        </div>
      </header>

      {showSettings && (
        <div className="max-w-6xl mx-auto mb-8 animate-in fade-in slide-in-from-top-4">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3 text-slate-300">
               <Server size={24} className="text-indigo-400"/>
               <div>
                 <p className="font-medium">Fuente de Datos</p>
                 <p className="text-xs text-slate-500">LIVE conecta a localhost:3001</p>
               </div>
            </div>
            <button 
              onClick={() => setUseDemo(!useDemo)}
              className={`px-6 py-2 rounded font-medium transition-all w-full md:w-auto ${useDemo ? 'bg-indigo-600 text-white' : 'bg-green-600 text-white'}`}
            >
              {useDemo ? "Cambiar a LIVE" : "Cambiar a DEMO"}
            </button>
          </div>
        </div>
      )}

      {/* Grid Principal */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* 1. Temperatura + Sensación */}
        <Card className="relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 bg-orange-500/10 w-32 h-32 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all"></div>
          <div>
            <Label icon={Thermometer} text="Clima Interior" color="text-orange-400" />
            <div className="flex items-end justify-between mt-2">
              <ValueDisplay value={data.temp} unit="°C" colorClass="text-orange-50"/>
              <div className="h-16 w-1.5 bg-slate-700 rounded-full overflow-hidden mb-1">
                <div className="w-full bg-gradient-to-t from-orange-600 to-yellow-400" style={{ height: `${Math.min((data.temp / 50) * 100, 100)}%` }}></div>
              </div>
            </div>
          </div>
          {/* Insight */}
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Sensación Térmica</span>
              <span className="text-orange-200 font-bold">{heatIndex}°C</span>
            </div>
          </div>
        </Card>

        {/* 2. Humedad + Salud Aire */}
        <Card className="relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 bg-cyan-500/10 w-32 h-32 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all"></div>
          <div>
            <Label icon={Droplets} text="Humedad" color="text-cyan-400" />
            <div className="flex items-end justify-between mt-2">
              <ValueDisplay value={data.humidity} unit="%" colorClass="text-cyan-50"/>
               <div className="relative w-12 h-12 mb-1">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path className="text-slate-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4"/>
                    <path className="text-cyan-500 transition-all duration-1000 ease-out" strokeDasharray={`${data.humidity}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4"/>
                  </svg>
               </div>
            </div>
          </div>
          {/* Insight */}
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Calidad Aire</span>
              <span className={`font-bold ${getAirQualityStatus(data.humidity).color}`}>
                {getAirQualityStatus(data.humidity).text}
              </span>
            </div>
          </div>
        </Card>

        {/* 3. Luz + Eficiencia */}
        <Card className="relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 bg-yellow-200/10 w-32 h-32 rounded-full blur-2xl group-hover:bg-yellow-200/20 transition-all"></div>
          <div>
            <Label icon={Sun} text="Iluminación" color="text-yellow-200" />
            <div className="mt-2 flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-white mb-1">{getLightText()}</div>
                <div className="text-xs text-slate-400">Sensor: {data.light}</div>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-full border border-slate-700">
                 {getLightIcon()}
              </div>
            </div>
          </div>
          {/* Insight */}
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <div className={`w-2 h-2 rounded-full ${data.light > 80 ? 'bg-yellow-400 animate-pulse' : 'bg-slate-600'}`}></div>
              {data.light > 80 ? "Sol Directo / Luz Alta" : "Luz Ambiental Normal"}
            </div>
          </div>
        </Card>

        {/* 4. Ruido + Presencia (Combinada) */}
        <Card className={`relative overflow-hidden transition-all duration-300 ${isNoisy ? 'border-red-500/50 shadow-red-900/20' : ''}`}>
          <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full blur-2xl transition-all duration-300 ${isNoisy ? 'bg-red-500/20' : 'bg-emerald-500/10'}`}></div>
          <div>
            <Label icon={Mic} text="Actividad / Ruido" color={isNoisy ? "text-red-400" : "text-emerald-400"} />
            <div className="mt-4 flex items-center gap-4">
              <div className={`flex h-3 w-3 relative`}>
                {isNoisy && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isNoisy ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
              </div>
              <div>
                <div className={`text-xl font-bold ${isNoisy ? 'text-red-100' : 'text-emerald-100'}`}>
                  {isNoisy ? "RUIDOSO" : "Silencioso"}
                </div>
                <div className="text-xs text-slate-400 mt-1">Nivel: {data.sound}</div>
              </div>
            </div>
          </div>
          {/* Insight (Fusión de Sensores) */}
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <User size={14} />
                <span>Estado Sala:</span>
              </div>
              <span className="text-indigo-200 font-medium">{roomStatus}</span>
            </div>
          </div>
        </Card>

      </main>
      
      {error && !useDemo && (
        <div className="max-w-6xl mx-auto mt-6 p-4 bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg text-center flex items-center justify-center gap-2">
          <AlertTriangle size={20}/>
          <span>{error}. Asegúrate de que el backend esté corriendo en puerto 3001.</span>
        </div>
      )}

      <footer className="max-w-6xl mx-auto mt-12 text-center text-slate-600 text-sm">
        <p>Estación IoT Inteligente v3.0 | Cálculos en Frontend</p>
      </footer>
    </div>
  );
}