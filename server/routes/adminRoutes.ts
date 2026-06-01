import express from 'express'
import auth from '../middleware/authMiddleware.js'
import admin from '../middleware/adminMiddleware.js'
import { assignDeliverPartner, createDeliveryPartner, getAdminStats, getDeliveryPartners, updateDeliveryPartner } from '../contollers/adminController.js'

const adminRouter = express.Router()

adminRouter.get('/stats', auth, admin, getAdminStats)
adminRouter.get('/delivery-partners', auth, admin, getDeliveryPartners)
adminRouter.post('/delivery-partners', auth, admin, createDeliveryPartner)

adminRouter.put('/delivery-partner/:id', auth , admin , updateDeliveryPartner)
adminRouter.put('/orders/:id/assign', auth, admin, assignDeliverPartner)

export default adminRouter