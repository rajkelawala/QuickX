const express = require('express');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// MongoDB URI
const uri = "mongodb+srv://pubgpro7848:tQnky6Q2IbN0I1qT@cluster0.c9a54g3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        console.log("Connected successfully to MongoDB Atlas");
        const db = client.db("quickx");
        const users = db.collection("users");

        // POST endpoint for user registration
        app.post('/register', async (req, res) => {
            const { name, email, password } = req.body;

            try {
                // Check if user already exists
                const existingUser = await users.findOne({ email: email });
                if (existingUser) {
                    return res.status(400).json({ message: 'User already exists' });
                }

                // Hash password
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);

                // Insert new user
                const result = await users.insertOne({
                    name: name,
                    email: email,
                    password: hashedPassword
                });

                if(result.acknowledged) {
                    res.status(201).json({ message: 'User registered successfully', redirect: '/login.html' });
                } else {
                    res.status(500).json({ message: 'Failed to register user', redirect: '/register.html' });
                }
            } catch (err) {
                console.error(err);
                res.status(500).json({ message: 'Server error', error: err });
            }
        });

        // Login Endpoint
        app.post('/login', async (req, res) => {
            const { email, password } = req.body;

            try {
                // Retrieve user by email
                const user = await users.findOne({ email });
                if (!user) {
                    return res.status(400).json({ message: 'User not found' });
                }

                // Compare hashed passwords
                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) {
                    return res.status(400).json({ message: 'Invalid credentials' });
                }

                res.status(200).json({ message: 'Login successful', redirect: '/dashboard.html', username: user.name });
            } catch (err) {
                console.error('Error during login:', err);
        res.status(500).json({ message: 'Server error', error: err.toString() });
            }
        });


        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
        });

    } finally {
        // Optionally add something here for when the connection needs to be closed, or just keep it open as you have
    }
}

run().catch(console.error);
