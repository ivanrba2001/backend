# Media Backend API

Este backend permite subir archivos y metadatos a Cloudinary y almacena la información en MongoDB.

## Endpoints principales
- `POST /api/media`: Sube un archivo y metadatos, los guarda en Cloudinary y MongoDB.

## Configuración
1. Copia `.env.example` a `.env` y completa tus datos de Cloudinary y MongoDB.
2. Instala dependencias: `npm install`
3. Inicia el servidor: `node index.js` o `npm start`

## Tecnologías
- Node.js
- Express
- Multer
- Cloudinary
- MongoDB (Mongoose)
- dotenv
- cors
