'use strict'

import { BadRequestError } from '#core/error.response.js'
import { SuccessResponse } from '#core/success.response.js'
import UploadService from '#services/upload.service.js'

class UploadController {
  async uploadFile(req, res) {
    new SuccessResponse({
      message: 'File uploaded successfully',
      metadata: {
        file: await UploadService.uploadImageFromUrl(req.body.imageUrl),
      },
    }).send(res)
  }

  async uploadFileLocal(req, res) {
    const { file } = req
    if (!file) {
      throw new BadRequestError('No file uploaded')
    }

    new SuccessResponse({
      message: 'File uploaded successfully',
      metadata: {
        file: await UploadService.uploadImageFromLocal(req.file.path),
      },
    }).send(res)
  }
}

export default new UploadController()
