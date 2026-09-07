import { Request, Response } from 'express'
import db from '../db/db.js'
import bcrypt from 'bcrypt'
import validator from 'validator';


export async function signUp(req: Request, res: Response) {
    let {password, email, businessName, name } = req.body

    if (!password || !email || !name) {
        return res.send(400).json({error: "Please fill all required fields."})
    } else if (!validator.isEmail(email)){
        return res.send(400).json({error: "The email is invalid."})
    } else {
    email = email.trim()
    name = name.trim()
    businessName = businessName?.trim() || null
    }

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
    
    res.status(201).json({message: 'Successfully created account.', id:admin.id})

    } catch(err){
        console.log(err)
        return res.status(500).json({error: 'Internal server error.'})
    }

}

export async function login(req: Request, res: Response) {

    const { password, email } = req.body

    try {
        

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
        

    } catch(err){
        console.log(err)
        return res.status(500).json({error: 'Internal server error.'})
    }
}