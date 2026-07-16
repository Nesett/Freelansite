import http from 'node:http'


const server = http.createServer((req,res) => {
    res.statusCode = 200
    res.setHeader('content-type', 'text/html')
    res.end("test")
})

server.listen(3000, ()=>console.log("server works!"))