import express from 'express'
import { createProduct, deleteProduct, getFlashDeals, getProduct, getProducts, updateProduct } from '../contollers/productController.js'
import auth from '../middleware/authMiddleware.js'
import admin from '../middleware/adminMiddleware.js'

const productRouter = express.Router()

productRouter.get('/flash-deals', getFlashDeals)
productRouter.get('/', getProducts )
productRouter.get('/:id', getProduct)

productRouter.post('/', auth, admin, createProduct)
productRouter.put('/:id', auth, admin, updateProduct)
productRouter.put('/:id', auth, admin, deleteProduct)

export default productRouter