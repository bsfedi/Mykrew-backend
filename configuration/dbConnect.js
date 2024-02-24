
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
const service = require("../services/logAwesome")
 

const connectDB = async () => {
    
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
        });
       
        service.displayProjectName()
        console.log("data base connected...");
    } catch (error) {
        console.log(error);
    }
};

module.exports = connectDB;
