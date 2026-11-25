const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function makeUploader(subfolder, prefix) {
  const dir = path.resolve(__dirname, '../../uploads', subfolder);
  fs.mkdirSync(dir, { recursive: true });
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const ext = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }[file.mimetype] || '.jpg';
      cb(null, `${prefix}-${req.user.id}-${Date.now()}${ext}`);
    },
  });
  const uploader = multer({
    storage,
    limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
    fileFilter: (req, file, cb) => {
      if (!ALLOWED_TYPES.has(file.mimetype)) return cb(new Error('Only JPG, PNG, or WEBP images are allowed.'));
      cb(null, true);
    },
  });
  return { uploader, dir, urlPrefix: `/uploads/${subfolder}` };
}

const plumberPhotos = makeUploader('plumbers', 'plumber');
const bookingPhotos = makeUploader('bookings', 'booking');

module.exports = {
  photoUpload: plumberPhotos.uploader,
  uploadDir: plumberPhotos.dir,
  bookingPhotoUpload: bookingPhotos.uploader,
  bookingUploadDir: bookingPhotos.dir,
  bookingUrlPrefix: bookingPhotos.urlPrefix,
};
