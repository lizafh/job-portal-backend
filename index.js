const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://job-portal-da77d.web.app',
        'https://job-portal-da77d.firebaseapp.com'
    ],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ynyb0.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Cached connection
let isConnected = false;

async function connectDB() {
  if (!isConnected) {
    await client.connect();
    isConnected = true;
    console.log('MongoDB connected!');
  }
  return client;
}

const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;
    if(!token){
        return res.status(401).send({message: 'Unauthorized access'})
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if(err){
            return res.status(401).send({message: 'Unauthorized Access'})
        }
        req.user = decoded;
        next(); 
    })
}

app.post('/jwt', async(req, res) => {
    const user = req.body;
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '5h'});
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    }).send({ success: true });
})

app.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    }).send({success: true})
})

app.get('/jobs', async(req, res) => {
    await connectDB();
    const email = req.query.email;
    let query = {};
    if(email) query = {hr_email: email};
    const jobsCollection = client.db('jobPortal').collection('jobs');
    const result = await jobsCollection.find(query).toArray();
    res.send(result);
})

app.get('/jobs/:id', async(req, res) => {
    await connectDB();
    const jobsCollection = client.db('jobPortal').collection('jobs');
    const result = await jobsCollection.findOne({_id: new ObjectId(req.params.id)});
    res.send(result);
})

app.post('/jobs', async(req, res) => {
    await connectDB();
    const jobsCollection = client.db('jobPortal').collection('jobs');
    const result = await jobsCollection.insertOne(req.body);
    res.send(result);
})

app.get('/job-application', verifyToken, async(req, res) => {
    await connectDB();
    const jobsCollection = client.db('jobPortal').collection('jobs');
    const jobApplicationCollection = client.db('jobPortal').collection('job_applications');
    const email = req.query.email;
    if(req.user.email !== email){
        return res.status(403).send({message: 'forbidden access'})
    }
    const result = await jobApplicationCollection.find({applicant_email: email}).toArray();
    for(const application of result){
        const job = await jobsCollection.findOne({_id: new ObjectId(application.job_id)});
        if(job){
            application.title = job.title;
            application.location = job.location;
            application.company = job.company;
            application.company_logo = job.company_logo;
        }
    }
    res.send(result);
})

app.get('/job-applications/jobs/:job_id', async(req, res) => {
    await connectDB();
    const jobApplicationCollection = client.db('jobPortal').collection('job_applications');
    const result = await jobApplicationCollection.find({job_id: req.params.job_id}).toArray();
    res.send(result);   
})

app.post('/job-applications', async(req, res) => {
    await connectDB();
    const jobsCollection = client.db('jobPortal').collection('jobs');
    const jobApplicationCollection = client.db('jobPortal').collection('job_applications');
    const application = req.body;
    const result = await jobApplicationCollection.insertOne(application);
    const job = await jobsCollection.findOne({_id: new ObjectId(application.job_id)});
    const newCount = job.applicationCount ? job.applicationCount + 1 : 1;
    await jobsCollection.updateOne(
        {_id: new ObjectId(application.job_id)},
        {$set: {applicationCount: newCount}}
    );
    res.send(result);
});

app.patch('/job-applications/:id', async(req, res) => {
    await connectDB();
    const jobApplicationCollection = client.db('jobPortal').collection('job_applications');
    const result = await jobApplicationCollection.updateOne(
        {_id: new ObjectId(req.params.id)},
        {$set: {status: req.body.status}}
    );
    res.send(result);
})

app.get('/', (req, res) => {
    res.send('Jobs portal server is running');
})

app.listen(port, () => {
    console.log(`Job portal server running on port: ${port}`);
})