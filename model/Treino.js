var conexao = require('../config/conexao')

var TreinoSchema = conexao.Schema({

    foto:{type: String}

})

module.exports = conexao.model("Treino", TreinoSchema)