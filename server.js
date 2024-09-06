const express = require('express');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const app = express();
const PORT = 3000;

// Use body-parser middleware to parse JSON requests
app.use(bodyParser.json());

// Serve static files (HTML, CSS, JS) from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function connectToMongoDB() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
    }
}

// Serve index.html on the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'WeatherApp', 'index.html'));
});

// Weather page route after successful login
app.get('/weather', async (req, res) => {
    try {
        const userEmail = req.session.user.email; // Assuming email is stored in session after login
        const database = client.db('weatherApp');
        const users = database.collection('users');

        // Fetch user city from MongoDB
        const user = await users.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Send the weather.html file and user's city as response
        res.sendFile(path.join(__dirname, 'WeatherApp', 'weather.html'), { city: user.city });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving user data', error });
    }
});

// Password reset route
app.post('/reset-password', async (req, res) => {
    const { email, dob, password, passwordConfirm } = req.body;

    // Check if all fields are filled and passwords match
    if (!email || !dob || !password || password !== passwordConfirm) {
        return res.status(400).json({ message: 'All fields are required and passwords must match.' });
    }

    try {
        const database = client.db('weatherApp');
        const users = database.collection('users');

        // Find user by email and DOB
        const user = await users.findOne({ email, dob });
        if (!user) {
            return res.status(404).json({ message: 'User not found or incorrect details.' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update the user's password
        await users.updateOne({ email }, { $set: { password: hashedPassword } });

        res.status(200).json({ message: 'Password updated successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error resetting password', error });
    }
});

// Signup route
app.post('/signup', async (req, res) => {
    const { firstName, lastName, city, dob, gender, email, password, passwordRepeat } = req.body;

    // Check if all fields are filled and passwords match
    // if (!firstName || !lastName || !city || !dob || !gender || !email || !password || password !== passwordRepeat) {
    //     return res.status(400).json({ message: 'All fields are required and passwords must match.' });
    // }

    try {
        const database = client.db('weatherApp');
        const users = database.collection('users');

        // Check if the email already exists
        const existingUser = await users.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists with this email.' });
        }

        // Hash password for security
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user into the database
        await users.insertOne({
            firstName,
            lastName,
            city,
            dob,
            gender,
            email,
            password: hashedPassword,
        });

        res.status(201).json({ message: 'User signed up successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error signing up user', error });
    }
});

// Get user's city (you need to have user authentication in place)
app.get('/getUserCity', async (req, res) => {
    try {
        const userEmail = req.session.user.email; // Assuming you have the user's email stored in session
        const database = client.db('weatherApp');
        const users = database.collection('users');
        
        const user = await users.findOne({ email: userEmail });
        if (user) {
            res.status(200).json({ city: user.city });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving user data', error });
    }
});


// Login route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Check if both email and password are provided
    if (!email || !password) {
        return res.status(400).json({ message: 'Both email and password are required.' });
    }

    try {
        const database = client.db('weatherApp');
        const users = database.collection('users');

        // Find user by email
        const user = await users.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Compare the provided password with the stored hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Return success message with user's details
        res.status(200).json({ 
            message: 'Login successful!', 
            user: { firstName: user.firstName, lastName: user.lastName, city: user.city } 
        });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in user', error });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    connectToMongoDB();
});
