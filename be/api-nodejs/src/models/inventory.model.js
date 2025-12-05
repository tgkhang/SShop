import mongoose, { Schema } from 'mongoose'

const DOCUMENT_NAME = 'Inventory'
const COLLECTION_NAME = 'Inventories'

const InventorySchema = new Schema(
  {
    inven_productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    inven_location: { type: String, default: 'unknown' },
    inven_stock: { type: Number, required: true, min: 0 },
    inven_shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
    inven_reserved: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
)

const InventoryModel = mongoose.model(DOCUMENT_NAME, InventorySchema)

export { InventoryModel, InventorySchema, DOCUMENT_NAME, COLLECTION_NAME }
