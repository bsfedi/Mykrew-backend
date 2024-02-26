const express = require('express');
const app = express();
const connectDB = require("./configuration/dbConnect");
const bodyParser = require("body-parser");
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config()
const registrationRoutes = require("./routes/preRegistrationRoutes");
const userRoutes = require("./routes/userRoutes");
const contractRoutes = require("./routes/contractProcessRoutes");
const newMissionRoutes = require("./routes/newMissionRoutes");
const notificationRoutes = require("./routes/notificationsRoutes");
const tjmRequestRoutes = require("./routes/tjmRequestRoutes");
const virementRoutes = require("./routes/virementRoutes");

app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));

const http = require('http');
const socketModule = require('./configuration/socketConfig.js');

const server = http.createServer(app);
const io = socketModule.initializeSocket(server);




const uploadFolder = './uploads';
if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder);
}
const corsOptions = {
    origin: '*'
  };
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  app.use(cors(corsOptions));

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


app.use("/registration", registrationRoutes)
app.use("/user", userRoutes)
app.use("/contract", contractRoutes)
app.use("/newMission", newMissionRoutes)
app.use("/notification", notificationRoutes)
app.use("/tjmRequest", tjmRequestRoutes)
app.use("/virement", virementRoutes)

const port = 3001;
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
   
    connectDB();
    require('./utils/scheduleJos');
});

app.get('/', (req, res) => {
    res.send('Hello, World!');
  });

