const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

dotenv.config();

const app = express();
app.use(express.json());
const corsOption = {origin:"*"}
app.use(cors(corsOption));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// User schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  mobile: String,
});

const User = mongoose.model("User", userSchema);

const SECRET_KEY = process.env.JWT_SECRET;

// Link schema
const linkSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Reference to the user
    originalLink: { type: String, required: true },
    shortLink: { type: String, required: true },
    remarks: String,
    clicks: { type: Number, default: 0 },
    date: { type: String },
    timestamp: { type: String },
    ipAddress: String,
    userDevice: String,
    status: { type: String, default: "Active" },
  });
  
  const Link = mongoose.model("Link", linkSchema);
  


// Routes
// app.post("/signup", async (req, res) => {
//   const { name, email, password, mobile } = req.body;

//   try {
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const user = new User({ name, email, password: hashedPassword, mobile });
//     await user.save();
//     res.status(201).send("User registered successfully!");
//   } catch (err) {
//     res.status(400).send("Error: " + err.message);
//   }
// });

// app.post("/signup", async (req, res) => {
//     const { name, email, password, mobile } = req.body;
  
//     try {
//       const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
//       const user = new User({ name, email, password: hashedPassword, mobile });
//       await user.save(); // Save the user to the database
//       res.status(201).send("User registered successfully!");
//     } catch (err) {
//       if (err.code === 11000) {
//         // Duplicate email error
//         res.status(400).send("Email already in use");
//       } else {
//         res.status(400).send("Error: " + err.message);
//       }
//     }
//   });
 

app.post("/signup", async (req, res) => {
    const { name, email, password, mobile } = req.body;
    console.log("Signup Data:", req.body); // Debugging: Log the incoming data
  
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ name, email, password: hashedPassword, mobile });
      await user.save();
      res.status(201).send("User registered successfully!");
    } catch (err) {
      if (err.code === 11000) {
        res.status(400).send("Email already in use");
      } else {
        res.status(400).send("Error: " + err.message);
      }
    }
  });
  

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(404).send("User not found");
  
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) return res.status(401).send("Invalid credentials");
  
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
      res.status(200).json({ token });
    } catch (err) {
      res.status(500).send("Server error");
    }
  });
  
// app.post("/login", async (req, res) => {



//   const { email, password } = req.body;

//   try {
//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).send("User not found");

//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) return res.status(401).send("Invalid credentials");

//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
//     res.status(200).json({ token });
//   } catch (err) {
//     res.status(500).send("Server error");
//   }
// });

// Route to Get User Details






// app.get("/api/user", (req, res) => {
//     const authHeader = req.headers.authorization;
  
//     if (!authHeader) {
//       return res.status(401).json({ message: "Authorization header is missing" });
//     }
  
//     const token = authHeader.split(" ")[1];
  
 
//     jwt.verify(token, SECRET_KEY, (err, decoded) => {
//       if (err) {
//         return res.status(403).json({ message: "Invalid or expired token" });
//       }
  
     



      

//       res.json({
//         id: decoded._id,
//         name: decoded.name,
//         email: decoded.email,
//       });
//     });
//   });

// app.get("/api/user", (req, res) => {
//     const authHeader = req.headers.authorization;
  
//     if (!authHeader) {
//       return res.status(401).json({ message: "Authorization header is missing" });
//     }
  
//     const token = authHeader.split(" ")[1];
  
//     jwt.verify(token, SECRET_KEY, (err, decoded) => {
//       if (err) {
//         return res.status(403).json({ message: "Invalid or expired token" });
//       }
  
//       res.json({
//         id: decoded.id,
//         name: decoded.name,
//         email: decoded.email,
//       });
//     });
//   });

app.get("/api/user", async (req, res) => {
    const authHeader = req.headers.authorization;
  
    if (!authHeader) {
      return res.status(401).json({ message: "Authorization header is missing" });
    }
  
    const token = authHeader.split(" ")[1];
  
    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      const user = await User.findById(decoded.id);
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      res.json({
        id: user._id,
        name: user.name,
        email: user.email,
      });
    } catch (error) {
      console.error("Error verifying token:", error);
      return res.status(403).json({ message: "Invalid or expired token" });
    }
  });
  


  app.put("/api/user", async (req, res) => {
    const authHeader = req.headers.authorization;
  
    if (!authHeader) {
      return res.status(401).json({ message: "Authorization header is missing" });
    }
  
    const token = authHeader.split(" ")[1];
  
    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      const userId = decoded.id;
  
      const { name, email, mobile } = req.body;
  
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { name, email, mobile },
        { new: true } // Return the updated user document
      );
  
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
  
      res.json({
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        mobile: updatedUser.mobile,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  

  app.delete("/api/user", async (req, res) => {
    const authHeader = req.headers.authorization;
  
    if (!authHeader) {
      return res.status(401).json({ message: "Authorization header is missing" });
    }
  
    const token = authHeader.split(" ")[1];
  
    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      const userId = decoded.id;
  
      const deletedUser = await User.findByIdAndDelete(userId);
  
      if (!deletedUser) {
        return res.status(404).json({ message: "User not found" });
      }
  
      res.json({ message: "User account deleted successfully!" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });


  // Create a new link
app.post("/api/links", async (req, res) => {
    const { userId, originalLink, remarks, status } = req.body;
  
    try {
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const formattedTimestamp = currentDate.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
  
      // Detect user device
      const userAgent = req.headers["user-agent"];
      const userDevice = /mobile/i.test(userAgent)
        ? "Mobile"
        : /tablet/i.test(userAgent)
        ? "Tablet"
        : "Desktop";
  
      const shortLink = `https://short.ly/${Math.random().toString(36).substring(2, 8)}`;
  
      const newLink = new Link({
        userId,
        originalLink,
        shortLink,
        remarks,
        date: formattedDate,
        timestamp: formattedTimestamp,
        ipAddress: req.ip, // Use IP address from the request
        userDevice,
        status,
      });
  
      await newLink.save();
      res.status(201).json(newLink);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to create link" });
    }
  });
  
  // Fetch all links for a user
  app.get("/api/links", async (req, res) => {
    const { userId } = req.query;
  
    try {
      const links = await Link.find({ userId });
      res.status(200).json(links);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch links" });
    }
  });
  
  // Update a link
  app.put("/api/links/:id", async (req, res) => {
    const { id } = req.params;
    const { originalLink, remarks, status } = req.body;
  
    try {
      const updatedLink = await Link.findByIdAndUpdate(
        id,
        { originalLink, remarks, status },
        { new: true }
      );
  
      if (!updatedLink) {
        return res.status(404).json({ message: "Link not found" });
      }
  
      res.status(200).json(updatedLink);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to update link" });
    }
  });
  
  // Delete a link
  app.delete("/api/links/:id", async (req, res) => {
    const { id } = req.params;
  
    try {
      const deletedLink = await Link.findByIdAndDelete(id);
      if (!deletedLink) {
        return res.status(404).json({ message: "Link not found" });
      }
  
      res.status(200).json({ message: "Link deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to delete link" });
    }
  });
  
  
  
const PORT = process.env.PORT || 5009;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
