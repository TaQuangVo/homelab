const express = require("express")
const mongoose = require("mongoose")
const connect = require("connect-mongo")
const session = require("express-session")
const parseurl = require("parseurl")




//express server
const app = express()
const port = 3000


//mongoose connection
const mongoClientP = mongoose.connect("mongodb://mongo",{useNewUrlParser: true, useUnifiedTopology: true}).then(m => m.connection.getClient())

//express-session util
var sessionUtil = {
    secret: 'Ma secret',
    resave: false,
    saveUninitialized: true,
    store:connect.create({mongoUrl:"mongodb://mongo"}),
    cookie: { /*secure: true*/ maxAge: 60000 , test:"this is a test"}
}
app.use(session(sessionUtil))


//db config
const dbschema = mongoose.Schema({
    _id: String,
    value: Number
})
const dbmodel = mongoose.model("visitCount", dbschema)


//check connection
const db = mongoose.connection
db.on("error", ()=>{
    console.error.bind(console, "Connection error: ")
})
db.on("open", async()=>{

    console.log("Connection success")

    const data = await dbmodel.find()
    console.log(data, data.length)
    if(data.length == 0){
        console.log("create init data")

        const initData = new dbmodel({
            _id: "thisistheid",
            value: 0
        })

        initData.save((err, data)=>{
            if(err){
                console.log("Failed set init val: ",err)
            }else{
                console.log("init value set successfully")
            }
        })
    }else{
        console.log("init data exit, just go!")
    }
})

//midleware
app.use((req, res, next)=>{
    const urlPathname = parseurl(req).pathname

    if(!req.session.views){
        req.session.views = {}
    }

    req.session.views[urlPathname] = (req.session.views[urlPathname] || 0) + 1


    next();
})

app.use(async(req,res,next) => {
    let data
    try {
        data = await dbmodel.findById("thisistheid")
    } catch (error) {
        res.status(500).json({error:"failed to get data", msg: error})
    }

    if(data.length == 0){
        res.status(400).json({error:"no data", msg:"there is no data in the database"})
    }else{
        const count = data.value + 1;
        data.value = count;
        data.save()

        req.totalView = count

        next()
    }

})

//routes
app.get("/",(req, res)=> {

    res.send(`<div style="width:100vw;display:flex;height:100vh;justify-content:center;align-items: center;"><h1 style="text-align:center;color:blue;">This website have had ${req.totalView} visiters, you have visited this page ${req.session.views["/"] } times.</h1></div>`)

})

app.get("/home",(req, res)=> {

    res.send(`<div style="width:100vw;display:flex;height:100vh;justify-content:center;align-items: center;"><h1 style="text-align:center;color:blue;">This website have had ${req.totalView} visiters, you have visited this page ${req.session.views["/home"] } times.</h1></div>`)

})

//app listener
app.listen(port, ()=>{
    console.log("App listen on port " + port)
})


