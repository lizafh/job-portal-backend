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

// Connect once at startup
client.connect()
.then(() => console.log('MongoDB connected!'))
.catch(err => console.error('MongoDB connection error:', err));

const jobsCollection = client.db('jobPortal').collection('jobs');
const jobApplicationCollection = client.db('jobPortal').collection('job_applications');

// Middleware
const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;
    if(!token){
        return res.status(401).send({message: 'Unauthorized access'})
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if(err){
            return res.status(401).send({message: 'Unauthorize Access'})
        }
        req.user = decoded;
        next(); 
    })
}

// Auth routes
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

// Jobs routes
app.get('/jobs', async(req, res) => {
    const email = req.query.email;
    let query = {};
    if(email){
        query = {hr_email: email}
    }
    const result = await jobsCollection.find(query).toArray();
    res.send(result);
})

app.get('/jobs/:id', async(req, res) => {
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await jobsCollection.findOne(query);
    res.send(result);
})

app.post('/jobs', async(req, res) => {
    const newJob = req.body;
    const result = await jobsCollection.insertOne(newJob);
    res.send(result);
})

// Job application routes
app.get('/job-application', verifyToken, async(req, res) => {
    const email = req.query.email;
    if(req.user.email !== email){
        return res.status(403).send({message: 'forbidden access'})
    }
    const query = { applicant_email: email }
    const result = await jobApplicationCollection.find(query).toArray();

    for(const application of result){
        const query1 = { _id: new ObjectId(application.job_id) }
        const job = await jobsCollection.findOne(query1);
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
    const jobId = req.params.job_id;
    const query = {job_id: jobId}
    const result = await jobApplicationCollection.find(query).toArray();
    res.send(result);   
})

app.post('/job-applications', async(req, res) => {
    const application = req.body;
    const result = await jobApplicationCollection.insertOne(application);

    const id = application.job_id;
    const query = {_id: new ObjectId(id)}
    const job = await jobsCollection.findOne(query);
    let newCount = job.applicationCount ? job.applicationCount + 1 : 1;

    await jobsCollection.updateOne(
        {_id: new ObjectId(id)},
        {$set: {applicationCount: newCount}}
    );
    res.send(result);
});

app.patch('/job-applications/:id', async(req, res) => {
    const id = req.params.id;
    const data = req.body;
    const filter = {_id: new ObjectId(id)};
    const updateDoc = { $set: { status: data.status } }
    const result = await jobApplicationCollection.updateOne(filter, updateDoc);
    res.send(result)
})

app.get('/', (req, res) => {
    res.send('Jobs portal server is running');
})

app.listen(port, () => {
    console.log(`Job portal server running on port: ${port}`);
})