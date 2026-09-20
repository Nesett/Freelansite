import { Admin, Client } from "@prisma/client"
import { UserRole } from "./auth"

declare global {
	namespace Express {
		interface Request {
			user?: Admin | Client
			userRole?: UserRole
		}
	}
}