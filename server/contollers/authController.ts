import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken";


// Generate JWT token
const generateToken = (id : string) => {
    return jwt.sign(
        {id}, 
        process.env.JWT_SECRET as string,
        {expiresIn : "30d"}
    )
}

// check if user is Admin
const getAdminStatus = (email : string | null | undefined) : boolean => {
    if(!email) return false
    const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(", ").map((e) => e.trim().toLowerCase()) : [];
    return adminEmails.includes(email.toLowerCase())
}

// register
// POST /api/auth/register
// lot's of improvement required here - improvement ref - https://chatgpt.com/c/6a114c59-89b8-8322-8e53-a2f4e335d677
export const register = async (req : Request, res : Response) => {
    try {

        const {name, email, password} = req.body;

        if(!name || !email || !password){
            return res.status(400).json({
                message : "please provide all credentials"
            })
        }

        const existingUser = await prisma.user.findUnique({
            where : {email : email.toLowerCase()}
        })

        if(existingUser) {
            return res.status(400).json({
                message : "user already exist with this email id"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10) 

        const user = await prisma.user.create({
            data : {name, email : email.toLowerCase(), password : hashedPassword}
        })
        const token = generateToken(user.id)

        // here we sould attatch token in res.cookie

        // res.cookie("token", token, {
        //     httpOnly : true,
        //     secure : process.env.NODE_ENV === "production",
        //     sameSite : "strict"
        // })

        const userData:any = {...user};
        delete userData.password 

        userData.isAdmin = getAdminStatus(userData.email)
        
        res.status(201).json({
            user : userData, token
        })

        
    } catch (error) {
        console.log(error, "")

        return res.status(500).json({
            message : "internal server error"
        })
    }

}


// login 
// POST api/auth/login
export const login = async (req : Request, res : Response) => {
    try {
        const {email, password} = req.body;

        if(!email || !password) {
            return res.status(400).json({
                message : "please provide email and password"
            })
        }

        // the validation is required here for req.body data - zod library (typescript first validation library) / custom validation functions
        const user = await prisma.user.findUnique(
            {where : {email : email.toLowerCase()}, inlcude : {addresses : true}}
        )

        if(!user){
            return  res.status(401).json({
                message : "Invalid credentials !"
            })
        }

        const isMatched = await bcrypt.compare(password , user.password)
        if(!isMatched) {
            return  res.status(401).json({
                message : "Invalid credentials !"
            })
        }

        // all credentials are correct -
        const token = generateToken(user.id)

        // here we can also create a safe user instead of userData
        const userData : any  = {...user}
        delete userData.password;
        userData.isAdmin = getAdminStatus(userData.email)

        // send responst to client
        res.status(200).json({
            user : userData, token
        })


    } catch (error) {
        
    }
}