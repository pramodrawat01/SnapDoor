import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'


const generateToken = (id : string) => {
    return jwt.sign({ id, role : "delivery"}, process.env.JWT_SECRET as string, { expiresIn : "7d"})
}

// login delivery partner
// POST /api/delivery/login
export const loginPartner = async(req : Request, res : Response) => {
    const {email, password} = req.body
    

    if(!email || !password) {
        return res.status(400).json({
            message : "Please provide email and password"
        })
    }
    const partner = await prisma.deliveryPartner.findUnique({
        where : { email : email.toLowerCase()}
    })


    if(!partner) {
        return res.status(404).json({
            message : "delivery partner not found, please provide correct information"
        })
    }

    if(!partner.isActive){
        return res.status(403).json({
            message : "your account has been deactivated"
        })
    }

    // check the password
    const isMatch = await bcrypt.compare(password , partner.password)
    if(!isMatch) {
        return res.status(401).json({
            message : "invalid credentials"
        })
    }

    // now generate token 
    const token = generateToken(partner.id)

    const { password : _, ...partnerData } = partner


    res.json({
        partner : partnerData, token
    })

}





// get assigned deliveries
// GET /api/delivery/my-deliveries
export const getMyDeliveries = async(req : Request, res : Response) => {
    const { status } = req.query;

    // the middleware will attach partner's  id in side the request
    const where : any = {deliveryPartnerId : req.partner!.id}

    /// here user wants deliveries as active deliveires or completed deliveries
    // find them in order table and include the required details
    if(status === "active")  {
        where.status = { in : ["Assigned", "Packed", "Out for Delivery"]}
    } else if (status === "completed"){
        where.status = { in : [ "Delivered", "Cancelled"]}
    }
    // now we have delivery status
    
    const orders = await prisma.order.findMany({
        where,
        include : {
            user : {
                select : {
                    name : true,
                    email : true,
                    phone : true,
                }
            }
        },
        orderBy : {createdAt : 'desc'}
    })

    res.json({orders})
}


// get single delivery details
// GET /api/delivery/:id
export const getDeliveryDetails = async(req : Request, res : Response) => {
    const order = await prisma.order.findFirst({
        where : {id : req.params.id as string, deliveryPartnerId : req.partner!.id},
        include : {
            user : {
                select :{
                    name : true,
                    email : true,
                    phone : true
                }
            }
        }
    })

    if(!order) {
        return res.status(404).json({
            message : " Delivery not found "
        })
    }

    res.json({order})
}





// complete delivery with OTP
export const completeDelivery = async(req : Request, res : Response) => {
    const { otp } = req.body;

    const order = await prisma.order.findFirst({
        where :{ id : req.params.id as string, deliveryPartnerId : req.partner!.id},
    })

    if(!order || order.status === "Cancelled" || order.status === "Delivered"){
        return res.status(400).json({messagte  : "invalid request "})
    }

    if(order.deliveryOtp !== otp){
        return res.status(500).json({message : "Invalid otp please try again "})
    }

    const history = order.statusHistory as any[];
    history.push({ status : "Delivered", note : "Order delivered", timesatmp : new Date()})


    /// update the order nce it is delivered
    const updatedOrder = await prisma.order.update({
        where : {id : order.id },
        data : {
            status : "Delivered",
            statusHistory : history,
            deliveryOtp : ""
        }
    })

    res.status(200).json({
        order : updatedOrder,
        message : "Delivery completed successfully"
    });

}


// cancle delivery 
//  PUT /api/delivery/my-deliveries/:id/cancel
export const cancelDelivery = async(req : Request, res : Response) => {
    const { reason } = req.body
    const order = await prisma.order.findFirst({
        where : {
            id : req.params.id as string,
            deliveryPartnerId : req.partner!.id
        }
    })

    if(order!.status === "Delivered"){
        return res.status(400).json({
            message :"you can not cancel the delivered order now"
        })
    }

    const history = order!.statusHistory as any[]
    history.push({
        status : "Cancelled",
        note : reason || "",
        timestamp : new Date()
    })

    // update the order
    const updatedOrder = await prisma.order.update({
        where : {id : order!.id},
        data : {status : "Cancelled", statusHistory : history}
    })

    /// handle this also - if any delivery partner has already assigned this order


    // send response
    res.json({
        oder : updatedOrder, 
        message : "delivery cancelled"
    })
}


// update order status
// PUT /api/delivery/my-deliveries/:id/status
export const updateDeliveryStatus = async(req : Request, res : Response) => {
    const { status} = req.body;
    const allowedStatuses = ["Packed", "Out for Delivery"];

    if(!allowedStatuses.includes(status)){
        return res.status(400).json({
            message : "Invlaid status update"
        })
    }

    // if the order is packed or out for delivery then excute these steps - 
    const order = await prisma.order.findFirst({
        where : {
            id : req.params.id as string,
            deliveryPartnerId : req.partner!.id
        }
    })

    const history = order!.statusHistory as any[]
    history.push({
        status,
        note : `status updated to ${status}`,
        timestamp : new Date()
    })

    const updatedOrder = await prisma.order.update({
        where : { id : order!.id},
        data : {status, statusHistory : history}
    })

    // send the response to client
    res.json({
        order : updatedOrder
    })
}



// update live location 
// PUT /api/delivery/my-deliveries/:id/location
export const updateLocation = async(req : Request, res : Response) => {
    const {lat, lng } = req.body;
    const order = await prisma.order.findFirst({
        where : {
            id : req.params.id as string, 
            deliveryPartnerId : req.partner!.id, 
            status : {
                in : ["Assigned", "Packed", "Out for Delivery"]
            }
        }
    })

    await prisma.order.update({
        where : {
            id : order!.id
        },
        data : {
            liveLocation : {
                lat, 
                lng, 
                updatedAt : new Date()
            }
        }
    })


    res.json({
        success : true
    })




}