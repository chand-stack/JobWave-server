const express = require('express');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const cors = require('cors');
const port = process.env.PORT || 5000

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}))
app.use(express.json())


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


    app.post("/api/v1/job-add", async (req,res)=>{
        const job = req.body
        console.log(job);
        const result = await jobCollection.insertOne(job)
        res.send(result)
    })

    app.get("/api/v1/all-job", async (req,res)=>{
        let query = {}
        // console.log(req.query.category);
        if(req?.query?.category){
            query = {category: req?.query?.category}
        }
        // if(req?.query?.email){
        //     query = {email: req?.query?.email}
        // }
        console.log(query);
        const cursor = jobCollection.find(query)
        const result = await cursor.toArray()
        res.send(result)
    })



    app.get("/api/v1/my-job", async (req,res)=>{
        let query = {}
        
        if(req?.query?.email){
            query = {email: req?.query?.email}
        }
        console.log(query);
        const cursor = jobCollection.find(query)
        const result = await cursor.toArray()
        res.send(result)
    })




    app.delete("/api/v1/user/delete-job/:id", async (req,res)=>{
        const id = req.params.id
        const result = await jobCollection.deleteOne({_id: new ObjectId(id)})
        res.send(result)
        console.log(result);
    })
    

    app.get("/api/v1/view-job/:id", async(req,res)=>{
        const id = req.params.id
        const filter = await jobCollection.findOne({_id : new ObjectId(id)})
        // console.log(filter);
        res.send(filter)
    })


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
      

    // app.put("/api/v1/view-job/:id", async(req,res)=>{
    //     const id = req.params.id
    //     const count = req.body
    //     const option = {upsert:true}
    //     const filter = jobCollection.findOne({_id : new ObjectId(id)})
    //     const updateDoc = {
    //         $set:{
    //             applicants: toString(count.applicantCount) 
    //         }
    //     }
    //      const result = await jobCollection.updateOne(filter,updateDoc,option)
    //     console.log(count.applicantCount);
    //     res.send(result)
    // })

    app.post("/api/v1/apply-job", async (req,res)=>{
        const job = req.body
        // console.log(job)
        const result = await appliedCollection.insertOne(job)
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