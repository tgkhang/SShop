'use strict'

import multer from 'multer'

const uploadMemory = multer({
  storage: multer.memoryStorage(),
})

const uploadDisk = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './src/uploads') // Specify the destination folder for uploaded files
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname) // Specify the filename for uploaded files
    },
  }),
})

export { uploadMemory, uploadDisk }
