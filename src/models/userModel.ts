import mongoose, { Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// Create an interface representing the document
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  highestWPM: number;
  highestAccuracy: number;
  gamesPlayed: number;
  friends: mongoose.Types.ObjectId[];
  friendRequests: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// Create the schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: [true, "Please provide an email"], unique: true },
  password: { type: String, required: [true, "Please provide a password"] },
  highestWPM: { type: Number, default: 0 },
  gamesPlayed: { type: Number, default: 0 },
  highestAccuracy: { type: Number, default: 0 },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
  friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
}, { timestamps: true });

// Add pre-save middleware
userSchema.pre('save', async function(this: IUser, next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Create and export the model
// Deleting the cached model forces Mongoose to recompile with the current schema.
// In Next.js dev, hot-reload keeps the mongoose global alive between module
// re-evaluations, so mongoose.models.User may reference an older schema.
if (mongoose.models['User']) {
  delete mongoose.models['User'];
}
const UserModel = mongoose.model<IUser>('User', userSchema);
export default UserModel;