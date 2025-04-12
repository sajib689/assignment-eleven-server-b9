const express = require('express');
const cors = require('cors');
require('dotenv').config()
const jwt = require('jsonwebtoken');

var cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 3000
const app = express();

app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173','https://food-hub-pearl.vercel.app'],
  credentials: true
}));
app.use(cookieParser())






const uri = `mongodb+srv://${process.env.Db_user}:${process.env.Db_password}@cluster0.2m0rny5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
  const verifyToken = async (req, res, next) => {
    const token = req?.cookies?.token
    if(!token){
     return res.status(401).send({message: 'unauthorized access'})
    }
    jwt.verify(token,process.env.Access_Token, (err, decode) =>{
      if(err) {
       return res.status(401).send({message: 'unauthorized access'})
      }
      req.user = decode
      next()
    })
  }
async function run() {
  try {
    const foodCollection = await client.db('foodDb').collection('foodCollection')
    const requestCollection = await client.db('foodDb').collection('foodRequest')
   const contactCollection = await client.db('foodDb').collection('contact')
    // jwt post
    app.post('/jwt', async (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.Access_Token, {
        expiresIn: '1h'
      })
      res
      .cookie('token', token,{
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      })
      .send({success: true})
    })
    // logout and clear the cookie
    app.post('/logout', async (req, res) => {
      const user = req.body
      res.
      clearCookie('token', {maxAge: 0})
      .send({success: true})
    })
   
    app.post('/foods', async (req, res) => {
      const query = req.body
      const result = await foodCollection.insertOne(query)
      res.send(result);
    })
     // Route to get all food items and search for food
  app.get('/foods', async (req, res) => {
  try {
    const donatorEmail = req.query.donatorEmail;
    const foodName = req.query.foodName;

    let result;
    if (donatorEmail) {
      result = await foodCollection.find({ donatorEmail: donatorEmail }).toArray();
    } else if (foodName) {
      result = await foodCollection.find({ foodName: { $regex: foodName, $options: 'i' } }).toArray();
    } else {
      result = await foodCollection.find().toArray();
    }

    res.send(result);
  } catch (error) {
    console.error('Error fetching food items:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

   
   
    // find food id wise from database
    app.get('/foods/:id', async (req, res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await foodCollection.findOne(query)
      res.send(result)
    })
    
    // delete data from database id wise
    app.delete('/foods/:id', async (req, res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await foodCollection.deleteOne(query)
      res.send(result)
    })
    // update food data 
    app.put('/foods/:id', async (req, res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const update = req.body
      const options = {upsert: true}
      const updateFood = {
        $set: {
          foodImage: update.foodImage,
        foodName: update.foodName,
        quantity: update.quantity,
        pickupLocation: update.pickupLocation,
        expiredDateTime: update.expiredDateTime,
        additionalNotes: update.additionalNotes,
        }
      }
      const result = await foodCollection.updateOne(query,updateFood,options)
      res.send(result)
    })

    // post food request 
    app.post('/request', async (req, res) => {
      const query = req.body
      const result = await requestCollection.insertOne(query)
      res.send(result)
    })
    // get email wise data
    app.get('/request',verifyToken, async (req, res) => {
      const requestUserEmail = req.query?.requestUserEmail
      const donatorEmail = req?.query?.donatorEmail
      if(requestUserEmail) {
        if(req?.query?.requestUserEmail !== req?.user?.email){
          return res.status(403).send({message: 'forbidden access'})
        }
        const result = await requestCollection.find({requestUserEmail: requestUserEmail}).toArray()
        res.send(result)
      } else if(donatorEmail){
        if(req?.query?.donatorEmail !== req?.user?.email){
          return res.status(403).send({message: 'forbidden access'})
        }
      const result = await requestCollection.find({donatorEmail: donatorEmail}).toArray()
      res.send(result)
      }
    })
    // update status
    app.patch('/foods/:id', async (req,res) => {
      const id = req.params.id
      const filter = {_id: new ObjectId(id)}
      const options = {upsert: true}
      const update = req.body
      const updateStatus = {
        $set: {
          status: update.status,
        }
      }
      const result = await foodCollection.updateOne(filter, updateStatus,options)
      res.send(result)
    })
    // app.get('/request', async (req, res) => {
    //   const donatorEmail = req?.query?.donatorEmail
    //   const result = await requestCollection.find({donatorEmail: donatorEmail}).toArray()
    //   res.send(result)
    // })
    app.post('/contact', async(req, res) => {
      const query = req.body
      const result = await contactCollection.insertOne(query)
      res.send(result)
    })
 } finally {
 
  }
}
run().catch(console.dir);




app.get('/', async (req,res) => {
    res.send('server start')
})

app.listen(port, async () => {
    console.log(`Listening on ${port}`)
})