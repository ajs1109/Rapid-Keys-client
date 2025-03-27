import mongoose, { Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// Create an interface representing the document
interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  highScore: number;
  gamesPlayed: number;
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
  highestAccuracy: { type: Number, default: 0 }
}, { timestamps: true });

// Add pre-save middleware
userSchema.pre('save', async function(this: IUser, next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Create and export the model
const UserModel = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export default UserModel;