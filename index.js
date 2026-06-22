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
   const userCollection = database.collection('user')
// get donation request
app.get('/api/donationRequest',async(req,res)=>{
  try{
const query={}
if(req.query.status){
  query.status=req.query.status
}

const  page = parseInt(req.query.page) || 1
const perPage = 9
 const skip = (page-1) * perPage
 const totalData = await donationRequestCollection.countDocuments(query)
 const cursor= donationRequestCollection.find(query).skip(skip).limit(perPage)
  const result = await cursor.toArray()
 return res.send({ result, totalData })
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

  const result = await donationRequestCollection.findOne(query)
  res.send(result)
  }catch(error){
    res.status(500).json({
      success:false,
      error:error.message
    })
  }

})

// get donation by  user id
app.get('/api/donationRequest/user/:requesterId',async(req,res)=>{
  try{
const requesterId = req.params.requesterId
const query={requesterId}
if(req.query.status && req.query.status !== 'undefined'){
  query.status=req.query.status
}


const page = req.query.page || 1
const perPage = 5;
const skip = (page-1) * perPage
const totalData =await donationRequestCollection.countDocuments(query)
  const cursor =  donationRequestCollection.find(query).sort({createAt:-1}).skip(skip).limit(perPage)
  const result = await cursor.toArray()
  res.send({result, totalData})
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
      createdAt: new Date()
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


// update status 

app.patch('/api/donationRequest/:id' ,async(req,res)=>{
  try{
    const id = req.params.id
    const {status, donorId, donorEmail, donorName}=req.body
    const query={
      _id:new ObjectId(id)
    }
    
    const isStatusOnly = status === "done" || status === "canceled" 
    const updateData = isStatusOnly ? 
    {status} : {status, donorId, donorEmail, donorName}
  
    const result =await donationRequestCollection.updateOne(query,{$set:updateData})
    res.send(result)

  }catch(error){
res.status(500).json({
  success:false,
 message: error.message 
})
  }
})

//donation edit
app.patch('/api/donationRequest/edit/:id',async(req,res)=>{
  try{
    const id=req.params.id;
    const query={
      _id:new ObjectId(id)
    }
    const  { hospitalName, fullAddress, donationDate, donationTime } = req.body
   const updateData = {
    $set:{
      hospitalName,
      fullAddress,
      donationDate,
      donationTime
    }
   }
    const result = await donationRequestCollection.updateOne(query,updateData)
    res.send(result)
  }catch(error){
    res.status(500).json({
      success:false,
      error:error.message
    })
  }
} )

// delete donation
app.delete('/api/donationRequest/:id' ,async(req,res)=>{
  try{
    const id = req.params.id
   const query={
      _id:new ObjectId(id)
    }
    const result =await donationRequestCollection.deleteOne(query)
    res.send(result)
 }catch(error){
res.status(500).json({
  success:false,
 message: error.message 
})
  }
})

// update user status
app.patch('/api/user/:id',async(req,res)=>{
  try{
    const id=req.params.id;
    const query={
      _id:new ObjectId(id)
    }
    const   {status}  = req.body
    console.log(status);
   const updateData = {
    $set:{
      status
    }
   }
    const result = await userCollection.updateOne(query,updateData)
    res.send(result)
  }catch(error){
    res.status(500).json({
      success:false,
      error:error.message
    })
  }
} )


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