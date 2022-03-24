var conexao = require('../config/conexao')

var UsuarioSchema = conexao.Schema({
    nome:{type:String},
    categoria:{type:String},
    altura: {type:Number},
    peso:{type:Number},

    email:{type:String},
    senha:{type:String},
    numero:{type:Number},
    cpf:{type:Number},
    foto:{type: String}
})

module.exports = conexao.model("Usuario", UsuarioSchema)