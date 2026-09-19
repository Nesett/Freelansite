import express, { Request, Response } from "express"
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import authRoutes from './routes/authRoutes.js'
import clientRoutes from './routes/clientRoutes.js'
import projectRoutes from './routes/projectRoutes.js'
import milestoneRoutes from './routes/milestoneRoutes.js'


const app = express()

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const PORT = process.env.PORT || 5001

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())


app.use('/api/auth', authRoutes)
app.use('/api/clients', clientRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/milestones', milestoneRoutes)


app.get('/api/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.status(200).json({ status: 'ok', database: 'connected' })
  } catch (error) {
    console.error('Database connection failed:', error)
    res.status(500).json({ status: 'error', database: 'disconnected' })
  }
})


app.listen(PORT, () => {
  console.log(`Server running at ${PORT}!`)
})

export default app