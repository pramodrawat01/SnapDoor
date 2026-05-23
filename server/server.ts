import "dotenv/config"
import express, { Request, Response } from 'express'
import cors from 'cors'

const app = express()


// middleware
app.use(cors())
app.use(express.json())

const port = process.env.PORT || 5000

// routes
app.get('/', (req : Request, res : Response) => {
    res.send("server is live now !")
})

app.listen(port, () => {
    console.log(`server is running at http://localhost:${port}`)
})