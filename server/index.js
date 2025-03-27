const express = require('express')
const app = express()
require('dotenv').config()
//code jodi environment variable a define korea thaka process.env.PORT er vitor jaba
const port = process.env.PORT || 3000
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require("cors")
const NodeCache = require("node-cache")
const compression = require('compression')
const cache = new NodeCache({stdTTL:100});

//middleware
app.use(express.json())
app.use(compression())
app.use(express.urlencoded({extended:true}))
app.use(cors({
  origin:process.env.FRONTEND_URL || "http://localhost:5173/",
  methods:["GET","POST","PUT","DELETE","OPTIONS"],
  credentials:true,
  allowedHeaders:["Content-Type","Authorization"]
}))









//connect mongodb
 
const uri = process.env.MONGODB_URL
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
   // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res) =>{
    res.send('Ecommerce Dashboard Analytics API')
})

app.listen(port, () =>{
    console.log(`Example app listening on port ${port}`)
})


//  admin
//CD0bUPe4iVscFv1w