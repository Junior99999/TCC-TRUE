if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config()
}
// Importações

var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var path = require('path')
var upload = require('./config/configMulter')
const express = require('express')
const { redirect } = require('express/lib/response')
const session =  require('express-session')
const flash = require('express-flash')
const passport_config = require('./config/passport-config')
const passport = require('passport')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
var Adm = require('./model/Administrador')
var Usuario = require ('./model/Usuario')
const autenticacao = require('./config/autenticacao')
const autenticacaoAdm = require('./config/autenticacaoAdm')
const methodOverride = require('method-override') 

const app = express()

//CONFIGURAÇÃO DO SISTEMA\\
app.use(express.json())
app.use(cookieParser())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:false}))
app.set("view engine", "ejs")
app.use(express.static(path.join(__dirname,"public")))
app.use(flash())
app.use(session({ 
    secret: process.env.SESSION_SECRET,
    resave:true,
    saveUninitialized:true, 
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))



//ROTAS PARA EJS\\

app.get('/',  function(req,res){
    Usuario.find({}).exec(function(err,docs){
        res.render('./newHomepage/homepage.ejs',{Usuarios:docs})
    })
    
})
app.post('/', function(req,res){
    Usuario.find({nome: new RegExp(req.body.txtPesquisa,'gi')}).exec(function(err,docs){
            res.render('index.ejs', {Usuarios: docs})
    })    
})


//ADICIONAR\\
app.get('/add', function(req,res){
    res.render('./adm/adiciona.ejs')
})

app.post('/add',upload.single("txtFoto") ,function(req,res){
    var usuario = new Usuario({
        nome: req.body.txtNome,
        email: req.body.txtEmail,
        senha: req.body.txtSenha,
        foto: req.file.filename
    })
    usuario.save(function(err){
        if(err){
            console.log(err)
        }else{
            res.redirect('/')
        }
    })
})



//DELETAR\\
app.get('/del/:id',function(req,res){
    Usuario.findByIdAndDelete(req.params.id, function(err){
        if(err){
            console.log(err)
        }else{
            res.redirect('/')
        }
    })
})



//EDITAR\\
app.get('/edit/:id', function(req,res){
    Usuario.findById(req.params.id, function(err,docs){
        if(err){
            console.log(err)
        }else{
            res.render('/adm/edita.ejs',{Usuario: docs})
        } 
    })
})

app.post('/edit/:id',upload.single("txtFoto") ,function(req,res){
    Usuario.findByIdAndUpdate(req.params.id,{
        nome: req.body.txtNome,
        email: req.body.txtEmail,
        senha: senhaHash,
        foto: req.file.filename
    },function(err,docs){
        res.redirect('/')
    })
})



//CADASTRO USUÁRIO\\
app.get('/cadastro', function(req,res){
    res.render('./homepage/cadastro.ejs',{msg : req.flash('msg')})
})
app.post('/cadastro', async (req,res) =>{

    const {txtNome, txtEmail, txtSenha, txtConfirmasenha, txtNumero, txtCPF} = req.body

    //Validações
    if(!txtNome){
        return console.log('O nome é Obrigatório')
    }if(!txtEmail){
        return console.log('O email é Obrigatório')
    }if(!txtSenha){
        return console.log('A senha é Obrigatório')
    }if(!txtCPF){
        return console.log('O CPF é Obrigatório')
    }if(!txtNumero){
        return console.log('O número é Obrigatório')
    }

    if(txtSenha !== txtConfirmasenha){
        req.flash('msg', 'As senhas não conferem!')
        return res.redirect('/cadastro')
    }

    const userExist  = await Usuario.findOne({ email: txtEmail})
    const cpfExist = await Usuario.findOne({cpf:txtCPF})
    
    if(userExist){
         req.flash('msg', 'O Email: '+ txtEmail +' já existe. Faça seu Login!')
         return res.redirect('/login')
    }if(cpfExist){  
        req.flash('msg', 'Já existe esse CPF. Faça seu Login!')
       return res.redirect('/login')
    }
    

    const salt = await bcrypt.genSalt(12)
    const senhaHash = await bcrypt.hash(txtSenha, salt)

    const user = new Usuario({
        nome: req.body.txtNome,
        email: req.body.txtEmail,
        cpf: req.body.txtCPF,
        senha: senhaHash,
    })
    try{
        await user.save()
        req.flash('msg',  'Você já pode se logar!')
        res.redirect('/login')
        
        
    }catch(error){
        console.log('Aconteceu um erro')
    }
})



//LOGIN USUÁRIO\\
app.get('/login', function(req,res){
    res.render('./homepage/login.ejs', {msg : req.flash('msg')})
 })
 app.post('/login',passport_config.authenticate('local', {
     successRedirect: '/usuarioindex',
     failureRedirect: '/login',
     failureFlash: true
 }))

 
 
//AMD LOGIN//
app.get('/admlogin', function(req,res){
    res.render('./adm/loginAdm.ejs')
})
app.post('/admlogin', async (req,res) =>{
    const {admEmail, admSenha} = req.body

    //Validações
    if(!admEmail){
        return console.log('O email é Obrigatório')
    }if(!admSenha){
        return console.log('A senha é Obrigatório')
    }
    //checar se existe o usuário
    const user = await Adm.findOne({ email: admEmail})
    if(!user){
        return console.log('Usuário não encontrado')
    }

    //checar se a senha confirma
    const checarSenha = await bcrypt.compare(admSenha, user.senha)

    if(!checarSenha){
        return console.log('Senha inválida')
    }
    try{

        return res.redirect('/usuarioindex')
    }catch(Error){
        console.log('Aconteceu um erro')
    }
})



//ADM CADASTRO//
app.get('/admcadastro', function(req,res){
    res.render('./adm/cadastroAdm.ejs')
})
app.post('/admcadastro', async (req,res) =>{

    const {admNome, admEmail, admSenha, admConfirmasenha} = req.body

    //Validações
    if(!admNome){
        return console.log('O nome é Obrigatório')
    }if(!admEmail){
        return console.log('O email é Obrigatório')
    }if(!admSenha){
        return console.log('A senha é Obrigatório')
    }

    if(admSenha !== admConfirmasenha){
        return console.log('A senhas não conferem')
    }

    const userExist  = await Adm.findOne({ email: admEmail})
    
    if(userExist){
        return console.log('Utilize outro email!')
    }

    const salt = await bcrypt.genSalt(12)
    const senhaHash = await bcrypt.hash(admSenha, salt)

    const user = new Adm({
        nome: req.body.admNome,
        email: req.body.admEmail,
        senha: senhaHash,
    })
    try{
        await user.save()
        console.log('Registrado com sucesso')
        return res.redirect('/')
        
    }catch(error){
        console.log('Aconteceu um erro')
    }     
})   



//Rotas ADM//
app.get('/homepageadm', function(req,res){
    res.render('./adm/homepageAdm.ejs')
})
app.post('/homepageadm', function(req,res){ 
})


//Rotas Usuário//
app.get('/usuarioindex', autenticacao.autenticacao(), function(req,res){
        res.render('./usuario/usuarioindex.ejs', { id: req.user.id ,nome:req.user.nome, email:req.user.email, senha:req.user.senha})
})

app.post('/usuarioindex', function(req,res){
   res.redirect('/edit/usuario')
})



// Rota edita USUARIO

app.get('/edita/:id',function(req,res){
    Usuario.findById(req.params.id, function(err,docs){
        res.render('./usuario/editaUsuario.ejs', {Usuarios:docs})
    })
})
app.post('/edita/:id', upload.single("txtFoto"), async function(req,res){
    Usuario.findByIdAndUpdate(req.params.id,
        {
        nome: req.body.txtNome,
        email: req.body.txtEmail,
        senha: req.body.txtSenha
    },function(err,docs){
        if(err){
            console.log(err)
        }else{
        res.redirect('/usuarioIndex')
        }
    })
})

//LOGOUT//
app.delete('/logout', function(req,res){
    req.logOut()
    res.redirect('/login')
})
app.listen(3000, function(){
    console.log("Conexão inicializada na porta 3000")
    }  
)
