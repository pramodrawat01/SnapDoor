import express from 'express'
import { createProduct, updateProductStock, getFlashDeals, getProduct, getProducts, updateProduct } from '../contollers/productController.js'
import auth from '../middleware/authMiddleware.js'
import admin from '../middleware/adminMiddleware.js'

const productRouter = express.Router()

productRouter.get('/flash-deals', getFlashDeals)
productRouter.get('/', getProducts )
productRouter.post('/', auth, admin, createProduct) 

productRouter.get('/:id', getProduct)

productRouter.put('/:id', auth, admin, updateProduct)
productRouter.put('/:id/stock', auth, admin, updateProductStock)

export default productRouter