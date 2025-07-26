# Media Backend API

Este backend permite subir archivos y metadatos a Cloudinary y almacena la información en MongoDB.


## Endpoints principales
- `POST /api/auth/register`: Registro de usuario (username, email, password)
- `POST /api/auth/login`: Login de usuario (email, password) → retorna JWT
- `POST /api/media`: Sube un archivo y metadatos (protegido, requiere JWT)
- `GET /api/media`: Lista los archivos subidos por el usuario autenticado
- `GET /api/media/:id`: Obtiene un archivo específico del usuario autenticado
- `DELETE /api/media/:id`: Elimina un archivo del usuario autenticado (también en Cloudinary)


## Configuración
1. Copia `.env.example` a `.env` y completa tus datos de Cloudinary, MongoDB y agrega `JWT_SECRET`.
2. Instala dependencias: `npm install`
3. Inicia el servidor: `node index.js` o `npm start`

## Uso básico
1. Registra un usuario con `POST /api/auth/register` (envía JSON: `{ "username": "usuario", "email": "correo", "password": "clave" }`)
2. Haz login con `POST /api/auth/login` (envía JSON: `{ "email": "correo", "password": "clave" }`), obtendrás un token JWT.
3. Usa el token JWT en el header `Authorization: Bearer <token>` para acceder a los endpoints de media.

## Notas
- Todos los endpoints de media requieren autenticación JWT.
- Los archivos subidos se almacenan en Cloudinary y la información en MongoDB.


## Tecnologías
- Node.js
- Express
- Multer
- Cloudinary
- MongoDB (Mongoose)
- dotenv
- cors
- bcryptjs (hash de contraseñas)
- jsonwebtoken (autenticación JWT)
