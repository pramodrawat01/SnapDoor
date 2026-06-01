
import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";


// get user's addresses 
// GET /api/addresses
export const getAddresses = async (req : Request, res : Response) => {

    if(!req.user){
        return res.status(401).json({
            message : "unauthorized"
        })
    }

    const addresses = await prisma.address.findMany({
        // non - null assertion operator '!'
        where : {userId : req.user.id},
        orderBy : { createdAt : "asc"}
    })

    res.status(200).json({addresses})
}


// add/create address
// POST /api/addresses
export const addAddress = async (req : Request, res : Response) => {
    const {label, address, city, state,  zip, isDefault, lat, lng} = req.body

    // required cordinates
    if(lat == null || lng == null){
        return res.status(400).json({
            message : "location cordinates are required. Please allow location access"
        })
    }

    // find all the addresses of related user
    const currentAddresses = await prisma.address.findMany({
        where : {
            userId : req.user!.id
        },
    })

    let makeDefault = isDefault;
    // if user is adding address for the first tiem then make his address a default address
    if(currentAddresses.length === 0 ) makeDefault = true;

    if(makeDefault){
        // find all the addresses related to this user and make their isDefault : false 
        await prisma.address.updateMany({
            where : {userId : req.user!.id},
            data : {isDefault : false}
        })
    }

    // now an address needs to be saved 
    await prisma.address.create({
        data : {
            userId : req.user!.id,
            label : label,
            address : address,
            city : city,
            state : state,
            zip : zip,
            isDefault : makeDefault,
            lat : Number(lat),
            lng : Number(lng)
        }
    })

    const addresses = await prisma.address.findMany({
        where : {userId : req.user!.id},
        orderBy : {createdAt : 'asc'}
    })

    res.status(201).json({
        message : "new address has been saved successfully",
        addresses
    })
} 



//  update address
// PUT /api/addresses/:id
export const updateAddress = async (req : Request, res : Response) => {
    const {label, address, city, state,  zip, isDefault, lat, lng} = req.body

    // required cordinates
    if(lat == null || lng == null){
        return res.status(400).json({
            message : "location cordinates are required. Please allow location access"
        })
    }

    // isDefualt is true then - 
    if(isDefault){
        await prisma.address.updateMany({
            where : {userId : req.user!.id},
            data : {isDefault : false}
        })
    }

    const data : any = {};
    if(label) data.label = label;
    if(address) data.address = address;
    if(city) data.city = city;
    if(state) data.state = state;
    if(zip) data.zip = zip;
    if(isDefault !== undefined ) data.isDefault = isDefault;
    if(lat !== null ) data.lat = Number(lat);
    if(lng !== null ) data.lng = Number(lng);

    try {
        await prisma.address.update({
            where : {id : req.params.id as string},
            data
        })
    } catch (err ) {
        return res.status(404).json({message : "address not found"})
    }

    const addresses = await prisma.address.findMany({
        where : {userId : req.user!.id },
        orderBy : {createdAt : 'asc'}
    })

    res.status(200).json({
        message : "address updated successfully !  ",
        addresses, 
    })
}

// delete address
// DELETE /api/addresses/:id
export const deleteAddress = async (req : Request, res : Response) => {
    try {
        await prisma.address.delete({
            where : {id : req.params.id as string}
        })
    } catch (err  : any ) {
        console.log(err.message)
    }

    const addresses = await prisma.address.findMany({
        where : {userId : req.user!.id},
        orderBy : {createdAt : "asc"}
    })
    res.json({addresses})
}