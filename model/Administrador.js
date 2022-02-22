var conexao = require('../config/conexao')

var AdmSchema = conexao.Schema({
    nome:{type:String},
    email:{type:String},
    senha:{type:String}
})

module.exports = conexao.model("Adm", AdmSchema)