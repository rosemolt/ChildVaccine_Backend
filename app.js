const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Parent = require("./models/Parent");
const Doctor = require("./models/Doctor");
const Child = require("./models/Child");
const Supplement = require("./models/Supplement");

const app = express()
app.use(cors())
app.use(express.json())

mongoose.connect("mongodb+srv://rosemol:rosemol1t@cluster0.4vxoeox.mongodb.net/vaccinedb?retryWrites=true&w=majority&appName=Cluster0").then(async () => {
    console.log('Connected to MongoDB');
})

app.post('/registerParent', async (req, res) => {
    const { name, address, phoneno, email, password } = req.body;

    try {
        // Check if parent already exists
        const existingParent = await Parent.findOne({ email });
        if (existingParent) {
            return res.status(400).json({ status: 'Parent already registered with this email' });
        }

        // Hash password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new parent (parentid will be auto-generated in the model)
        const newParent = new Parent({
            name,
            address,
            phoneno,
            email,
            password: hashedPassword
        });

        await newParent.save();

        res.status(201).json({ status: 'Parent registered successfully', parentid: newParent.parentid });

    } catch (err) {
        res.status(500).json({ status: 'Server error', error: err.message });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        //Admin Login
        if (username === "admin@gmail.com" && password === "admin") {
            const token = jwt.sign({ role: "admin" }, "Vaccine-app", { expiresIn: "120d" });
            return res.status(200).json({ status: "Admin login successful", token, role: "admin" });
        }

        // Doctor Login
        if (username === "doctor@gmail.com" && password === "doctor") {
            const token = jwt.sign({ role: "doctor"}, "Vaccine-app", { expiresIn: "120d" });
            return res.status(200).json({ status: "Doctor login successful", token, role: "doctor" });
        }

        // Parent Login
        const parent = await Parent.findOne({ email: username });
        if (parent) {
            const isMatch = await bcrypt.compare(password, parent.password);
            if (!isMatch) {
                return res.status(401).json({ status: "Invalid username or password" });
            }

            // Generate token and login
            const token = jwt.sign({ role: "parent", id: parent._id }, "Vaccine-app", { expiresIn: "120d" });
            return res.status(200).json({ status: "Parent login successful", token, role: "parent" });
        }

        //If No User Found
        return res.status(401).json({ status: "Invalid username or password" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "Server error",error: err.message });
    }
});

const authenticateParent = (req, res, next) => {
    const token = req.headers.token; // Extract token from headers

    if (!token) {
        return res.status(403).json({ status: "No token provided" });
    }

    jwt.verify(token, "Vaccine-app", (error, decoded) => {
        if (error || !decoded || decoded.role !== "parent" || !decoded.id) {
            return res.status(403).json({ status: "Invalid Authentication" });
        }

        req.parentId = decoded.id; // Store parent ID for further use
        next();
    });
};

// API to view parent profile
app.get("/viewParentProfile", authenticateParent, async (req, res) => {
    try {
        const parent = await Parent.findById(req.parentId).select("-password"); // Exclude password for security

        if (!parent) {
            return res.status(404).json({ status: "Parent not found" });
        }

        res.status(200).json({ status: "Profile fetched successfully", parent });
    } catch (error) {
        res.status(500).json({ status: "Error fetching profile", error: error.message });
    }
});

app.put("/updateParentProfile", authenticateParent, async (req, res) => {
    try {
        const { name, address, phoneno, email } = req.body;

        // Find the parent by ID and update only provided fields
        const updatedParent = await Parent.findByIdAndUpdate(
            req.parentId,
            { name, address, phoneno, email },
            { new: true, runValidators: true } // Return updated document & validate fields
        ).select("-password"); // Exclude password from response

        if (!updatedParent) {
            return res.status(404).json({ status: "Parent not found" });
        }

        res.status(200).json({ status: "Profile updated successfully", parent: updatedParent });
    } catch (error) {
        res.status(500).json({ status: "Error updating profile", error: error.message });
    }
});


app.post('/add-child', authenticateParent, async (req, res) => {
    try {
        // Find parent details using parentId stored in token
        const parent = await Parent.findById(req.parentId);
        if (!parent) {
            return res.status(400).json({ status: "Parent not found" });
        }

        const { name, dob, gender, bloodgroup } = req.body;

        // Create new child entry using parent's `parentid`
        const newChild = new Child({
            parentid: parent.parentid, // Auto-filled from parent details
            name,
            dob,
            gender,
            bloodgroup
        });

        await newChild.save();

        res.status(201).json({ status: "Child added successfully", child: newChild });
    } catch (error) {
        res.status(500).json({ status: "Error adding child", error: error.message });
    }
});

// Route to get details of all children added by a parent
app.get('/view-children', authenticateParent, async (req, res) => {
    try {
        // Find the parent using the MongoDB _id
        const parent = await Parent.findById(req.parentId);
        if (!parent) {
            return res.status(400).json({ status: "Parent not found" });
        }

        // Now use parent.parentid (the custom 'P001' format) to find children
        const children = await Child.find({ parentid: parent.parentid });

        if (children.length === 0) {
            return res.status(404).json({ status: "No children found" });
        }

        res.status(200).json({ status: "Children details retrieved successfully", children });
    } catch (error) {
        res.status(500).json({ status: "Error retrieving children details", error: error.message });
    }
});

// Middleware to verify token and admin role
const verifyAdmin = (req, res, next) => {
    const token = req.headers["authorization"];
    if (!token) {
      return res.status(401).json({ message: "Authorization token required" });
    }
  
    jwt.verify(token, "Vaccine-app", (err, decoded) => {
      if (err || decoded.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin only" });
      }
      next();
    });
  };
  
  // Route to add a supplement (only accessible by admin)
  app.post("/addSupplement", verifyAdmin, async (req, res) => {
    const { name, category, description, agegroup, dosage } = req.body;
  
    // Generate a unique supplement ID (for example, using Date.now())
    const supplementid = `SUP-${Date.now()}`;
  
    try {
      const newSupplement = new Supplement({
        supplementid,
        name,
        category,
        description,
        agegroup,
        dosage,
      });
  
      await newSupplement.save();
  
      res.status(201).json({ message: "Supplement added successfully", supplement: newSupplement });
    } catch (error) {
      res.status(500).json({ message: "Error adding supplement", error });
    }
  });


app.listen(8080,()=>{
    console.log("server started")
})