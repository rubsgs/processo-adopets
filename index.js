const fs = require("fs").promises;
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;
const Usuario = require("./classes/User");
const Produto = require("./routes/Produtos");
const winston = require("winston");
const {combine, timestamp, label, printf} = winston.format;

const port = 3000;
const app = express();

//configurações de log
const winstonFormat = printf(({level, message, label, timestamp}) => {
    return `${timestamp} [${label}] ${level} ${message}`;
});
global.logger = winston.createLogger({
    "level": "silly",
    "transports": [
        new (winston.transports.Console)(),
        new (winston.transports.File)({"filename":"general-log.log"})
    ],
    format: combine(
        label({"label": "projeto-adopets"}),
        timestamp(),
        winstonFormat
    )
});

global.errorLogger = winston.createLogger({
    "level": "error",
    "transports": [
        new (winston.transports.Console)(),
        new (winston.transports.File)({"filename":"error-log.log"})
    ],
    format: combine(
        label({"label": "projeto-adopets"}),
        timestamp(),
        winstonFormat
    )
});
//fim configurações de log

app.use(express.json());
app.use(cors());
app.use(session({
    secret: "adopets",
    cookie:{
        secure: false
    },
    resave:true
}))
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(
    {
        usernameField: 'email',
        passwordField: 'senha'
    },
    function(username, password, done){
        Usuario.login(username, password).then((login) => {
            done(null, login);
        });
    }
));

passport.serializeUser((user, done) => {
    done(null, user.uuid);
});

passport.deserializeUser((uuid, done) => {
    Usuario.getUser(uuid).then(user => {
        done(null,user);
    });
})

app.use("/produtos", Produto);

app.post("/cadastro", (req, res) => {
    if(req.user){
        res.status(403).send({"message": "Usuário já conectado"});
        res.end();
        return;
    }
    const {email, nome, senha} = req.body;
    const novoUsuario = new Usuario(nome, email, senha);
    logger.info("attemping to sign up");
    novoUsuario.create().then((user) => {
        if(user == null){
            throw {"message": "nao foi possivel fazer o cadastro, verifique os parametros informados ou se esse email ja esta sendo utilizado"};
        }
        res.redirect("/login");
    }).catch((e) => {
        errorLogger.error(`error on signup: ${JSON.stringify(e)}`)
        res.status(500).send(JSON.stringify(e));
    });
});

app.post("/login", passport.authenticate("local", {
    successRedirect: "/login/200",
    failureRedirect: "/login/403"
}));

app.use("/login/200", (req, res) => {
    if(!req.user){
        logger.info(`user not logged in: ${JSON.stringify(req.body)}`);
        res.redirect("/login/403");
        return;
    }
    logger.info(`${req.user.uuid} logged in`);
    res.status(200).send(JSON.stringify(req.user.uuid));
});

app.use("/login/403", (req, res) => {
    errorLogger.error(`wrong login`);
    res.status(403).send(JSON.stringify({"message": "Login inválido"}));
})

app.listen(port, () => {
    logger.info(`app listening port ${port}`)
});


app.use("/logout", (req,res) => {
    if(req.user != undefined){
        logger.info(`${req.user.uuid} logged out`);
        req.logout();
        res.status(200).end();
    } else {
        errorLogger.error(`already logged off`);
        res.status(403).send({"message": "usuário não logado"}).end();
    }
});