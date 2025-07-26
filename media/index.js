require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const cors = require('cors');
const Media = require('./models/Media');

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

// Endpoint para subir media
app.post('/api/media', upload.single('file'), async (req, res) => {
  try {
    const { title, description, hashtags, type, username } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    // Subir a Cloudinary
    const result = await cloudinary.uploader.upload_stream(
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
        // Guardar en MongoDB
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
    result.end(file.buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
