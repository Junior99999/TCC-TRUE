const mongoose = require('mongoose')
const uri = "mongodb://localhost:27017/TCC"

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true})

module.exports = mongoose