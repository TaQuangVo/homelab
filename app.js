const express = require("express")
const mongoose = require("mongoose")
const parseurl = require("parseurl")
const session = require("express-session")
const connectMongoStore = require("connect-mongo")




//express server
const app = express()
const port = 3000


//app db
//mongoose connection
const dbUrl = "mongodb://mongo"

const appDb = mongoose.createConnection(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

//check connection
appDb.on("error", () => {
    console.error.bind(console, "Connection error: ")
})
appDb.on("open", async () => {

    console.log("Connection success")

    const data = await dbmodel.find()
    console.log(data, data.length)
    if (data.length == 0) {
        console.log("create init data")

        const initData = new dbmodel({
            _id: "thisistheid",
            value: 0
        })

        initData.save((err, data) => {
            if (err) {
                console.log("Failed set init val: ", err)
            } else {
                console.log("init value set successfully")
            }
        })
    } else {
        console.log("init data exit, just go!")
    }
})

//db schema, models
const dbschema = mongoose.Schema({
    _id: String,
    value: Number
})
const dbmodel = appDb.model("visitCount", dbschema)



//session db
//express-session util
const sessionStore = connectMongoStore.create({
    mongoUrl: dbUrl,
    dbName: "mySessions",
    stringify: false,
})

var sessionUtil = {
    secret: 'Ma top an secret',
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
    cookie: { /*secure: true*/ maxAge: 1000 * 60 * 60 * 24, test: "this is a test" }
}
app.use(session(sessionUtil))




//midleware
app.use((req, res, next) => {
    const urlPathname = parseurl(req).pathname

    if (!req.session.views) {
        req.session.views = {}
    }

    req.session.views[urlPathname] = (req.session.views[urlPathname] || 0) + 1


    next();
})

app.use(async (req, res, next) => {
    let data
    try {
        data = await dbmodel.findById("thisistheid")
    } catch (error) {
        res.status(500).json({ error: "failed to get data", msg: error })
    }

    if (data.length == 0) {
        res.status(400).json({ error: "no data", msg: "there is no data in the database" })
    } else {
        const count = data.value + 1;
        data.value = count;
        data.save()

        req.totalView = count

        next()
    }

})

//routes
app.get("/", (req, res) => {

    res.send(`<div style="width:100vw;display:flex;height:100vh;justify-content:center;align-items: center;"><h1 style="text-align:center;color:blue;">This website have had ${req.totalView} visiters, you have visited this page ${req.session.views["/"]} times. :p</h1></div>`)

})

app.get("/home", (req, res) => {

    res.send(`<div style="width:100vw;display:flex;height:100vh;justify-content:center;align-items: center;"><h1 style="text-align:center;color:blue;">This website have had ${req.totalView} visiters, you have visited this page ${req.session.views["/home"]} times. :P </h1></div>`)

})

//app listener
app.listen(port, () => {
    console.log("App listen on port " + port)
})


