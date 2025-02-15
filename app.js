const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")

const app = express()
app.use(cors())
app.use(express.json())

mongoose.connect("mongodb+srv://rosemol:rosemol1t@cluster0.4vxoeox.mongodb.net/vaccinedb?retryWrites=true&w=majority&appName=Cluster0").then(async () => {
    console.log('Connected to MongoDB');
})

app.listen(5050,()=>{
    console.log("server started")
})