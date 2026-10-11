const express = require('express')
const router = express.Router()
const Result = require('../models/Result')
const mongoose = require('mongoose')

const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
}

// WPM + accuracy trend (last 10 results in chronological order)
router.get('/trend', asyncHandler(async (req, res) => {
    const results = await Result.find({ userId: req.user.userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('wpm accuracy createdAt')
        .lean()

    res.json(results.reverse())
}))

// consistency score
router.get('/consistency', asyncHandler(async (req, res) => {
    const results = await Result.find({ userId: req.user.userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('wpm')
        .lean()

    if (results.length === 0) {
        return res.json({ consistency: 100, avgWPM: 0, stdDev: 0, message: 'No test data yet' })
    }

    if (results.length === 1) {
        return res.json({ consistency: 100, avgWPM: Math.round(results[0].wpm), stdDev: 0, message: 'Need at least 2 tests for consistency calculation' })
    }

    const wpms = results.map(r => r.wpm)
    const avg = wpms.reduce((a, b) => a + b, 0) / wpms.length
    const stdDev = Math.sqrt(wpms.reduce((sum, w) => sum + Math.pow(w - avg, 2), 0) / wpms.length)
    const consistency = Math.max(0, Math.round(100 - stdDev))

    res.json({ consistency, avgWPM: Math.round(avg), stdDev: Math.round(stdDev) })
}))

// performance by duration (15s, 30s, 60s, etc.)
router.get('/by-duration', asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.user.userId)) {
        return res.status(400).json({ message: 'Invalid user ID' })
    }

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
        avgWPM: Math.round(d.avgWPM || 0),
        avgAccuracy: Math.round(d.avgAccuracy || 0),
        totalTests: d.totalTests
    })))
}))

// most mistaken characters
router.get('/mistakes', asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.user.userId)) {
        return res.status(400).json({ message: 'Invalid user ID' })
    }

    const results = await Result.find({ userId: req.user.userId })
        .select('mistakes')
        .lean()

    const combined = {}
    for (const result of results) {
        if (!result.mistakes) continue
        for (const [char, count] of Object.entries(result.mistakes)) {
            const numericCount = Number(count) || 0
            combined[char] = (combined[char] || 0) + numericCount
        }
    }

    const sorted = Object.entries(combined)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([char, count]) => ({ char, count }))

    res.json(sorted)
}))

// best time of day
router.get('/best-time', asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.user.userId)) {
        return res.status(400).json({ message: 'Invalid user ID' })
    }

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
        avgWPM: Math.round(r.avgWPM || 0),
        totalTests: r.totalTests
    })))
}))

module.exports = router