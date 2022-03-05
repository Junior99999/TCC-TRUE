
exports.autenticacaoAdm= function autenticacaoAdm(){
    return function(req, res, next){
        if(req.isAuthenticated()){
            return next()
        }
        res.redirect('/admlogin')
    }
}