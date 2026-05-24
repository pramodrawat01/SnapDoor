import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";


// GET /api/products/flash-deals
export const getFlashDeals = async (req : Request, res : Response) => {
    const products = await prisma.product.findMany({
        where : {stock : {gt : 0}},
        orderBy : {originalPrice : "desc"}
    })
    
    const productsWithDiscount = products.map((p : any) => {
        const discount = p.originalPrice && p.price ? Math.round(((p.originalPrice - p.price)/ p.originalPrice) * 100) : 0;
        return {...p, discount}
    })

    res.status(200).json({
        products : productsWithDiscount.slice(0,8)
    })
}


// GET /api/products
export const getProducts = async (req : Request, res : Response) => {
    const {category, search, minPrice, maxPrice , sort} = req.query

    const where : any = {};

    if(category && category !== "all") where.category = category as string;
    if(search) where.name = {contains : search as string, mode : "insensitive"};

    if(minPrice || maxPrice){
        where.price = {}
        if(minPrice) where.price.gte = Number(minPrice)
        if(maxPrice) where.price.lte = Number(maxPrice)
    }

    const orderBy : any = {};
    if(sort === "price-low") orderBy.price = 'asc'
    else if(sort === "price-high") orderBy.price = 'desc'
    else orderBy.createdAt = 'desc'

    const products = await prisma.product.findmany({where, orderBy})

    const productsWithDiscount = products.map((p:any) => {
        const discount = p.originalPrice && p.price ? Math.round( ((p.originalPrice - p.price)/p.originalPrice)*100) : 0
        return {...p, discount}
    })

    res.status(200).json({
        products : productsWithDiscount
    })

}


// GET /api/products/:id

export const getProduct = async(req: Request, res : Response) => {
    const product = await prisma.product.findUnique({
        where : {id : req.params.id as string}
    })

    if(!product) {
        res.status(404).json({
            message : "product not found"
        })
        return ;
    }


    const discount = product.originalPrice && product.price ? Math.round(((product.originalPrice)/product.originalPrice)*100) : 0
    
    res.status(200).json({
        ...product,
        discount
    })

}


// POST /api/products
export const createProduct = async(req:Request, res : Response) => {
    const product = await prisma.product.create({
        data : req.body
    })

    res.status(201).json({
        message : "product created successfully",
        product
    })
}


// POST /api/products/:id
export const updateProduct = async(req:Request, res : Response) => {
    const product = await prisma.product.update({
        where : { id : req.params.id as string },
        data : req.body
    })

    res.status(201).json({
        message : "product updated  successfully",
        product
    })
}

// POST /api/products/:id
export const deleteProduct = async(req:Request, res : Response) => {
    const product = await prisma.product.delete({
        where : { id : req.params.id as string }
    })

    res.status(201).json({
        message : "product deleted successfully"
    })
}