const express = require('express');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express()
const port = process.env.PORT || 5000

app.use(cors({
    origin: ['http://localhost:5173','https://uifry-d1f45.web.app','https://uifry-d1f45.firebaseapp.com'],
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())



const verifyToken =  (req,res,next) =>{
     const token = req?.cookies?.token
     
     if(!token){
      return res.status(401).send({message: 'Unauthorized Access'})
     }
     jwt.verify(token,process.env.ACCESS_SECRET_TOKEN, (err,decoded)=>{
      if(err){
        return res.status(401).send({message: 'Unauthorized Access'})
      }
        req.user = decoded
        next()
     })
}

const uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@ac-wlwgtvd-shard-00-00.svtmaib.mongodb.net:27017,ac-wlwgtvd-shard-00-01.svtmaib.mongodb.net:27017,ac-wlwgtvd-shard-00-02.svtmaib.mongodb.net:27017/?ssl=true&replicaSet=atlas-7847a9-shard-0&authSource=admin&retryWrites=true&w=majority`

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
    // await client.connect();
    // Send a ping to confirm a successful connection


    const jobCollection = client.db("jobsDB").collection("jobCollection")
    const appliedCollection = client.db("jobsDB").collection("appliedJobCollection")


    app.post("/api/v1/jwt", async (req,res)=>{
      const user = req.body
      const token = jwt.sign(user,process.env.ACCESS_SECRET_TOKEN, {expiresIn:"1h"})
      res.cookie("token",token,{
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"? true:false,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      }).send({message:true})
    })

    app.post("/api/v1/job-add", async (req,res)=>{
        const job = req.body
        const result = await jobCollection.insertOne(job)
        res.send(result)
    })

    app.get("/api/v1/all-job", async (req,res)=>{
        let query = {}
        if(req?.query?.category){
            query = {category: req?.query?.category}
        }
        const cursor = jobCollection.find(query)
        const result = await cursor.toArray()
        res.send(result)
    })


    app.get("/api/v1/my-job",verifyToken, async (req,res)=>{
        let query = {}

        if(req?.user?.email !== req?.query?.email){
          return res.status(403).send({message: 'Forbidden Access'})
        }
        if(req?.query?.email){
            query = {email: req?.query?.email}
        }
        const cursor = jobCollection.find(query)
        const result = await cursor.toArray()
        res.send(result)
    })




    app.delete("/api/v1/user/delete-job/:id", async (req,res)=>{
        const id = req.params.id
        const result = await jobCollection.deleteOne({_id: new ObjectId(id)})
        res.send(result)
    })
    

    app.get("/api/v1/view-job/:id", async(req,res)=>{
        const id = req.params.id
        const filter = await jobCollection.findOne({_id : new ObjectId(id)})
        res.send(filter)
    })

    app.patch("/api/v1/view-job/:id", async (req, res) => {
        try {
          const id = req.params.id;
          console.log(id);
          const result = await jobCollection.updateOne({_id: new ObjectId(id)},
          { $inc: { applicants : 1, applicants   : 1 }}
          );
          res.send(result);
        } catch (error) {
          console.log(error);
        }
      });

    app.patch("/api/v1/view-job/update/:id", async (req, res) => {
        const id = req.params.id;
        const newDetail = req.body;
        try {
          const filter = await jobCollection.findOne({ _id: new ObjectId(id) });
          if (!filter) {
            return res.status(404).send({ error: "Job not found" });
          }
          const option = { upsert: true };
          const updateJob = {
            $set: {
              title: newDetail.title,
              photo: newDetail.photo,
              userName: newDetail.userName,
              category: newDetail.category,
              salary: newDetail.salary,
              postingDate: newDetail.postingDate,
              deadline: newDetail.deadline,
              applicants: newDetail.applicants,
              email: newDetail.email,
              description: newDetail.description,
            },
          };
          const result = await jobCollection.updateOne(filter, updateJob, option);
          res.send(result);
        } catch (error) {
          console.error("Error updating job:", error);
          res.status(500).send({ error: "Internal server error" });
        }
      });
      


    app.post("/api/v1/apply-job", async (req,res)=>{
        const job = req.body
        const result = await appliedCollection.insertOne(job)
        res.send(result)
    })

    app.get("/api/v1/apply-job", verifyToken, async (req,res)=>{

        let query = {}
        let category = {}
        
        if(req?.user?.email !== req?.query?.email){
          return res.status(403).send({message: 'Forbidden Access'})
        }
        
        if(req?.query?.email){
            query = {email: req?.query?.email}
        }
        if(req?.query?.category){
          category = {category: req?.query?.category}
        }
        console.log(query);
        const cursor = appliedCollection.find({$and:[query,category]})
        const result = await cursor.toArray()
        res.send(result)
    })







    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get("/",(req,res)=>{
    res.send("jobwave server is running")
})

app.listen(port,()=>{
    console.log(`server is running on port${port}`);
})