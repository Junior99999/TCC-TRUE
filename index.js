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
var Dieta = require('./model/Dieta')
var Treino = require('./model/Treino')
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

//ROTA SOBRE O SITE//
app.get('/sobre', (req,res) => {
    res.render('./newHomepage/sobre.ejs')
})

//ADICIONAR\\
app.get('/add', function(req,res){
    res.render('./adm/adicionaPro.ejs')
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

//CADASTRO USUÁRIO\\
app.get('/cadastro', function(req,res){
    res.render('./homepage/cadastro.ejs',{msg : req.flash('msg')})
})
app.post('/cadastro', upload.single("txtFoto") ,async (req,res) =>{

    const {txtNome, txtEmail, txtSenha, txtConfirmasenha, txtNumero, txtCPF, txtAltura,txtPeso, txtFoto} = req.body

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
        altura:req.body.txtAltura,
        peso:req.body.txtPeso,
        numero: req.body.txtNumero,
        senha: senhaHash,
        foto: req.file.filename
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

        return res.redirect('/cadastrotreinodieta')
    }catch(Error){
        console.log('Aconteceu um erro')
    }
})



//ADM CADASTRO//
app.get('/admcadastro', function(req,res){
    res.render('./adm/cadastroAdm.ejs')
})



app.post('/admcadastro', upload.single('fotoAdm') ,async (req,res) =>{

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
        foto: req.file.fieldname
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
app.get('/homepageadm', autenticacaoAdm.autenticacaoAdm(),function(req,res){
    res.render('./adm/homepageAdm.ejs')
})
app.post('/homepageadm', function(req,res){ 
})


//Rotas Usuário//
app.get('/usuarioindex', autenticacao.autenticacao(), function(req,res){
    Dieta.findOne({}).exec((err1,docs1) => {
        Treino.findOne({}).exec((err,docs2) => {
            res.render('./usuario/usuarioindex.ejs', { 
                id: req.user.id,
                nome:req.user.nome,
                email:req.user.email,
                senha:req.user.senha,
                peso:req.user.peso,
                altura:req.user.altura,
                foto:req.user.foto,
                dieta: docs1,
                treino: docs2,
            })
        })
    })
    
})

app.post('/usuarioindex', function(req,res){
   res.redirect('/edit/usuario')
})

// Rota edita USUARIO

app.get('/edita/:id', function(req,res){
    Usuario.findById(req.params.id, function(err,docs){
        res.render('./usuario/editaUsuario.ejs', {Usuarios:docs})
    })
})
app.post('/edita/:id', upload.single("txtFoto") , async function(req,res){
    const salt = await bcrypt.genSalt(12)
    const senhaHash = await bcrypt.hash(req.body.txtSenha, salt)

    Usuario.findByIdAndUpdate(req.params.id,
        {
        nome: req.body.txtNome,
        email: req.body.txtEmail,
        numero: req.body.txtNumero,
        altura:req.body.txtAltura,
        peso:req.body.txtPeso,
        foto: req.file.filename,
        senha: senhaHash
    },function(err,docs){
        if(err){
            console.log(err)
        }else{
        res.redirect('/usuarioIndex')
        }
    })
})

//CADASTRO DIETA E TREINO\\
app.get('/cadastrotreinodieta', autenticacaoAdm.autenticacaoAdm(), (req,res) => {
    Dieta.findOne({}).exec((err,docs) => {
        res.render('./adm/cadTreinoDieta.ejs', )
    })
   
})

app.post('/cadastrodieta', upload.single('dieta'), (req,res) => {
    var dieta = new Dieta({
        foto: req.file.filename
    })
    dieta.save(function(err){
        if(err){
            console.log(err)
        }else{
            res.redirect('/cadastrotreinodieta')
        }
    })
})

app.post('/cadastrotreino', upload.single('treino'),(req,res) => {
    var treino = new Treino({
        foto: req.file.filename
    })
    treino.save(function(err){
        if(err){
            console.log(err)
        }else{
            res.redirect('/cadastrotreinodieta')
        }
    })
})

//LOGOUT//
app.delete('/logout', function(req,res){
    req.logOut()
    res.redirect('/')
})
app.listen(3000, function(){
    console.log("Conexão inicializada na porta 3000")
    }  
)
