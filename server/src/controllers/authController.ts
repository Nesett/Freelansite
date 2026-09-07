import { Request, Response } from 'express'
import db from '../db/db.js'
import bcrypt from 'bcrypt'
import validator from 'validator';
import jwt from 'jsonwebtoken'


export async function signUp(req: Request, res: Response) {

    let {password, email, businessName, name } = req.body

    if (!password || !email || !name) {

        return res.status(400).json({error: "Please fill all required fields."})

    } else if (!validator.isEmail(email)){

        return res.status(400).json({error: "The email is invalid."})

    } else {

    email = email.trim().toLowerCase()
    name = name.trim()
    businessName = businessName?.trim() || null

    }

    //add check if the user with that email doesnt exist already.

    const salt = 10

    try {
        
        const hashedPassword = await bcrypt.hash(password, salt)

        const admin = await db.admin.create({
            data: {
            email,
            password: hashedPassword,
            name,
            businessName,
            },
        })
    
    return res.status(201).json({message: 'Successfully created account.', id:admin.id, name:admin.name})

    } catch(err){

        console.log(err)
        return res.status(500).json({error: 'Internal server error.'})

    }

}

export async function login(req: Request, res: Response) {

    let { password, email } = req.body

    if (!email) {
        return res.status(400).json({error: "Please enter email."})

    } else {

        email = email.trim().toLowerCase()

        if (!password) {

            return res.status(400).json({error: "Please enter password."})

        } else if (!validator.isEmail(email)) {

            return res.status(400).json({error: "The email is invalid."})

        }
    }
    
    try {
        const admin = await db.admin.findUnique({where: { email }})
        
        if (!admin) {
            return res.status(401).json({error: "Invalid credentials."})
        } else {
            const passwordMatch = await bcrypt.compare(password, admin.password)
            if (!passwordMatch) {
                return res.status(401).json({error: "Invalid credentials."})
            } else {

                const token = jwt.sign(
                    { id: admin.id, role: 'ADMIN' },
                    process.env.JWT_SECRET as string,
                    { expiresIn: '1d' }
                )

                res.cookie('auth_token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 24 * 60 * 60 * 1000
                })

                return res.status(200).json({message: "Successfully logged in!"})
            }
        }
        


    } catch(err){
        console.log(err)
        return res.status(500).json({error: 'Internal server error.'})
    }

}

export async function logout(req: Request, res: Response) {

    try {
        

    } catch(err){
        console.log(err)
        return res.status(500).json({error: 'Internal server error.'})
    }
}

export async function mySession(req: Request, res: Response) {

    try {
        return res.status(200).json({
            message: 'Session verified',
            user: req.user
        })

    } catch(err){
        console.log(err)
        return res.status(500).json({error: 'Internal server error.'})
    }
}