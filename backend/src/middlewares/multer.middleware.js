import multer from 'multer';
import path from 'path';
import os from 'os';
import fs from 'fs';

// Use /tmp on serverless (Vercel), ./public/temp locally
const uploadDir = process.env.VERCEL ? os.tmpdir() : './public/temp';

// Ensure the directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Add timestamp to avoid collisions
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    },
});

export const upload = multer({ storage });
