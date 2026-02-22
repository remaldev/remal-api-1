class CreateProductDto {
  name: string
  price: number
  barcode: string
  quantity?: number
}

class UpdateProductDto {
  barcode?: string
  name?: string
  price?: number
  quantity?: number
}

class ProductResponseDto {
  id: string
  name: string
  price: number
  barcode: string
  quantity: number
  shopId: string
  createdAt: Date
  updatedAt: Date
}

export { CreateProductDto, UpdateProductDto, ProductResponseDto }
