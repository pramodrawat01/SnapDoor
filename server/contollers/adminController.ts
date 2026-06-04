
import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import bcrypt from 'bcrypt' 



// get admin dashboard data

// GET /api/admin/stats
export const getAdminStats = async(req : Request, res : Response) => {
    const [totalOrders, totalUsers, totalProducts, outOfStock, totalPartners, recentOrders] = await Promise.all([
        // getting the total count of orders which are completed (exclude card payment method and also exclude non paid orders yet)
        prisma.order.count({
            where : { NOT : [ { paymentMethod : 'card', isPaid : false} ]}
        }),
        prisma.user.count(),
        prisma.product.count(),
        prisma.product.count({
            where : {stock : 0}
        }),
        prisma.deliveryPartner.count(),
        prisma.order.findMany({
            where : {NOT : [{paymentMethod : "card", isPaid : false}]},
            orderBy : {createdAt : "desc"},
            take : 8,
            include : { 
                user : {
                    select : {
                        name : true,
                        email : true
                    }
                },
                deliveryPartner : {
                    select : {
                        name : true,
                        phone : true
                    }
                }
            }
        })
    ])
    res.json({
        totalOrders, totalUsers, totalProducts, outOfStock, totalPartners, recentOrders
    })

}


// get delivery partners list for admin to assign orders manually
export const getDeliveryPartners = async(req : Request, res : Response) => {
    const partners = await prisma.deliveryPartner.findMany({
        orderBy : {createdAt : "desc"}
    })
    res.json({partners})
}


// create delivery partner profile
export const createDeliveryPartner = async(req : Request, res : Response) => {
    const {name, email, password, phone, vehicleType} = req.body

    if(!name ||  !email || !password || !phone || !vehicleType){
        res.status(400).json({
            message : "Please provide all required fields"
        })
        return
    }

    const hashedPassword  = await bcrypt.hash(password, 10)
    
    const partner = await prisma.deliveryPartner.create({
        data : {
            name,
            email : email.toLowerCase(),
            password : hashedPassword,
            phone,
            vehicleType,
        }
    })
    res.status(201).json({
        partner
    })

}


// update delivery partner profile
export const updateDeliveryPartner = async(req : Request, res : Response) => {
    const {name, phone, vehicleType, isActive} = req.body
    const data : any = {};
    if(name) data.name = name
    if(phone) data.phone = phone
    if(vehicleType) data.vehicleType = vehicleType
    data.isActive = isActive

    try {
        const partner = await prisma.deliveryPartner.update({
            where : {id : req.params.id as string},
            data
        })

        res.json({partner})
    } catch (err ) {
        res.status(404).json({
            message : "delviery partner not found"
        })
    }
}


// assign delivery partner to anyorder
export const assignDeliverPartner = async(req : Request, res : Response) => {
    const {partnerId} = req.body

    const order = await prisma.order.findUnique({
        where : {id : req.params.id as string}
    })

    const partner = await prisma.deliveryPartner.findUnique({
        where :{id : partnerId }
    })

    // now we are assigning the partner to the order so we have to generate otp here for order confermation by user
    const otp = String(Math.floor(100000 + Math.random() * 900000))

    let status = order!.status

    const history  : any[] = Array.isArray(order!.statusHistory) ? order!.statusHistory : []
    if(order!.status === 'Placed' || order!.status === "Confirmed"){
        status = "Assigned";
        history.push({
            status : "Assigned",
            note : `Assigned to ${partner!.name},`,
            timeStamp : new Date()
        })
    }

    await prisma.order.update({
        where : {id : order!.id},
        data :{
            deliveryPartnerId : partner!.id,
            deliveryOtp : otp,
            status,
            statusHistory : history, 
        }
    })

    res.json({
        order
    })
}