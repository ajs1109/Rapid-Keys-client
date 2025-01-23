import mongoose from "mongoose";

export const dbConnect = async () => {
    try {
        const { connection } = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/typing_game', {
            dbName: process.env.MONGO_DB_NAME || 'RapidKeys'
        });
        console.log('db connected');
    } catch (error) {
        console.log('could not connect to server', error);
    }
}

export default dbConnect;