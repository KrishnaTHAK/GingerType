const nodemailer = require('nodemailer')

const emailUser = process.env.EMAIL_USER 
    ? (process.env.EMAIL_USER.includes('@') ? process.env.EMAIL_USER : `${process.env.EMAIL_USER}@gmail.com`)
    : ''

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: emailUser,
        pass: process.env.EMAIL_PASS
    }
})

const getBackendUrl = () => process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 8080}`
const getFrontendUrl = () => process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173'

const sendVerificationEmail = async (email, username, token) => {
    // Points to backend API verification endpoint
    const verifyUrl = `${getBackendUrl()}/api/auth/verify/${token}`
    await transporter.sendMail({
        from: `"GingerType" <${emailUser || 'noreply@gingertype.com'}>`,
        to: email,
        subject: 'Verify your GingerType account',
        html: `
            <h2>Hey ${username}!</h2>
            <p>Thanks for registering on GingerType. Click below to verify your email:</p>
            <p><a href="${verifyUrl}" style="padding: 10px 18px; background-color: #f59e0b; color: #1e1e1e; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Email</a></p>
            <p>Or copy this link to your browser: ${verifyUrl}</p>
            <p>This link expires in 1 hour.</p>
        `
    })
}

const sendPasswordResetEmail = async (email, username, token) => {
    // Points to frontend reset page
    const resetUrl = `${getFrontendUrl()}/reset-password/${token}`
    await transporter.sendMail({
        from: `"GingerType" <${emailUser || 'noreply@gingertype.com'}>`,
        to: email,
        subject: 'Reset your GingerType password',
        html: `
            <h2>Hey ${username}!</h2>
            <p>Click below to reset your password:</p>
            <p><a href="${resetUrl}" style="padding: 10px 18px; background-color: #f59e0b; color: #1e1e1e; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a></p>
            <p>Or copy this link to your browser: ${resetUrl}</p>
            <p>This link expires in 1 hour.</p>
        `
    })
}

const sendLeaderboardBeatenEmail = async (email, username, beatenBy, newWPM) => {
    await transporter.sendMail({
        from: `"GingerType" <${emailUser || 'noreply@gingertype.com'}>`,
        to: email,
        subject: 'You have been beaten on the GingerType leaderboard!',
        html: `
            <h2>Hey ${username}!</h2>
            <p><b>${beatenBy}</b> just beat your score with <b>${newWPM} WPM</b>!</p>
            <p>Time to get back on the keyboard and reclaim your spot!</p>
            <a href="${getFrontendUrl()}">Play GingerType</a>
        `
    })
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendLeaderboardBeatenEmail }