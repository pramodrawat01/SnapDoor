import "dotenv/config"
import express, { NextFunction, Request, Response } from 'express'
import cors from 'cors'
import authRouter from "./routes/authRoutes.js"
import productRouter from "./routes/productRoutes.js"

const app = express()


// middleware
app.use(cors())
app.use(express.json())

const port = process.env.PORT || 5000

// routes
app.get('/', (req : Request, res : Response) => {
    res.send("server is live now !")
})

app.use('/api/auth', authRouter)
app.use('/api/products', productRouter)

// global error handler
app.use((error : any, req : Request, res : Response, next : NextFunction) => {
    
    console.error(error)
    res.status(500).json({
        message : error.message
    })
})

app.listen(port, () => {
    console.log(`server is running at http://localhost:${port}`)
})