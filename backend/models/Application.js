const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    jobSnippet: String,
    dateApplied: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Application', applicationSchema);
