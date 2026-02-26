import mongoose from 'mongoose';
import {DB_NAME} from '../constants.js';

let cached = global._mongooseCache;
if (!cached) {
    cached = global._mongooseCache = { conn: null, promise: null };
}

const connectDB=async()=>{
    // Return cached connection if available (important for serverless)
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`).then((m) => {
            console.log(`\n MongoDB connected: !! DB Host:${m.connection.host}`);
            return m;
        });
    }

    try {
        cached.conn = await cached.promise;
        return cached.conn;
    } catch(error) {
        cached.promise = null;
        console.error("Error connecting to the database:", error);
        throw error;
    }
}

export default connectDB