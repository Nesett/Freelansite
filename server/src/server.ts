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
import invoiceRoutes from './routes/invoiceRoutes.js'
import { toPublicSafe } from "./utils/sanitizer.js"
import rateLimit from "express-rate-limit"


const app = express()

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const PORT = process.env.PORT || 5001

const publicLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 60,
	standardHeaders: true,
	legacyHeaders: false
})

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
app.use('/api/invoices', invoiceRoutes)

app.get("/api/public/:token", publicLimiter, async (req: Request, res: Response) => {

  const token = String(req.params.token)

  const link = await prisma.magicLink.findUnique({
    where: {
      token
    },
    include: {
      project: {
        include: {
          client: {
            select: {
              name: true,
              companyName: true
            }
          },
          admin: {
            select: {
              name: true,
              businessName: true,
              email: true,
              phone: true
            }
          },
          milestones: {
            where: { deletedByAdmin: false },
            orderBy: { orderIndex: 'asc' }
          }
        }
      }
    }
  })

  if (!link) {
    return res.status(404).json({ error: "Not found" })
  }

  if (link.expiresAt <= new Date()) {
    await prisma.magicLink.delete({ 
      where: { 
        id: link.id 
      } 
    })

    return res.status(404).json({ error: "Not found" })
  }

  res.set("Cache-Control", "no-store")
  res.set("Referrer-Policy", "no-referrer")

  res.json(toPublicSafe(link.project))
})



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