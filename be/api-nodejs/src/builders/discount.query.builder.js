import { ProductRepo } from '#models/repository/product.repo.js'
import { convertToObjectId } from '#utils/index.js'

class DiscountQueryBuilder {
  constructor() {
    this.queryConfig = {
      filter: {},
      limit: 50,
      page: 1,
      sort: 'ctime',
      select: ['product_name'],
    }
  }

  setShopId(shopId) {
    this.queryConfig.filter.product_shop = convertToObjectId(shopId)
    return this
  }

  setPublishedOnly() {
    this.queryConfig.filter.isPublished = true
    return this
  }

  setProductIds(productIds) {
    this.queryConfig.filter._id = { $in: productIds }
    return this
  }

  setLimit(limit) {
    this.queryConfig.limit = +limit
    return this
  }

  setPage(page) {
    this.queryConfig.page = +page
    return this
  }

  setSort(sort) {
    this.queryConfig.sort = sort
    return this
  }

  setSelect(fields) {
    this.queryConfig.select = fields
    return this
  }

  async execute() {
    return await ProductRepo.findAllProducts(this.queryConfig)
  }

  getConfig() {
    return this.queryConfig
  }
}

export { DiscountQueryBuilder }
