import mongoose from 'mongoose';

export async function connect() {
    try {
        mongoose.connect(process.env.MONGO_URI ||"mongodb+srv://ajiteshsr615:OIMhqwBaL0mwRWQS@cluster0.ubltt.mongodb.net/RapidKeys?retryWrites=true&w=majority&appName=Cluster0");
        const connection = mongoose.connection;

        connection.on('connected', () => {
            console.log('MongoDB connected successfully');
        });

        connection.on('error', (error) => {
            console.log('MongoDB connection failed', error);
        });
    } catch (error) {
        console.log('Something went wrong with the connection!');
        console.log(error);
    }
}