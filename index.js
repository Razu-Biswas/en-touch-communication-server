const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');

const ObjectId = require('mongodb').ObjectID;
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

const port = process.env.PORT || 5000

const app = express()
// app.use(cors());
app.use(cors({ origin: "http://localhost:3000" }))
app.use(bodyParser.json());
const uri = "mongodb+srv://db1:4aqXIqZYxht5PQ4P@cluster0.gvvjm.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
async function run(uri){
    try {
        let conection  = await client.connect() 
       let  db  = await conection.db("entouch")
        
    console.log('Database Connected')



    // admin 
    const adminsCollection = await db.collection("admin");

    app.get('/addAdmin/:email', async (req, res) => {
     try {
        const adminEmail = req.params.email
        const adminCreated = await adminsCollection.insertOne({ adminEmail });
        if (adminCreated.insertedCount > 0) {
            res.send(adminCreated.ops[0])
        }
     } catch (error) {
        res.send(error)
     }
    })

    //  users Section //

    const usersCollection = await db.collection("users");


    app.get('/allusers', async (req, res) => {
       try {
        usersCollection.find().toArray((err, items) => {
            res.send([...items]);
        });
       } catch (error) {
        res.send(error);
       }
    });

    app.get('/makeAdmin/:email', async (req, res) => {
       try {
        const email = req.params.email
        console.log(email)
        const data = await usersCollection.updateOne({ "email": email }, { $set: { "role": 'admin' } });
        res.send({ message: 'update Successfully' })
       } catch (error) {
        res.send(error)
       }
    });

    app.post('/addUser', async (req, res) => {
       try {
        const user = req.body;
        const { email } = user;
        usersCollection.findOne({ email }, (err, data) => {

            if (data) {
                const { isSignedIn, name, email, } = data;
                console.log(email)
                adminsCollection.findOne({ adminEmail: email }, (err, adminData) => {
                    if (adminData) {

                        const makeAdmin = async (email) => {
                            await usersCollection.updateOne({ "email": email }, { $set: { "role": 'admin' } })
                        }
                        makeAdmin(email);
                        const payload = {
                            isSignedIn,
                            name,
                            email,
                            role: "admin"
                        }
                        res.send(payload);
                    } else {
                        res.send(data);
                    }
                })

            } else {
                usersCollection.insertOne(user)
                    .then(result => {
                        if (result.insertedCount > 0) {
                            res.send(result.ops[0])
                        }
                    })
            }
        })
       } catch (error) {
        res.send(error)
       }

    })


    //  services Section //
    const servicesCollection = await db.collection("services");

    app.get('/services', async (req, res) => {
       try {
        servicesCollection.find().toArray((err, items) => {
            res.send([...items]);
        });
       } catch (error) {
        res.send(error)
       }
    });

    app.get('/checkout/:id', async(req, res) => {
       try {
        const id = new ObjectId(req.params.id);
        servicesCollection.find({ _id: id }).toArray((err, items) => {
            res.send(items);
        });
       } catch (error) {
        res.send(error)
       }
    });

    app.post('/addServices', async(req, res) => {
       try {
        const newServices = req.body;
        console.log(newServices);
        servicesCollection.insertOne(newServices)
            .then((result) => {
                console.log('inserted count', result.insertedCount);
                res.send(result.insertedCount > 0);
            })
       } catch (error) {
        res.send(error)
       }
    })

    // Delete Services
    app.get('/deleteService/:id', async (req, res) => {
      try {
        const id = new ObjectId(req.params.id);
        console.log(id)
        const deleteService = await servicesCollection.deleteOne({ _id: id });
        console.log(deleteService)
        if (deleteService.deletedCount > 0) {
            res.send({ message: 'Delete Successfully' })
        }
      } catch (error) {
        res.send(error)
      }
    })
    // Order Section    //

    const orderCollection = await db.collection("order");

    app.post('/saveorder', async(req, res) => {
      try {
        const newOrder = req.body;
        console.log(newOrder);
        orderCollection.insertOne(newOrder).then((result) => {
            console.log('inserted count', result.insertedCount);
            if (result.insertedCount > 0) {
                res.status(200).json(result);
            }
        });
      } catch (error) {
        res.send(error)
      }
    });

    app.get("/getOrders", async(req, res) => {

       try {
        orderCollection.find({}).toArray((err, documents) => {
            res.send(documents);
        });
       } catch (error) {
        res.send(error)
       }
    });


    // 
    app.get("/orderByEmail/:email", async(req, res) => {
       try {
        const email = req.params.email
        orderCollection.find({ email: email }).toArray((err, documents) => {
            res.send(documents);
        });
       } catch (error) {
        res.send(error)
       }
    });

    // update order status 

    app.post('/orderStatus/:id', async (req, res) => {
        try {
            const id = new ObjectId(req.params.id);
            const { status } = req.body
            console.log(status)
            await orderCollection.updateOne({ _id: id }, { $set: { "status": status } });
            res.send({ message: 'Update Successfully ' });
        } catch (err) {
            res.send(err)
        }
    });


    //  reviews section //

    const reviewsCollection = await db.collection("reviews");

    app.get("/getReviews", async (req, res) => {
      try {
        reviewsCollection.find({}).toArray((err, documents) => {
            res.send(documents);
        });
      } catch (error) {
        res.send(error)
      }
    });

    app.post("/addReviews", async(req, res) => {
     try {
        const field = req.body;
        reviewsCollection.insertMany(field).then(result => {
            res.send(result);
            console.log(result.insertedCount);
        });
     } catch (error) {
        res.send(error)
     }
    });

    app.post("/addSingleReview", async(req, res) => {
       try {
        const NewReview = req.body;
        reviewsCollection.insertOne(NewReview).then(result => {
            res.send(result.ops[0]);
        });
       } catch (error) {
        res.send(error)
       }
    });
        
    } catch (error) {
console.log(error)
    }
}


// client.connect(err => {

run()





// });


app.get('/', (req, res) => {
    res.send('Hello World! A11  ')
})
app.listen(process.env.PORT || port)