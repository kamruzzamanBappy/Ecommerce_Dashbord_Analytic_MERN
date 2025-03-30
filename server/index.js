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
   
   //create db and collections

   const db = await client.db("e-commerce-dashboard")


   //creating indexes for fasrer query
   await db.collection("orders").createIndex({orderDate:-1})
   await db.collection("orders").createIndex({userId:1})
   await db.collection("products").createIndex({stock:1})
   await db.collection("users").createIndex({lastLogin:-1})
   await db.collection("users").createIndex({email:1},{unique:true})
   await db.collection("products").createIndex({category:1})
   
   //data insert

  // await db.collection("orders").insertOne({
  //  name:"Product 1"
  // })
   
   //dashboard analytics endpoint

   app.get("/api/dashboard/analytics", async(req,res) => {
  

// try chk korba cache kora acha kina??

try{
const cacheAnalytics = cache.get("dashboardAnalytics");
if(cacheAnalytics){
  return res.json(cacheAnalytics)
}
//document count
// Promise.all dia db ka handle kortacha 
const [activeUsers,totaProducts,totalRevenueData] = await Promise.all([
  db.collection("users").countDocuments(),
  db.collection("products").countDocuments(),

  db.collection("orders").aggregate([
    {
      $group:
        
        {
          _id: null,
          totalRevenue: {
            $sum: "$totalAmount"
          },
          totalOrders: {
            $sum: 1
          }
        }
    }
  ]).toArray()



])
//activeUser kivaba response a send korbo???
const analyticsData = {
  activeUsers,totaProducts,totalRevenueData
}

cache.set("dashboardAnalytics",analyticsData,600)
//cache er name holo dashboardAnalytics.      analyticsData ka cache korichi. eta bar bar db fetch korba na. 600=10 min cache korbo

res.json(analyticsData)
// res.json er madhoma data send korbo

}
catch(error){
  console.error(error)
  res.status(500).json({
    message:"Internal Server Error",
    error:error.message
  })
}




   })

   
   
   
   
   
   
   
   
   
   
   
   
   
   
   
   
   
   
   
   
   
   
   
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