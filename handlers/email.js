const nodemailer = require('nodemailer');
const pug = require('pug');
const juice = require('juice');
const htmlToText = require('html-to-text');
const util = require('util');
const emailConfig = require('../config/email');

async function main() {

    let testAccount = await nodemailer.createTestAccount();


    let transporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        auth: {
        user: emailConfig.user,
        pass: emailConfig.pass
        },
    });

    //generar html
    const generarHTML = (archivo, opciones = {}) => {
        const html = pug.renderFile(`${__dirname}/../views/emails/${archivo}.pug`, opciones);
        return juice(html);
    
    }


    exports.enviar = async (opciones) => {

        const html = generarHTML(opciones.archivo, opciones);
        const text = htmlToText.htmlToText(html);

        let info = await transporter.sendMail({
            from: 'Emerio <foo@emerio.com>', // sender address
            to: opciones.usuario.email, // list of receivers
            subject: opciones.subject, // Subject line
            text,
            html,
            });
        
            console.log("Message sent: %s", info.messageId);
        
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    
            const enviarEmail = util.promisify(transporter.sendMail, transporter);
            return enviarEmail.call(transporter, info)
    
    }


}




main().catch(console.error);
