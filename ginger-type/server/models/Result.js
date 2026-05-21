const mongoose = require('mongoose')

const resultSchema = new mongoose.Schema({
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    wpm:      { type: Number, required: true },
    accuracy: { type: Number, required: true },
    duration: { type: Number, required: true },
    mode:     { type: String, default: 'classic' },
    mistakes: { type: Object, default: {} }
}, { timestamps: true })


module.exports = mongoose.model('Result', resultSchema)