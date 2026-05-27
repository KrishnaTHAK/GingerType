const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

const sendVerificationEmail = async (email, username, token) => {
    // ✅ Points to backend API directly (no frontend page needed)
    const verifyUrl = `${process.env.BACKEND_URL}/api/auth/verify/${token}`
    await transporter.sendMail({
        from: `"GingerType" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verify your GingerType account',
        html: `
            <h2>Hey ${username}!</h2>
            <p>Thanks for registering on GingerType. Click below to verify your email:</p>
            <a href="${verifyUrl}">Verify Email</a>
            <p>This link expires in 1 hour.</p>
        `
    })
}

const sendPasswordResetEmail = async (email, username, token) => {
    // ✅ Points to frontend reset page (which will call the backend)
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`
    await transporter.sendMail({
        from: `"GingerType" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Reset your GingerType password',
        html: `
            <h2>Hey ${username}!</h2>
            <p>Click below to reset your password:</p>
            <a href="${resetUrl}">Reset Password</a>
            <p>This link expires in 1 hour.</p>
        `
    })
}

const sendLeaderboardBeatenEmail = async (email, username, beatenBy, newWPM) => {
    await transporter.sendMail({
        from: `"GingerType" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'You have been beaten on the GingerType leaderboard!',
        html: `
            <h2>Hey ${username}!</h2>
            <p><b>${beatenBy}</b> just beat your score with <b>${newWPM} WPM</b>!</p>
            <p>Time to get back on the keyboard and reclaim your spot!</p>
            <a href="${process.env.FRONTEND_URL}">Play GingerType</a>
        `
    })
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendLeaderboardBeatenEmail }