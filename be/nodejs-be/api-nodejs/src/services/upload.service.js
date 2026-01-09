'use strict'

import cloudinary from '#configs/cloudinary.config.js'

class UploadService {
  //1. Upload from url image
  static async uploadImageFromUrl(imageUrl) {
    try {
      const folderName = 'product/shopId'
      const newFileName = 'testDemo'

      const result = await cloudinary.uploader.upload(imageUrl, {
        folder: folderName,
        public_id: newFileName,
        overwrite: true,
        resource_type: 'image',
      })
      return result
    } catch (error) {
      console.error('Error uploading image from URL:', error)
      throw error
    }
  }

  //2. Upload image from local
  static async uploadImageFromLocal(imagePath, folderName = 'product/shopId') {
    try {
      const result = await cloudinary.uploader.upload(imagePath, {
        public_id: 'local_upload_' + Date.now(),
        folder: folderName,
        overwrite: true,
        // resource_type: 'image',
      })

      return {
        image_url: result.secure_url,
        shop_id: 'shopId',
        thumbnail_url: await cloudinary.url(result.public_id, {
          height: 200,
          width: 200,
          format: 'jpg',
          crop: 'fill',
        }),
      }
    } catch (error) {
      console.error('Error uploading image from local:', error)
      throw error
    }
  }

  // static async streamUpload(fileBuffer, folderName) {
  //   return new Promise((resolve, reject) => {
  //     const stream = cloudinaryv2.uploader.upload_stream(
  //       {
  //         folder: folderName,
  //       },
  //       (err, result) => {
  //         if (err) reject(err)
  //         else resolve(result)
  //       }
  //     )
  //     streamifier.createReadStream(fileBuffer).pipe(stream)
  //   })
  // }
}

export default UploadService
