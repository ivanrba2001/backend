require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const cors = require('cors');

const Media = require('./models/Media');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// Middleware de autenticación JWT
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  jwt.verify(token, process.env.JWT_SECRET || 'secretkey', (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
}

// Registro de usuario
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Todos los campos son requeridos' });
    const userExists = await User.findOne({ $or: [{ username }, { email }] });
    if (userExists) return res.status(400).json({ error: 'Usuario o email ya existe' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'Usuario registrado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login de usuario
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Todos los campos son requeridos' });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Contraseña incorrecta' });
    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const storage = multer.memoryStorage();
const upload = multer({ storage });


// Endpoint para subir media (protegido)
app.post('/api/media', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { title, description, hashtags, type } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    const username = req.user.username;
    // Subir a Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `${username || 'anonymous'}/${type || 'media'}`,
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
        resource_type: 'auto',
        context: {
          title,
          description,
          hashtags,
        },
      },
      async (error, uploadResult) => {
        if (error) return res.status(500).json({ error: error.message });
        const media = new Media({
          title,
          description,
          hashtags: hashtags ? hashtags.split(',') : [],
          type,
          username,
          mediaUrl: uploadResult.secure_url,
          cloudinaryId: uploadResult.public_id,
          createdAt: new Date(),
        });
        await media.save();
        res.json(media);
      }
    );
    uploadStream.end(file.buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar media del usuario autenticado
app.get('/api/media', authMiddleware, async (req, res) => {
  try {
    const media = await Media.find({ username: req.user.username }).sort({ createdAt: -1 });
    res.json(media);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener media por ID (solo si pertenece al usuario)
app.get('/api/media/:id', authMiddleware, async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ error: 'No encontrado' });
    if (media.username !== req.user.username) return res.status(403).json({ error: 'Sin permiso' });
    res.json(media);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar media por ID (y en Cloudinary)
app.delete('/api/media/:id', authMiddleware, async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ error: 'No encontrado' });
    if (media.username !== req.user.username) return res.status(403).json({ error: 'Sin permiso' });
    // Eliminar de Cloudinary
    await cloudinary.uploader.destroy(media.cloudinaryId);
    await media.deleteOne();
    res.json({ message: 'Eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
