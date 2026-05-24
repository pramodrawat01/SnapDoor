import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma.js";


const admin = async (req : Request, res : Response , next : NextFunction)=> {
    try {
        const userId = req.user?.id;

        if(!userId){
            return res.status(401).json({
                message : "Unauthorized"
            })
        }

        const user = await prisma.user.findUnique({
            where : {id : userId}
        })

        if(!user){
            return res.status(404).json({
                message : "User not found"
            })
        }

        const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase()) : []

        if(adminEmails.includes(user.email.toLowerCase())){
            if(req.user) req.user.isAdmin = true;
            next()
        }
        else {
            // 403 - forbidden response - authenticated but not authorized to access this resource
            res.status(403).json({
                message : "Admin access requried"
            })
        }
       
    } catch (error : any) {
        console.log(error)
        res.status(500).json({
            message : "admin verification failed",
            error : error.message
        })
    }
}

export default admin