import express, { Request, Response } from "express";

const app = express()

const PORT = process.env.PORT;

app.use("/", (req: Request, res: Response)=>{
    console.log("Main page")
    res.send("idk")
})

app.listen(PORT, ()=>{console.log(`Server running at ${PORT}!`)}) 