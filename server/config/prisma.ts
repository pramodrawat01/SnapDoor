import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from './generated/prisma'
import 'dotenv/config'


const adapter = new PrismaNeon({
    connectionString : process.env.DATABASE_URL!,
})

export const prisma = new PrismaClient({adapter})