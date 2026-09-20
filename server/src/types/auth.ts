export type UserRole = 'admin' | 'client' | 'link'

export interface TokenPayload {
    id: string
    role: UserRole
}