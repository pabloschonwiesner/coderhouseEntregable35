const express = require('express')
const exphbs = require('express-handlebars')
const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const FacebookStrategy = require('passport-facebook').Strategy
require('dotenv').config()
const bcrypt = require('bcrypt')
const MongoStore = require('connect-mongo')
const mongoose = require('mongoose')
const nodemailer = require('nodemailer')
const Usuario = require('./models/usuario.model')

const ProductoServicio = require('./services/producto.service')
const UsuarioServicio = require('./services/usuario.service')
const MensajeServicio = require('./services/mensaje.service')



const app = express()
let productoServicio = new ProductoServicio()
const usuarioServicio = new UsuarioServicio()
const mensajeServicio = new MensajeServicio()

const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  secure: false,
  auth: {
      user: 'evie57@ethereal.email',
      pass: 'jZ8mCUm4cTRqsRudRU'
  }
});

const transporterGmail = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  auth: {
      user: process.env.MAIL_GMAIL,
      pass: process.env.PASS_GMAIL
  }
});

const mailOptions = {
  from: 'Servidor Node.js',
  to: 'evie57@ethereal.email',
  subject: 'Mail de prueba',
  html: '<h1 style="color: blue;"> prueba </h1>'
}

const mailOptionsGmail = {
  from: 'Servidor Node.js',
  to: process.env.MAIL_GMAIL,
  subject: 'Mail de prueba',
  html: '<h1 style="color: blue;"> prueba </h1>'
}

let facebookId, facebookSecret, port, arrObj = []

process.argv.forEach( arg => {
  let arrArg = arg.split('=')
  arrObj.push({ clave: arrArg[0], valor: arrArg[1]})
})

let findFacebookId = arrObj.find( item => item.clave.toLowerCase() == 'facebookid')
let findFacebookSecret = arrObj.find( item => item.clave.toLowerCase() == 'facebooksecret')
let findPort = arrObj.find( item => item.clave.toLowerCase() == 'port')
let findModo = arrObj.find( item => item.clave.toLowerCase() == 'modo')

facebookId = findFacebookId ? findFacebookId.valor : process.env.FACEBOOK_CLIENT_ID
facebookSecret = findFacebookSecret ? findFacebookSecret.valor : process.env.FACEBOOK_CLIENT_SECRET
port = findPort ? findPort.valor : process.env.PORT
modo = findModo ? findModo.valor : process.env.MODO

app.use(session({
  secret: 'clavesecreta',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/ecommerce'}),
  cookie: {
    maxAge: 600000
  }
}))

app.use(passport.initialize());
app.use(passport.session());

app.engine('.hbs', exphbs({extname: '.hbs', defaultLayout: 'main.hbs'}))
app.set('view engine', '.hbs')

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(express.static('public'))

function validarPassword ( passwordReq, passwordBD )  {
  return bcrypt.compareSync(passwordReq, passwordBD )
}

checkIsAuthenticated = (req, res, next) => {
  if(req.isAuthenticated()) {
    next()
  } else {
    res.render('login')
  }
}



passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  Usuario.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use('login', new LocalStrategy({usernameField: 'usuario', passwordField: 'password', session: true}, async ( username, password, cb) => { 
    try {
      let usuarioDB = await usuarioServicio.getUserByName( username )
      if(usuarioDB.length > 0) {
        if(!validarPassword(password, usuarioDB[0].password)) {
          return cb(null, false)
        }
        sendMailEthereal(usuarioDB, 'login')
        sendMailGmail(usuarioDB)
        return cb(null, usuarioDB[0])
      } else {
        return cb(null, false)
      }
    } catch ( err ) { console.log(err); return cb(err)}
  })
)

passport.use('facebook', new FacebookStrategy({
  clientID: facebookId, 
  clientSecret: facebookSecret, 
  callbackURL: `http://localhost:${port}/auth/facebook/callback`, 
  profileFields: ['id', 'displayName', 'email', 'picture'] },
  async ( accessToken, refreshToken, profile, cb) => { 
    try {
      let usuarioDB = await usuarioServicio.getUserByIdFacebook( profile.id )
      
      if(!usuarioDB) {
        usuarioDB = await usuarioServicio.add( profile )
      }

      sendMailEthereal(usuarioDB, 'login')
      sendMailGmail(usuarioDB)
      return cb(null, usuarioDB)
    } catch ( err ) { return cb(err)}
  })
)

