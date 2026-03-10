'use strict'

import { BadRequestError, NotFoundError } from '#core/error.response.js'
import { TemplateModel } from '#models/template.model.js'

class TemplateService {

  async createNewTemplate({ tem_name, tem_html }) {
    const existed = await TemplateModel.findOne({ tem_name }).lean().exec()
    if (existed) {
      throw new BadRequestError('Template name already exists')
    }

    const latestTemplate = await TemplateModel.findOne({}, { tem_id: 1 }).sort({ tem_id: -1 }).lean().exec()
    const nextTemplateId = latestTemplate ? latestTemplate.tem_id + 1 : 1

    const newTem = await TemplateModel.create({
      tem_id: nextTemplateId,
      tem_name,
      tem_html,
      tem_status: 'active',
    })

    return newTem
  }

  async getTemplateByName({ tem_name }) {
    const template = await TemplateModel.findOne({ tem_name, tem_status: 'active' }).lean().exec()
    if (!template) {
      throw new NotFoundError('Template not found')
    }

    return template
  }
}

export default new TemplateService()
