var conexao = require('../config/conexao')

var DietaSchema = conexao.Schema({

    foto:{type: String}

})

module.exports = conexao.model("Dieta", DietaSchema)