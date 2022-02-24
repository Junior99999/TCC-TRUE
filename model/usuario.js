var conexao = require('../config/conexao')

var UsuarioSchema = conexao.Schema({
    nome:{type:String},
    email:{type:String},
    senha:{type:String},
    numero:{type:String},
    cpf:{type:String}
})

module.exports = conexao.model("Usuario", UsuarioSchema)