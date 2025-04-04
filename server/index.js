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
 // console.log("Loading from cache")
  return res.json(cacheAnalytics)
}
//document count
// Promise.all dia db ka handle kortacha 
const [activeUsers,totaProducts,totalRevenueData,monthlySalesData,inventoryMetrics,customerSegmentation] = await Promise.all([
  //active users
  db.collection("users").countDocuments(),

  //total products
  db.collection("products").countDocuments(),

  //total revenue
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
  ]).toArray(),

  //monthly sales data
  db.collection("orders").aggregate( [
    {
      $group:    
        {
          _id: {
            year: {
              $year: "$orderDate"
            },
            month: {
              $month: "$orderDate"
            }
          },
          revenue: {
            $sum: "$totalAmount"
          },
          orders: {
            $sum: 1
          }
        }
    },
    {
      $project:
      
        {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          revenue: 1,
          orders: 1
        }
    },
    {
      $sort:
      
        {
          year: 1,
          month: 1
        }
    }
  ]).toArray(),


  //inventory matrics
  db.collection("products").aggregate([
    {
      $group:
         
        {
          _id: null,
          totalStock: {
            $sum: "$stock"
          },
          averageStock: {
            $avg: "$stock"
          },
          lowStock: {
            $sum: {
              $cond: [
                {
                  $lt: ["$stock", 10]
                },
                1,
                0
              ]
            }
          },
          outOfStock: {
            $sum: {
              $cond: [
                {
                  $eq: ["$stock", 0]
                },
                1,
                0
              ]
            }
          }
        }
    }
  ]).toArray(),
// Customer Analysis
db.collection("orders").aggregate([
 {
   segment:{
     $switch:{
       branches:[
           {
           case: {
            $and:[ 
               {$gte:["$totalSpent",10000
           ]},
               {$lt:["$daysSinceLastPurchase",7
           ]}
            ]
         }, then:"VIP"},
           {
           case: {
             $lt:["$daysSinceLastPurchase",7
           ]
         }, then:"Active"},
         {
           case: {
             $lt:["daysSinceLastPurchase",30
           ]
         },
           then:"Regular" }
       ],
       default:"At Risk"
     }
   }
 }]).toArray(),

]);

const totalOrders = totalRevenueData[0].totalOrders || 0
const totalRevenue = totalRevenueData[0].totalRevenue || 0
//activeUser kivaba response a send korbo???
const analyticsData = {
  activeUsers,totaProducts,totalRevenueData,monthlySalesData,inventoryMetrics:inventoryMetrics[0],customerAnalytics:{
    totalCustomers:customerSegmentation.length,
    averageLifetimeValue:customerSegmentation((acc,curr)=>acc + curr.totalSpent, 0)/customerSegmentation.length || 0,
  customElements:customerSegmentation
  },
kpis:{
  averageOrderValue:totalOrders > 0 ? totalRevenue / totalOrders:0,
  conversionRate:activeUsers > 0 > 0? ((totalOrders/activeUsers) * 100).toFixed(2): "0.00",
  stockTurnoverRate:inventoryMetrics[0]?.totalStock>0 ? totalRevenue/inventoryMetrics[0].totalStock:0
}

};

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