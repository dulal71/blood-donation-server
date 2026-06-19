const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const app = express()
const cors = require('cors')
const dotenv=require('dotenv')
const port = 5000
dotenv.config()
app.use(cors())
app.use(express.json())
const uri=process.env.MONGODB_URI

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
    const database=client.db("blood-donation")
    const donationRequestCollection=database.collection("donation-request")

// get donation request
app.get('/api/donationRequest',async(req,res)=>{
  try{
const query={}
if(req.query.status){
  query.status=req.query.status
}
if(req.query.page){
  const page = req.query.page
 
  const perPage = 9
 const skip = (page-1) * 9
 const cursor= donationRequestCollection.find(query).skip(skip).limit(perPage)
  const donations = await cursor.toArray()
 
 return  res.send(donations)
}
const cursor= donationRequestCollection.find(query)
  const result = await cursor.toArray()
  res.send(result)
  }catch(error){
    res.status(500).json({
      success:false,
      error:error.message
    })
  }

})

// get donation by id
app.get('/api/donationRequest/:id',async(req,res)=>{
  try{
const id = req.params.id
const query = {
  _id:new ObjectId(id)
}
const cursor= donationRequestCollection.find(query)
  const result = await cursor.toArray()
  res.send(result)
  }catch(error){
    res.status(500).json({
      success:false,
      error:error.message
    })
  }

})


// add donation request
app.post('/api/donationRequest',async(req,res)=>{
  try{
    const data = req.body
   
    const newData={
      ...data,
      createAt: new Date()
    }
    
const result = await donationRequestCollection.insertOne(newData)
res.send(result)
  }catch(error){
    res.status(500).json({
      success:false,
      error:error.massage
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


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})