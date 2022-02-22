var conexao = require('../config/conexao')

var ProSchema = conexao.Schema({
    nome:{type:String},
    email:{type:String},
    senha:{type:String},
    foto:{type: String},
    proficao:{type: String}
})

module.exports = conexao.model("Proficional", ProSchema)