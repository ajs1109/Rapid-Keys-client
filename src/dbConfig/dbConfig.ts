import { MONGO_URI } from '@/config';
import mongoose from 'mongoose';

export async function connect() {
    try {
        mongoose.connect(MONGO_URI);
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