function sendMailEthereal (usuario, accion) {
  let options = Object.assign({}, mailOptions)
  let mensaje = `${accion} usuario ${usuario.usuario} ${Date()}`

  options.subject = mensaje
  options.html = `<h1 style="color: blue;"> ${mensaje} </h1>`

  transporter.sendMail(options, (err, info) => {
    if(err) {
      console.log(err);
      return err
    }
    console.log(info);
    return
  })
}

function sendMailGmail (usuario) {
  let options = Object.assign({}, mailOptionsGmail)
  let mensaje = `login usuario ${usuario.usuario} ${Date()}`

  options.subject = mensaje
  options.to = usuario.email
  options.html = `<h1 style="color: blue;"> ${mensaje} </h1>
  <div><img src=${usuario.picture} width="100" height="100"/></div>
  `

  transporterGmail.sendMail(options, (err, info) => {
    if(err) {
      console.log(err);
      return err
    }
    console.log(info);
  })
}



app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }))

app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login'}), (req, res) => {
  req.session.facebookId = req.user.facebookId
  res.redirect(`/producto`)
})



app.get('/', checkIsAuthenticated,  (req, res) => {
  res.redirect('/producto')      
})

app.get('/login', (req, res) => {
  let usuarioExistente = JSON.parse(req.query.ue || false)
  let passwordIncorrecto = JSON.parse(req.query.pi || false)
  res.render('login', { usuarioExistente, passwordIncorrecto } )
})

app.get('/register', (req, res) => {
  res.sendFile(`${__dirname}/public/register.html`)
})

app.get('/producto', checkIsAuthenticated, async (req, res) => {
  res.render('productos', { productos: await productoServicio.getAll(), listExists: true} )
})

app.get('/chat', checkIsAuthenticated, async (req, res) => {
  res.render('chat', { productos: await mensajeServicio.getAll()} )
})

app.post('/producto', async  (req, res) => {
  try {
    if(req.body) {
      await productoServicio.add(req.body)
    }
    res.redirect('/producto')
  } catch ( err ) { console.log(err) }
})

app.get('/perfil', checkIsAuthenticated, async  (req, res) => {
  let perfil = await usuarioServicio.getUserByIdFacebook(req.session.facebookId)
  console.log({perfil})
  res.render('perfil', { perfil } )     
})

app.post('/register', async (req, res) => {
  let usuario = await usuarioServicio.getUserByName(req.body.usuario.toLowerCase())
  let ue = true
  if(usuario.length == 0) {
    ue = false
    let hashPassword = function ( password ) {
      return bcrypt.hashSync( password , bcrypt.genSaltSync(10), null)
    }
  
    let nuevoUsuario = { 
      usuario: req.body.usuario.toLowerCase(), 
      password: hashPassword(req.body.password), 
      email: req.body.email.toLowerCase()
    }
  
    await usuarioServicio.add(nuevoUsuario)
  }
  return res.redirect(`/login?ue=${ue}`)  
})

app.post('/ingresar', passport.authenticate('login', { failureRedirect: '/login?pi=true'}), async (req, res) => {
  try {
    res.redirect('/producto')
  } catch ( err ) { console.log(err) }
})

app.get('/salir', async (req, res) => {
  let usuarioDB = await usuarioServicio.getById(req.session.passport.user)
  
  req.session.destroy( () => {
    sendMailEthereal(usuarioDB, 'logout')
    res.redirect('/')
  })
})

// server socket.io
const server = require('http').createServer(app);
exports.io = require('socket.io')(server);
require('./sockets/index')



server.listen(port, () => {
  console.log(`Escuchando el puerto ${port}`)
  mongoose.connect(process.env.MONGO_URL, {useNewUrlParser: true, useUnifiedTopology: true}, (err) => {
  if(err) console.log(err);
  
  console.log('Base de datos ONLINE');
});
})
server.on('error', (err) => { console.log(`Error de conexion: ${err}`)})