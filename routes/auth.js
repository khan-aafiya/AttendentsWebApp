import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { authenticateToken } from "../middleware/auth.js"; // ✅ sirf import karo

const router = express.Router();
// const JWT_SECRET = process.env.JWT_SECRET;

// Signup
router.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const userExists = await User.findOne({ $or: [{ username }, { email }] });
        if (userExists) return res.status(400).json({ message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "User created successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// Login
router.post("/login", async (req, res) => {
    const { username, email, identifier, password } = req.body;
    const loginId = identifier || email || username;

    try {
        if (!loginId || !password) {
            return res.status(400).json({ message: "Identifier and password are required" });
        }

        const user = await User.findOne({
            $or: [{ username: loginId }, { email: loginId }]
        });

        if (!user) {
            console.log("❌ No user found for:", loginId);
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log("❌ Password mismatch for:", loginId);
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        console.log("✅ Login success for:", loginId);

        res.json({ token, username: user.username, email: user.email });
    } catch (err) {
        console.error("🔥 Login error:", err.message);  // 👉 error detail log
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Profile route
router.get("/me", authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);  // ✅ returns { username, email }
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});


export default router;
