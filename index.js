// server.js
const express = require('express');
const path = require('path');

const app = express();
const port = 8080;

// Sirve archivos estáticos desde la carpeta actual
app.use(express.static(path.join(__dirname, '/')));

// Ruta principal que envía el archivo HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'registro.html'));
});

// Inicia el servidor
app.listen(port, () => {
  console.log(`Servidor funcionando en http://localhost:${port}`);
});
