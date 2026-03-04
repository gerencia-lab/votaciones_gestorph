import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Servir archivos estáticos desde la carpeta 'dist' (generada por vite build)
app.use(express.static(path.join(__dirname, 'dist')));

// Manejar cualquier otra ruta devolviendo el index.html (para React Router/SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor GestorPH corriendo en el puerto ${PORT}`);
});