import { MONGO_URI } from "@/config";
import { connect } from "mongoose";
import mongoose from "mongoose";

class DbConfig {
  private instance: mongoose.Mongoose | null = null;
  constructor() {
    // Private constructor to prevent instantiation
  }
  public async connect() {
    try {
      if (this.instance) {
        return;
      }
      this.instance = await connect(MONGO_URI);
      this.instance.connection.on("connected", () => {
        console.log("MongoDB connected successfully");
      });

      this.instance.connection.on("error", (error) => {
        console.log("MongoDB connection failed", error);
      });
    } catch (error) {
      console.log("Something went wrong with the connection!");
      console.log(error);
    }
  }

  public disconnect() {
    try {
      if (this.instance) {
        this.instance.connection.close();
        this.instance = null;
        console.log("MongoDB disconnected successfully");
      } else {
        console.log("MongoDB already disconnected");
      }
    } catch (error) {
      console.log("MongoDB disconnection failed", error);
    }
  }
}

export const dbConfig = new DbConfig();
