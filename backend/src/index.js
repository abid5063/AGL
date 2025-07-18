import express from "express";
import "dotenv/config";
import cors from "cors"; // Changed from require() to import
import authRoutes from "./routes/authRoutes.js";
import animalRoutes from "./routes/animalRoutes.js";
import vaccineRoutes from "./routes/vaccineRoutes.js";
import { connectDB } from "./lib/db.js";

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
// Allow multiple origins during development
const allowedOrigins = [
  'http://localhost:19006', // Expo web
  'http://localhost:8081',  // React Native debugger
  'http://localhost:3000',  // Your backend (for testing)
  'exp://192.168.x.xx:19000' // Your device IP (replace x.xx)
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    const msg = `CORS policy: ${origin} not allowed`;
    return callback(new Error(msg), false);
  },
  credentials: true, // If using cookies/sessions
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/animals", animalRoutes);
app.use("/api/vaccines", vaccineRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});