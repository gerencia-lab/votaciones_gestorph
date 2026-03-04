
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Error crítico: No se encontró el elemento #root en el DOM.");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err) {
    console.error("Error durante el renderizado inicial de React:", err);
    // Silent fail if it's a minor React internal issue, or show clear UI
    rootElement.innerHTML = `
      <div style="padding: 40px; font-family: sans-serif; text-align: center; background: #fef2f2; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div style="background: white; padding: 32px; border-radius: 24px; shadow: 0 10px 15px -3px rgba(0,0,0,0.1); max-width: 400px; width: 100%;">
          <h2 style="color: #e11d48; font-weight: 800; font-size: 24px; margin-bottom: 12px;">Error al iniciar la sesión</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.5;">Ocurrió un problema técnico al cargar los componentes de la asamblea. Por favor, intente recargar la página.</p>
          <button onclick="window.location.reload()" style="background: #4f46e5; color: white; padding: 16px 24px; border-radius: 12px; border: none; cursor: pointer; margin-top: 24px; font-weight: 700; width: 100%; transition: opacity 0.2s;">
            REINTENTAR CARGA
          </button>
        </div>
      </div>
    `;
  }
}
