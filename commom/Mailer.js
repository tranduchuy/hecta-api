/**
 * Created by android@3forcom on 10/18/2016.
 */


var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        type: 'OAuth2',
        user: "snowyflowervietnam.com@gmail.com",
        clientId: '822635889511-1q9ud5oj5s78p332l933p6fp2pph5303.apps.googleusercontent.com',
        clientSecret: 'YSYSKS9eN4vatkPruPQVAE9L',
        refreshToken: '1/nLxM0nfUFkQb5uij29DmHWkFO0Ej87_u7vhaN0tCvL8',
        accessToken: 'ya29.GlsGBnSdA7Twz_qs0AgP8mXna4-t6lTmMs9ip-CsPMEAT3Q-UlrDQ2MRhnabt6F2054jbn3c51f1Aih4HErmxYstP9mR0ZI6VElGh3bWzpcK1OrCpZ97c6ZzTK1D',
        expires: 12345
    }

});


var Mailer = {


    sendConfirmEmail: function (email, token) {


        var mailOptions = {
            from: 'snowyflowervietnam.com@gmail.com',
            to: email,
            subject: "Hecta Register Confirm",
            text: "http://hecta.vn/account-confirm/" + token


        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    }


}


module.exports = Mailer