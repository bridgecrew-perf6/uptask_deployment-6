const passport = require('passport');
const Usuarios = require('../models/Usuarios');
const Sequelize = require('sequelize');
const Op = Sequelize.Op
const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const enviarEmail = require('../handlers/email');

exports.autenticarUsuario = passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/iniciar-sesion',
    failureFlash: true,
    badRequestMessage: 'Ambos Campos son Obligatorios'
});

// Funcion para revisar si el usuario esta logeado

exports.usuarioAutenticado = (req,res, next) => {

    //si el usuario esta autenticado , adelante
    if(req.isAuthenticated()) {
        return next();
    }

    // sino esta autenticado, redirigir al formulario
    return res.redirect('/iniciar-sesion');

}

//funcion para cerrar sesion
exports.cerrarSesion = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/iniciar-sesion');
    })
}

//genera un token si el usuario es valido
exports.enviarToken = async (req, res) => {

    // verificar que el usuario exista
    const {email} = req.body
    const usuario = await Usuarios.findOne({where: { email }});
    console.log(email)


    // si no existe usuario
    if(!usuario) {
        req.flash('error', 'No existe esa cuenta');
        res.redirect('/reestablecer');
    }

    //usuario existe
     usuario.token = crypto.randomBytes(20).toString('hex');
     usuario.expiracion = Date.now() + 3600000;

    // guardarlos en la base de datos
    await usuario.save();

    //url de reset
    const resetUrl = `http://${req.headers.host}/reestablecer/${usuario.token}`;
    
    //enviar correo con token
    await enviarEmail.enviar({
        usuario,
        subject: 'Password Reset',
        resetUrl,
        archivo: 'reestablecer-password'
    });

    req.flash('correcto', 'Se envio un mensaje a tu correo' );
    res.redirect('/iniciar-sesion');

}

exports.validarToken = async (req, res) => {
    
    const usuario = await Usuarios.findOne({
        where: {
            token: req.params.token
        }
    });

    console.log(usuario);

    //si no encuentra el usuario
    if(!usuario){
        req.flash('error', 'No Valido');
        res.redirect('/reestablecer');
    }

    // Formulario para generar el password
    res.render('resetPassword', {
        nombrePagina: 'Reestablecer Contraseña'
    })
}

//cambia el password por uno nuevo
exports.actualizarPassword = async (req, res) => {
    const usuario = await Usuarios.findOne({
        where: {
            token: req.params.token,
            expiracion: {
                [Op.gte] : Date.now()
            }
        }
    });

    //verificamos si el usuario existe
    if(!usuario) {
        req.flash('error', 'No valido');
        res.redirect('/reestablecer');
    }

    // hashear el password

    usuario.token = null;
    usuario.expiracion = null;
    usuario.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));

    await usuario.save();

    req.flash('correcto', 'Tu password se ha modificado correctamente');
    res.redirect('/iniciar-sesion');


}

