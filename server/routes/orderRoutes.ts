import express from 'express'
import auth from '../middleware/authMiddleware.js'
import { createOrder, getAllOrders, getOrder, getOrderLoaction, getUserOrders, updateorderStatus } from '../contollers/orderController.js'
import admin from '../middleware/adminMiddleware.js'

const orderRouter = express.Router()

orderRouter.post('/', auth, createOrder)
orderRouter.get('/', auth, getUserOrders)
orderRouter.get('/:id', auth, getOrder)
orderRouter.get('/:id/location', auth, getOrderLoaction)

// admin routes
orderRouter.get('/all', auth , admin, getAllOrders)
orderRouter.put('/:id/status', auth, admin, updateorderStatus)

export default orderRouter