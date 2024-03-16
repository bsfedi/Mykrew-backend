const express = require('express');
const app = express();
const connectDB = require("./configuration/dbConnect");
const bodyParser = require("body-parser");
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config()
const axios = require('axios');
const registrationRoutes = require("./routes/preRegistrationRoutes");
const userRoutes = require("./routes/userRoutes");
const contractRoutes = require("./routes/contractProcessRoutes");
const newMissionRoutes = require("./routes/newMissionRoutes");
const notificationRoutes = require("./routes/notificationsRoutes");
const tjmRequestRoutes = require("./routes/tjmRequestRoutes");
const virementRoutes = require("./routes/virementRoutes");

app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
const PORT = process.env.PORT || 5001;
const http = require('http');
const socketModule = require('./configuration/socketConfig.js');

const server = http.createServer(app);
const io = socketModule.initializeSocket(server);



const cron = require('node-cron');


const https = require('https');

function pingServer() {
    const url = 'https://mykrew-backend.onrender.com/';

    const req = https.get(url, (res) => {
        if (res.statusCode === 200) {
            console.log('Server pinged successfully');
        } else {
            console.error(`Server ping failed with status code: ${res.statusCode}`);
        }
    });

    req.on('error', (error) => {
        console.error('Error pinging server:', error);
    });

    req.end();
}



// Define your cron job schedule and task
cron.schedule('* * * * *', () => {
    console.log('Cron job is running...');
    pingServer()
    // Place your task here
});



const uploadFolder = './uploads';
if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder);
}
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cors());
console.log('Starting your application...');

const morgan = require('morgan');
app.use(morgan('dev'));


io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('rhNotification', (data) => {
        console.log('Received hello event:', data);
    });
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

app.get('/api/download', async (req, res) => {
    try {
        const { url } = req.query; // Extract the 'url' query parameter from the request

        if (!url) {
            return res.status(400).send('URL parameter is missing');
        }

        // Download the file from the provided URL
        const response = await axios.get(url, { responseType: 'stream' });

        // Set appropriate content type based on the file extension
        const contentType = url.endsWith('.pdf') ? 'application/pdf' : (url.endsWith('.jpg') || url.endsWith('.jpeg') ? 'image/jpeg' : 'application/octet-stream');

        // Set response headers
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', 'attachment; filename="downloaded_file"'); // Adjust filename if needed

        // Pipe the file stream to response
        response.data.pipe(res);
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).send('Error downloading file');
    }
});

app.use("/registration", registrationRoutes)
app.use("/user", userRoutes)
app.use("/contract", contractRoutes)
app.use("/newMission", newMissionRoutes)
app.use("/notification", notificationRoutes)
app.use("/tjmRequest", tjmRequestRoutes)
app.use("/virement", virementRoutes)


server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);

    connectDB();
    require('./utils/scheduleJos');
});

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

