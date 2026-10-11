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
const analyticsRouter = require('./routes/analytics')
const session = require('express-session')
const passport = require('./config/passport')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')

const app = express()

// Trust first proxy if behind reverse proxy
app.set('trust proxy', 1)

app.use(express.json())
app.use(cors())
app.use(helmet())

const JWT_SECRET = process.env.JWT_SECRET || 'ginger_type_super_secret_key_2026'
const PORT = process.env.PORT || 8080
const CLIENT_URL = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173'

app.use(session({
    secret: JWT_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
}

// general rate limit for all routes
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    message: { message: 'Too many requests, please try again later.' }
})

// auth rate limit
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30,
    message: { message: 'Too many auth attempts, please try again later.' }
})

app.use(generalLimiter)
app.use(['/api/auth/login', '/auth/login'], authLimiter)
app.use(['/api/auth/register', '/auth/register'], authLimiter)
app.use(['/api/auth/forgot-password', '/auth/forgot-password'], authLimiter)

// connect to mongodb
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err))

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (!token) return res.status(401).json({ message: 'No token provided' })

    jwt.verify(token, JWT_SECRET, (err, payload) => {
        if (err) return res.status(403).json({ message: 'Invalid or expired token' })
        req.user = payload
        next()
    })
}

// Google OAuth routes
app.get(['/api/auth/google', '/auth/google'], passport.authenticate('google', { scope: ['profile', 'email'] }))

app.get(['/api/auth/google/callback', '/auth/google/callback'],
    passport.authenticate('google', { failureRedirect: '/login' }),
    asyncHandler(async (req, res) => {
        const token = jwt.sign(
            { userId: req.user._id.toString(), username: req.user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        )
        // redirect to frontend with token
        res.redirect(`${CLIENT_URL}?token=${token}`)
    })
)

// register
app.post(['/api/auth/register', '/auth/register'], asyncHandler(async (req, res) => {
    const { username, email, password } = req.body

    // 1. Validation
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email, and password are required' })
    }

    const trimmedUsername = username.trim()
    const normalizedEmail = email.trim().toLowerCase()

    if (trimmedUsername.length < 3) {
        return res.status(400).json({ message: 'Username must be at least 3 characters long' })
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' })
    }

    // 2. Check for duplicate user
    const existingUser = await User.findOne({
        $or: [
            { email: normalizedEmail },
            { username: trimmedUsername }
        ]
    })

    if (existingUser) {
        return res.status(400).json({ 
            message: existingUser.email === normalizedEmail 
                ? 'An account with this email already exists' 
                : 'Username is already taken' 
        })
    }

    // 3. Hash password and generate token
    const hashedPassword = await bcrypt.hash(password, 10)
    const verificationToken = crypto.randomBytes(32).toString('hex')

    const newUser = await User.create({ 
        username: trimmedUsername, 
        email: normalizedEmail, 
        password: hashedPassword, 
        verificationToken,
        isVerified: false
    })

    // 4. Send verification email with safe error fallback
    let emailSent = false
    try {
        await sendVerificationEmail(normalizedEmail, trimmedUsername, verificationToken)
        emailSent = true
    } catch (emailErr) {
        console.error('Failed to send verification email:', emailErr.message)
        // Fallback: If email delivery fails (e.g. invalid credentials/offline dev),
        // auto-verify the user so they are not permanently locked out.
        newUser.isVerified = true
        newUser.verificationToken = null
        await newUser.save()
    }

    if (emailSent) {
        res.status(201).json({ message: 'User registered! Please verify your email.' })
    } else {
        res.status(201).json({ 
            message: 'User registered successfully! You can now log in.' 
        })
    }
}))

// verify email
app.get(['/api/auth/verify/:token', '/auth/verify/:token'], asyncHandler(async (req, res) => {
    const user = await User.findOneAndUpdate(
        { verificationToken: req.params.token },
        { isVerified: true, verificationToken: null },
        { new: true }
    )

    // if token is wrong or expired
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' })

    // redirect user back to frontend login page with success flag
    res.redirect(`${CLIENT_URL}/login?verified=true`)
}))

// resend verification email
app.post(['/api/auth/resend-verification', '/auth/resend-verification'], asyncHandler(async (req, res) => {
    const email = (req.body.email || '').trim().toLowerCase()
    if (!email) return res.status(400).json({ message: 'Email is required' })

    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ message: 'User not found' })

    if (user.isVerified) {
        return res.status(400).json({ message: 'Account is already verified. Please log in.' })
    }

    const verificationToken = crypto.randomBytes(32).toString('hex')
    user.verificationToken = verificationToken
    await user.save()

    try {
        await sendVerificationEmail(user.email, user.username, verificationToken)
        res.json({ message: 'Verification email resent! Please check your inbox.' })
    } catch (err) {
        console.error('Failed to resend verification email:', err.message)
        user.isVerified = true
        user.verificationToken = null
        await user.save()
        res.json({ message: 'Account auto-verified due to email delivery issue. You can now log in.' })
    }
}))

