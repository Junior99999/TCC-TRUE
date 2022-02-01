const express = require('express')
const app = express()
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var path = require('path')

//CONFIGURAÇÃO DO SISTEMA\\

app.use(cookieParser())

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:false}))

app.set("view engine", "ejs")

app.use(express.static(path.join(__dirname,"public")))

//ROTAS PARA EJS\\

app.get('/', function(req,res){
    res.render('index.ejs',{})
})

app.get('/usuarios', function(req,res){
    res.render('usuarios.ejs',{usuarios:[
        {nome:'Junior',email:'juniormachdo11@gmail.com'},
        {nome:'Adm',email:'adm@gmail.com'}
    ]})
})

app.listen(3000, function(){
    console.log("Conexão inicializada na porta 3000")
    }  
)