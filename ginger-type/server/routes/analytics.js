const express = require('express')
const router = express.Router()
const Result = require('../models/Result')
const mongoose = require('mongoose')

// WPM + accuracy trend (last 20 results)
router.get('/trend', async (req, res) => {
    const results = await Result.find({ userId: req.user.userId })
        .sort({ createdAt: -1 })
        .limit(20)
        .select('wpm accuracy createdAt')

    res.json(results.reverse())
})

// consistency score
router.get('/consistency', async (req, res) => {
    const results = await Result.find({ userId: req.user.userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('wpm')

    if (results.length < 2)
        return res.json({ consistency: 100, message: 'Not enough data' })

    const wpms = results.map(r => r.wpm)
    const avg = wpms.reduce((a, b) => a + b, 0) / wpms.length
    const stdDev = Math.sqrt(wpms.reduce((sum, w) => sum + Math.pow(w - avg, 2), 0) / wpms.length)
    const consistency = Math.max(0, Math.round(100 - stdDev))

    res.json({ consistency, avgWPM: Math.round(avg), stdDev: Math.round(stdDev) })
})

// performance by duration
router.get('/by-duration', async (req, res) => {
    const data = await Result.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(req.user.userId) } },
        { $group: {
            _id: '$duration',
            avgWPM: { $avg: '$wpm' },
            avgAccuracy: { $avg: '$accuracy' },
            totalTests: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
    ])

    res.json(data.map(d => ({
        duration: d._id,
        avgWPM: Math.round(d.avgWPM),
        avgAccuracy: Math.round(d.avgAccuracy),
        totalTests: d.totalTests
    })))
})

// most mistaken characters
router.get('/mistakes', async (req, res) => {
    const results = await Result.find({ userId: new mongoose.Types.ObjectId(req.user.userId) })
        .select('mistakes')

    const combined = {}
    for (const result of results) {
        if (!result.mistakes) continue
        for (const [char, count] of Object.entries(result.mistakes)) {
            combined[char] = (combined[char] || 0) + count
        }
    }

    const sorted = Object.entries(combined)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([char, count]) => ({ char, count }))

    res.json(sorted)
})

// best time of day
router.get('/best-time', async (req, res) => {
    const results = await Result.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(req.user.userId) } },
        { $group: {
            _id: { $hour: '$createdAt' },
            avgWPM: { $avg: '$wpm' },
            totalTests: { $sum: 1 }
        }},
        { $sort: { avgWPM: -1 } }
    ])

    res.json(results.map(r => ({
        hour: r._id,
        avgWPM: Math.round(r.avgWPM),
        totalTests: r.totalTests
    })))
})

module.exports = router