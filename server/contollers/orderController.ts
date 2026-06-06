// create order - by user
// POST /api/order

import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { inngest } from "../inngest/index.js";
import Stripe from "stripe";


// create orders
export const createOrder = async(req : Request, res : Response) => {
    const {items, shippingAddress, paymentMethod} = req.body

console.log("payment method", paymentMethod)
    // check if order items are empty ?
    if(!items || items.length === 0){
        return  res.status(400).json({
            message : "no order items found"
        })
    }

    // loook for the actual price from the database
    const productIds = items.map( (i : any) => i.product )
    const products = await prisma.product.findMany( {
        where : {
            id : {
                in : productIds
            }
        }
    })

    // now we have all the produts selected by user from database for original price and etc data
    const productMap : Record<string, (typeof products)[0] > = {}

    products.forEach( (p : any) => ( productMap[p.id] = p));

    /// check if product is in stock
    for(const item of items){
        const product = productMap[item.product]
        if(!product || (product.stock ?? 0) < item.quantity) {
            return res.status(404).json({
                message : "product out of stock ..."
            })
        }
    }

    const orderItems = items.map((item : any) => {
        const dbProduct = productMap[item.product];
        if(!dbProduct) throw new Error(`product ${item.product} not found`)
        return {
            product : dbProduct.id, 
            name : dbProduct.name,
            image : dbProduct.image,
            price : dbProduct.price,
            quantity : item.quantity,
            unit : dbProduct.unit
        }
    })

    const subtotal = orderItems.reduce(( sum : number, item : any) => sum + item.price * item.quantity, 0)

    // delivery fee and all needs to be calculated... in different microservice
    const deliveryFee = subtotal > 20 ? 0 : 1.99;
    const tax = Math.round(subtotal * 0.08 * 100) /100;
    const total = Math.round((subtotal + deliveryFee + tax) * 100) / 100

    const order = await prisma.order.create({
        data : {
            userId : req.user!.id,
            items : orderItems,
            shippingAddress, 
            paymentMethod, 
            subtotal,
            deliveryFee,
            tax,
            total,
            statusHistory : [ { status : "Placed", note : "Order placed successfully", timestamp : new Date()}]

        }
    })


    // if(paymentMethod === 'card'){
    //     // stripe payment link
        
    //     const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)
        
    //     const session = await stripe.checkout.sessions.create({
    //     success_url: `${req.headers.origin}/orders?clearCart=true`,
    //     cancel_url : `${req.headers.origin}/checkout`,
    //     line_items: [
    //         {
    //         price_data: {
    //             currency : "usd",
    //             product_data : {
    //                 name : "Payment Groceries",
    //             },
    //             unit_amount : Math.round(total * 100)
    //         },
    //         quantity: 2,
    //         },
    //     ],
    //     mode: 'payment',
    //     metadata : {
    //         orderId : order.id 
    //     }
    //     });
    //     return res.json({
    //         // return the session url
    //         url : session.url
    //     })
    // }


    res.status(200).json({
        order 
    })

    // decrease stock
    for(const item of orderItems){
        await prisma.product.update({
            where : {
                id : item.product
            },
            data : {
                stock : {
                    decrement : item.quantity
                }
            }
        })
    }


    // send stock update event for each product in the order table by trigring inngest function
    for(const item of orderItems){
        await inngest.send({name : "inverntry/stock.updated",  data : {productId : item.product}})
    }

    // trigger second event - assign rider after 5 min
    await inngest.send({name : "order/placed", data : {orderId : order.id}})

}


// get uer's orders   
 // GET /api/orders
export const getUserOrders = async(req : Request , res : Response) => {
    const {status} = req.query;

    const where : any = {
        userId : req.user!.id,
        NOT : [{paymentMethod : "card", isPaid : false}]
    }

    if(status && status !== "all") {
        where.status = status;
    }

    const orders = await prisma.order.findMany({
        where, 
        include : {
            deliveryPartner : {
                select : {
                    name : true,
                    phone : true
                }
            }
        },
        orderBy : {
            createdAt : "desc"
        }
    })

    res.json({
        orders
    })
}


// get single order - for user
// GET /api/orders/:id
export const getOrder = async(req : Request , res : Response) => {

    const order = await prisma.order.findFirst({
        where : {
            id : req.params.id as string,
            userId : req.user!.id
        },
        include : {
            deliveryPartner : {
                select : {
                    name : true,
                    phone : true,
                    avatar : true,
                    vehicleType : true
                }
            }
        }
    })

    if(!order){
        return res.status(404).json({
            message : "order not found"
        })
    }

    res.json({order})
}


// update order status ( admin updates )
// PUT /api/orders/:id/status
// what we are doing in this controller function - 

{/***
    first - we are  destructureing status and note from req.body
    second - we find the order from order table useing prisma client with the help of req.param.id
    third - checking if order exist or not ?
    fourth - finding the history array with the help of order
    fifth - pushing the new object in history array like - {sttus, note, timeStamp}

    sixth - now update the order - first find the order inside table then update the data inside it 
    
*/}
export const updateorderStatus = async(req : Request , res : Response) => {
    const {status, note} = req.body;

    const order = await prisma.order.findUnique({
        where : {
            id : req.params.id as string
        }
    })

    if(!order){
        return res.status(404).json({
            message : "order not found"
        })
    }

    const history = (Array.isArray(order.statusHistory) ? order.statusHistory : []) as any[];

    history.push({
        status, 
        note : note || `order ${status.toLowerCase}`, 
        timeStamp : new Date()
    })

    const updatedOrder = await prisma.order.update({
        where : {
            id : req.params.id as string
        },
        data : {
            status,
            statusHistory : history
        }
    })

    res.status(200).json({
        message : "order updated successfully",
        order : updatedOrder,
    })

}



// get all orders for admin
// GET /api/orders/all
{/** 
    first - find the order from order table 
            which order amount is paid and not via card 
    second - from those order brind user nd deliverypartner's info
    third - and order them in decending order
    fourth - return them(all orders)  in response 
    */}

export const getAllOrders = async(req : Request , res : Response) => {
    const orders = await prisma.order.findMany({

        where : {
           NOT : [{ paymentMethod : "card" , isPaid : false }] 
        },
        include : {
            user : {
                select : {
                    name : true,
                    email : true,
                }
            },
            deliveryPartner : {
                select : {
                    name : true,
                    phone : true,
                    email : true
                }
            }
        }, 
        orderBy : {
            createdAt : "desc"
        }
    })

    res.status(200).json({
        orders
    })
}



// get order location with the help of lat and lng
// GET /api/orders/:id/location
{/*** 
    FIRST - finding the order from order table where id and userId matches with given data
    second - then selecting the livelocation and status from that order
    third - if we can't find the order then return 404 (not found status) in response
    fourth - return the live location in response once find it 
    
    */}

export const getOrderLoaction = async(req : Request , res : Response) => {
    const order = await prisma.order.findFirst({
        where : {
            id : req.params.id as string,
            userId : req.user!.id,
        },
        select : {
            liveLocation : true,
            status : true
        }
    })

    if(!order ) return res.status(404).json({
        message : "order not found"
    })

    res.status(200).json({
        liveLocation : order.liveLocation,
        status : order.status
    })
}   