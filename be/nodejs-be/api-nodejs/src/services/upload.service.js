'use strict'

import cloudinary from '#configs/cloudinary.config.js'
import { env } from '#configs/environment.js'
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { s3Client } from '#configs/s3.config.js'
import { getSignedCloudFrontUrl } from '#configs/cloudfront.config.js'
import crypto from 'crypto'

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

  // Upload file use s3 client AWS S3 with CloudFront CDN
  static async uploadImageFromLocalS3({ file }) {
    try {
      const randomName = () => crypto.randomBytes(16).toString('hex')
      const fileName = randomName()

      const putCommand = new PutObjectCommand({
        Bucket: env.AWS_BUCKET_NAME,
        // Key: file.originalname || 'uploaded_file_' + Date.now(),
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      })

      const result = await s3Client.send(putCommand)
      console.log('S3 Upload Result:', result)

      // Generate signed CloudFront URL with 1 hour expiration
      const signedUrl = getSignedCloudFrontUrl(fileName, 3600)
      console.log('Signed CloudFront URL:', signedUrl)

      return {
        url: signedUrl, // Primary signed CloudFront URL (expires in 1 hour)
        key: fileName,
        bucket: env.AWS_BUCKET_NAME,
        expiresIn: 3600, // seconds
      }
    } catch (error) {
      console.error('Error uploading image from local to S3:', error)
      throw error
    }
  }
}

export default UploadService
