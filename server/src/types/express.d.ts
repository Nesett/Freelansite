export interface TokenPayload {
  id: string
  role: string
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload
    }
  }
}