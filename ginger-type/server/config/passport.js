const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const User = require('../models/User')

passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL || `${process.env.BACKEND_URL || 'http://localhost:8080'}/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // check if user already exists with googleId
        let user = await User.findOne({ googleId: profile.id })
        if (user) return done(null, user)

        // check if user exists with same email
        user = await User.findOne({ email: profile.emails[0].value })
        if (user) {
            // merge google account with existing account
            user.googleId = profile.id
            user.isVerified = true
            if (!user.avatarUrl) user.avatarUrl = profile.photos[0].value
            await user.save()
            return done(null, user)
        }

        // create new user
        // first figure out a username from their google display name
        let baseUsername = profile.displayName.replace(/\s+/g, '').toLowerCase()
        let username = baseUsername

        // keep trying until we find a username that isn't taken
        // this handles the case where two people have the same google name
        let usernameExists = await User.findOne({ username })
        while (usernameExists) {
            // just slap a random 4-digit number at the end
            let randomNum = Math.floor(1000 + Math.random() * 9000)
            username = baseUsername + randomNum
            usernameExists = await User.findOne({ username })
        }

        user = await User.create({
            googleId:  profile.id,
            email:     profile.emails[0].value,
            username:  username,
            avatarUrl: profile.photos[0].value,
            isVerified: true
        })


        done(null, user)
    } catch (err) {
        done(err, null)
    }
}))

passport.serializeUser((user, done) => done(null, user._id))
passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id)
    done(null, user)
})

module.exports = passport