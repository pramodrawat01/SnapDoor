import { Request, Response } from "express";
import Stripe from "stripe";
import { prisma } from "../config/prisma.js";
import { inngest } from "../inngest/index.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

export const stripeWebhook = async(request : Request , response : Response) => {
    let event;
    if (endpointSecret) {
        // Get the signature sent by Stripe
        const signature = request.headers['stripe-signature'];
        try {
        event = stripe.webhooks.constructEvent(
            request.body,
            signature as string,
            endpointSecret
        );
        } catch (err ) {
            if(err instanceof Error){
                console.log("Webhook verification failed:", err.message);
            } else {
                console.log(` Webhook signature verification failed.`, err);
            }
        return response.sendStatus(400);
        }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const paymentIntentId = paymentIntent.id;

        // getting session metadata
        const session = await stripe.checkout.sessions.list({
            payment_intent : paymentIntentId
        })
        const {orderId} = session.data[0].metadata as any;
        /// mark payment as paid
        const paidOrder = await prisma.order.update({
            where : {id : orderId},
            data : {isPaid : true}
        })

        // reduce the stock after payment successfull also 
        const orderItems = (Array.isArray(paidOrder.items)) ? paidOrder.items : [] as any[]
        for(const item of orderItems){
            await prisma.product.update({
                where : {id : item.product},
                data : { stock : {decrement : item.quantity}}
            })
        }

        // now trigger the inngest event for paid orders
        if(paidOrder){
            await inngest.send({
                name : "order/placed",
                data : {orderId}
            })
        }

        // now trigger another inngest function if stock reduced bellow the min. threshold - send stock update event for each product in the order 
        for(const item of orderItems){
            await inngest.send({
                name : "inventry/stock.update",
                data : {productId : item.product}
            })
        }
        break;


        case 'payment_intent.canceled':
        case 'payment_intent.payment_failed' : {
            const paymentIntentFailure = event.data.object as Stripe.PaymentIntent
            const paymentIntentFailureId = paymentIntentFailure.id;

            // getting session metadata
            const sessionFailure = await stripe.checkout.sessions.list({
                payment_intent : paymentIntentFailureId,
            })
            const failureOrderId  = (sessionFailure.data[0].metadata as any).orderId;

            // delete this order from the database;
            await prisma.order.delete({
                where : {id : failureOrderId}
            })
        }
        break;
        // ... handle other event types
        default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    response.json({received: true});
}}

// add the webhook endpoint in server.js file