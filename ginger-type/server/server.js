require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const bcrypt = require('bcrypt')
const User = require('./models/User')
const Result = require('./models/Result')
const upload = require('./config/cloudinary')
const crypto = require('crypto')
const { sendVerificationEmail, sendPasswordResetEmail, sendLeaderboardBeatenEmail } = require('./config/nodemailer')

const app = express()
app.use(express.json())
app.use(cors())

// connect to mongodb
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err))

const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]
    if (!token) return res.status(401).json({ message: 'No token provided' })

    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err) return res.status(403).json({ message: 'Invalid or expired token' })
        req.user = payload
        next()
    })
}

// register
// update register route to send verification email
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body
    if (await User.findOne({ $or: [{ email }, { username }] }))
        return res.status(400).json({ message: 'User already exists' })

    const hashedPassword = await bcrypt.hash(password, 10)
    const verificationToken = crypto.randomBytes(32).toString('hex')

    await User.create({ username, email, password: hashedPassword, verificationToken })
    await sendVerificationEmail(email, username, verificationToken)

    res.status(201).json({ message: 'User registered! Please verify your email.' })
})


// verify email
app.get('/api/auth/verify/:token', async (req, res) => {
    const user = await User.findOneAndUpdate(
        { verificationToken: req.params.token },
        { isVerified: true, verificationToken: null },
        { new: true }
    )
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' })
    res.json({ message: 'Email verified successfully!' })
})


// login
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body
    const user = await User.findOne({ username })

    if (!user || !(await bcrypt.compare(password, user.password)))
        return res.status(400).json({ message: 'Invalid username or password' })

    const token = jwt.sign(
        { userId: user._id.toString(), username: user.username },  // add .toString()
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    )
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } })
})

// forgot password
app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ message: 'User not found' })

    const resetToken = crypto.randomBytes(32).toString('hex')
    await User.findByIdAndUpdate(user._id, {
        resetToken,
        resetTokenExpiry: Date.now() + 3600000 // 1 hour
    })

    await sendPasswordResetEmail(email, user.username, resetToken)
    res.json({ message: 'Password reset email sent!' })
})

// reset password
app.post('/api/auth/reset-password/:token', async (req, res) => {
    const { password } = req.body
    const user = await User.findOne({
        resetToken: req.params.token,
        resetTokenExpiry: { $gt: Date.now() }
    })
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' })

    const hashedPassword = await bcrypt.hash(password, 10)
    await User.findByIdAndUpdate(user._id, {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
    })
    res.json({ message: 'Password reset successfully!' })
})

// profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
    const user = await User.findById(req.user.userId).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
})

// result
app.post('/api/results', authenticateToken, async (req, res) => {
    const { wpm, accuracy, duration, mode } = req.body
    const result = await Result.create({ userId: req.user.userId, wpm, accuracy, duration, mode })

    const currentUser = await User.findById(req.user.userId)

    if (wpm > currentUser.bestWPM) {
        // find users who will be beaten
        const beatenUsers = await User.find({
            bestWPM: { $gt: currentUser.bestWPM, $lte: wpm },
            _id: { $ne: currentUser._id }
        })

        // notify each beaten user
        for (const u of beatenUsers) {
            await sendLeaderboardBeatenEmail(u.email, u.username, currentUser.username, wpm)
        }

        await User.findByIdAndUpdate(currentUser._id, { $max: { bestWPM: wpm } })
    }

    res.status(201).json(result)
})

// upload avatar
app.post('/api/auth/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })

    const user = await User.findByIdAndUpdate(
        req.user.userId,
        { avatarUrl: req.file.path },
        { new: true }
    ).select('-password')

    res.json({ message: 'Avatar updated successfully', avatarUrl: user.avatarUrl })
})


// result history
app.get('/api/results', authenticateToken, async (req, res) => {
    const results = await Result.find({ userId: req.user.userId }).sort({ createdAt: -1 })
    res.json(results)
})


// leaderboard  --> GENERAL
app.get('/api/leaderboard', async (req, res) => {
    const leaderboard = await User.find({ bestWPM: { $gt: 0 } })
        .select('username bestWPM')
        .sort({ bestWPM: -1 })
        .limit(10)
    
    res.json(leaderboard)
})


// logged-in user's rank
app.get('/api/leaderboard/rank', authenticateToken, async (req, res) => {
    const user = await User.findById(req.user.userId)

    const rank = await User.countDocuments({ bestWPM: { $gt: user.bestWPM } })

    res.json({ username: user.username, bestWPM: user.bestWPM, rank: rank + 1 })
})


// Leaderboard - filtered by duration (15, 30, 60)
app.get('/api/leaderboard/:duration', async (req, res) => {
    const duration = parseInt(req.params.duration)

    const top = await Result.aggregate([
        { $match: { duration } },
        { $group: { _id: '$userId', bestWPM: { $max: '$wpm' } } },
        { $sort: { bestWPM: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { _id: 0, username: '$user.username', bestWPM: 1 } }
    ])

    res.json(top)

})


// user stats
app.get('/api/stats', authenticateToken, async (req, res) => {
    const results = await Result.find({ userId: req.user.userId })

    if (results.length === 0) return res.json({ totalTests: 0, bestWPM: 0, avgWPM: 0, avgAccuracy: 0 })
    
    const totalTests = results.length
    const bestWPM = Math.max(...results.map(r => r.wpm))
    const avgWPM = Math.round(results.reduce((sum, r) => sum + r.wpm, 0)/totalTests)
    const avgAccuracy = Math.round(results.reduce((sum, r) => sum + r.accuracy, 0)/totalTests) 
        
    res.json({ totalTests, bestWPM, avgWPM, avgAccuracy })
    
})








app.listen(process.env.PORT, () => console.log(`Auth server running on http://localhost:${process.env.PORT}`))