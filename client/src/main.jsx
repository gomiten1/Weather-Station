import React from 'react'
import ReactDOM from 'react-dom/client'
import WeatherStation from './WeatherStation' // Importamos tu componente
import './index.css' // Importante para los estilos (Tailwind)

// Aquí buscamos el div con id="root" del index.html y metemos la app dentro
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WeatherStation />
  </React.StrictMode>,
)