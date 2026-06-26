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
    // await client.connect();
    const database=client.db("blood-donation")
    const donationRequestCollection=database.collection("donation-request")
   const userCollection = database.collection('user')
   const userSession=database.collection('session')
 const fundingCollection = database.collection('funding')
   // token verify
const verifyToken =async (req,res,next)=>{

const authHeader = req.headers?.authorization
if(!authHeader){
  return res.status(401).send({message: 'unauthorized access'})
}
const token = authHeader.split(" ")[1]

if(!token){
   return res.status(401).send({message: 'unauthorized access'})
}
const query = {token : token}
const session = await userSession.findOne(query)
console.log(session);
const userId = session.userId
const userQuery={
  _id:userId
}
const user = await userCollection.findOne(userQuery)
req.user = user
next()
}
 

// verify-admin
const verifyAdmin=async(req,res,next)=>{
  if(req.user?.role !== 'admin'){
    return res.status(403).send({message:'forbidden access'})
  }
next()
}
 

// verify-volunteer
const verifyVolunteer=async(req,res,next)=>{
  if(req.user?.role !== 'volunteer'){
    return res.status(403).send({message:'forbidden access'})
  }
next()
}


// get pending donation request
app.get('/api/donationRequest',async(req,res)=>{
  try{
const query={}
if(req.query.status){
  query.status=req.query.status
}
if(req.query.district){
  query.recipientDistrict=req.query.district
}
if(req.query.search){
  query.recipientName = { 
    $regex: req.query.search, 
    $options: 'i' 
  };
}
if(req.query.upazila){
  query.recipientUpazila=req.query.upazila
}

if(req.query.bloodGroup){
query.bloodGroup =req.query.bloodGroup
 
}



const  page = parseInt(req.query.page) || 1
const perPage = 9
 const skip = (page-1) * perPage
 const totalData = await donationRequestCollection.countDocuments(query)
 const cursor= donationRequestCollection.find(query).sort({ createdAt: -1 }).skip(skip).limit(perPage)
  const result = await cursor.toArray()
 return res.send({ result, totalData })
}catch(error){
    res.status(500).json({
      success:false,
      error:error.message
    })
  }

})


// get all donation request for admin
app.get('/api/admin/donation-requests', verifyToken,verifyAdmin ,async(req,res)=>{
  try{
const query={}
if(req.query.status){
  query.status=req.query.status
}

const  page = parseInt(req.query.page) || 1
const perPage = 9
 const skip = (page-1) * perPage
 const totalData = await donationRequestCollection.countDocuments(query)
 const cursor= donationRequestCollection.find(query).sort({ createdAt: -1 }).skip(skip).limit(perPage)
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
app.get('/api/donationRequest/:id',verifyToken, async(req,res)=>{
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
app.get('/api/donationRequest/user/:requesterId',verifyToken,async(req,res)=>{
  try{
const requesterId = req.params.requesterId

if(req.user._id.toString() !== req.params.requesterId){
return res.status(403).send({message: 'forbidden'})
}
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
app.post('/api/donationRequest',verifyToken, async(req,res)=>{
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




//donation edit
app.patch('/api/donationRequest/edit/:id', verifyToken , async(req,res)=>{
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


//update donation status
app.patch('/api/donationRequest/:id', verifyToken , async(req,res)=>{
  try{
    const id=req.params.id;
    const query={
      _id:new ObjectId(id)
    }
    const  { status,donorId,donorEmail,donorName } = req.body
  
    const updateData = {
    $set:{
     status,
     donorId,
     donorEmail,
     donorName 
    }
   }
   console.log(updateData);
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
app.delete('/api/donationRequest/:id' ,verifyToken, async(req,res)=>{
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

// get all user
app.get('/api/user',verifyToken, verifyVolunteer, async(req,res)=>{
  try{
    const cursor = userCollection.find()
    const result = await cursor.toArray()
    res.send(result)
  }catch(error){
    res.status(500).json({
      success:false,
      error:error.message
    })
  }
} )


// add funding data

app.post('/api/funding' ,async(req,res)=>{
try{
 const {session_id,name,userId,userEmail,amount,status}=req.body 
 const isExist = await fundingCollection.findOne({session_id})
 if(isExist){
return res.send({
        success: false,
        message: 'Data already exists'
      });
 }
 const data={
  session_id,
  name,
  userId,
  userEmail ,
  amount,
  status,
  createdAt: new Date()
 }
const result = await fundingCollection.insertOne(data)
res.send(result)
}catch(error){
  res.status(500).json({
    error:false,
    message:error.message
  })
}

})


//get all funding data

app.get('/api/funding',async(req,res)=>{
  try{
    const perPage = 10
    const page = req.query.page || 1
    const skip= (page - 1) * 10 ;
   
const cursor = fundingCollection.find().sort({ createdAt: -1 }). skip(skip).limit(perPage)
const result = await cursor.toArray()
const totalFunding=await fundingCollection.countDocuments()
const totalFundingAmount = await fundingCollection.aggregate([
  {
    $group: {
      _id: null,
      total: {
        $sum: { $toDouble: "$amount" }
      }
    }
  }
]).toArray();
res.send({result,totalFunding,
 result,
  totalFunding,
  totalAmount: totalFundingAmount[0]?.total || 0
})
  }catch(error){
res.status(500).json({
  error:false,
  message:error.message
})
  }
})

    // await client.db("admin").command({ ping: 1 });
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