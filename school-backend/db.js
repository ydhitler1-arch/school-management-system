const mongoose = require('mongoose');

const connectDB = async () => {
    const uri = process.env.MONGO_URI;

    if (!uri) {
        console.error(
            "MONGO_URI is not set. Create a .env file in school-backend/ " +
            "(see .env.example) with your MongoDB connection string."
        );
        process.exit(1);
    }

    try {
        await mongoose.connect(uri);
        console.log("MongoDB Connected");
    } catch (err) {
        console.error("MongoDB connection failed:", err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