// login (supports username OR email)
app.post(['/api/auth/login', '/auth/login'], asyncHandler(async (req, res) => {
    const identifier = (req.body.username || req.body.email || '').trim()
    const password = req.body.password

    if (!identifier || !password) {
        return res.status(400).json({ message: 'Username/email and password are required' })
    }

    // Match by username or email
    const user = await User.findOne({
        $or: [
            { username: identifier },
            { email: identifier.toLowerCase() }
        ]
    })

    // if user doesn't exist
    if (!user) return res.status(400).json({ message: 'Invalid username or password' })

    // if signed up with Google
    if (!user.password) {
        return res.status(400).json({ message: 'This account uses Google Sign-In. Please use the Google login button.' })
    }

    // check password
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
        return res.status(400).json({ message: 'Invalid username or password' })
    }

    // check email verification
    if (!user.isVerified) {
        return res.status(400).json({ message: 'Please verify your email before logging in. Check your inbox!' })
    }

    const token = jwt.sign(
        { userId: user._id.toString(), username: user.username },
        JWT_SECRET,
        { expiresIn: '24h' }
    )
    res.json({ 
        token, 
        user: { 
            id: user._id, 
            username: user.username, 
            email: user.email,
            avatarUrl: user.avatarUrl
        } 
    })
}))

// forgot password
app.post(['/api/auth/forgot-password', '/auth/forgot-password'], asyncHandler(async (req, res) => {
    const email = (req.body.email || '').trim().toLowerCase()
    if (!email) return res.status(400).json({ message: 'Email is required' })

    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ message: 'User not found' })

    const resetToken = crypto.randomBytes(32).toString('hex')
    await User.findByIdAndUpdate(user._id, {
        resetToken,
        resetTokenExpiry: Date.now() + 3600000 // 1 hour
    })

    try {
        await sendPasswordResetEmail(email, user.username, resetToken)
        res.json({ message: 'Password reset email sent!' })
    } catch (err) {
        console.error('Failed to send reset email:', err.message)
        res.status(500).json({ message: 'Failed to send password reset email. Please try again later.' })
    }
}))

// reset password
app.post(['/api/auth/reset-password/:token', '/auth/reset-password/:token'], asyncHandler(async (req, res) => {
    const { password } = req.body
    if (!password || password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' })
    }

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
}))

// profile
app.get(['/api/auth/profile', '/auth/profile'], authenticateToken, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.userId).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
}))

// upload avatar
app.post(['/api/auth/avatar', '/auth/avatar'], authenticateToken, upload.single('avatar'), asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })

    const user = await User.findByIdAndUpdate(
        req.user.userId,
        { avatarUrl: req.file.path },
        { new: true }
    ).select('-password')

    res.json({ message: 'Avatar updated successfully', avatarUrl: user.avatarUrl })
}))

// result
app.post(['/api/results', '/results'], authenticateToken, asyncHandler(async (req, res) => {
    const { wpm, accuracy, duration, mode, mistakes } = req.body
    const result = await Result.create({ 
        userId: req.user.userId, 
        wpm, accuracy, duration, mode,
        mistakes: mistakes || {}
    })

    const currentUser = await User.findById(req.user.userId)

    if (currentUser && wpm > currentUser.bestWPM) {
        const beatenUsers = await User.find({
            bestWPM: { $gt: currentUser.bestWPM, $lte: wpm },
            _id: { $ne: currentUser._id }
        })

        for (const u of beatenUsers) {
            try {
                await sendLeaderboardBeatenEmail(u.email, u.username, currentUser.username, wpm)
            } catch (emailErr) {
                console.error('Failed to send leaderboard beaten email:', emailErr.message)
            }
        }

        await User.findByIdAndUpdate(currentUser._id, { $max: { bestWPM: wpm } })
    }

    res.status(201).json(result)
}))

// result history
app.get(['/api/results', '/results'], authenticateToken, asyncHandler(async (req, res) => {
    const results = await Result.find({ userId: req.user.userId }).sort({ createdAt: -1 })
    res.json(results)
}))

// leaderboard  --> GENERAL
app.get(['/api/leaderboard', '/leaderboard'], asyncHandler(async (req, res) => {
    const leaderboard = await User.find({ bestWPM: { $gt: 0 } })
        .select('username bestWPM')
        .sort({ bestWPM: -1 })
        .limit(10)
    
    res.json(leaderboard)
}))

// logged-in user's rank
app.get(['/api/leaderboard/rank', '/leaderboard/rank'], authenticateToken, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const rank = await User.countDocuments({ bestWPM: { $gt: user.bestWPM } })
    res.json({ username: user.username, bestWPM: user.bestWPM, rank: rank + 1 })
}))

// Leaderboard - filtered by duration (15, 30, 60)
app.get(['/api/leaderboard/:duration', '/leaderboard/:duration'], asyncHandler(async (req, res) => {
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
}))

// user stats
app.get(['/api/stats', '/stats'], authenticateToken, asyncHandler(async (req, res) => {
    const results = await Result.find({ userId: req.user.userId })

    if (results.length === 0) return res.json({ totalTests: 0, bestWPM: 0, avgWPM: 0, avgAccuracy: 0 })
    
    const totalTests = results.length
    const bestWPM = Math.max(...results.map(r => r.wpm))
    const avgWPM = Math.round(results.reduce((sum, r) => sum + r.wpm, 0)/totalTests)
    const avgAccuracy = Math.round(results.reduce((sum, r) => sum + r.accuracy, 0)/totalTests) 
        
    res.json({ totalTests, bestWPM, avgWPM, avgAccuracy })
}))

// Analytics - routes ==> trend, consistency, by-duration, mistakes, best-time
app.use(['/api/analytics', '/analytics'], authenticateToken, analyticsRouter)

// global error handler
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(err.status || 500).json({
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    })
})

app.listen(PORT, () => console.log(`Auth server running on http://localhost:${PORT}`))