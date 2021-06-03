const { io } = require('../index')
const ProductoServicio = require('./../services/producto.service')
const MensajeServicio = require('./../services/mensaje.service')

const twilioAccountId = process.env.TWILIO_ACCOUNT_ID
const twilioAuthToken= process.env.TWILIO_AUTH_TOKEN

const clientTwilio = require('twilio')(twilioAccountId, twilioAuthToken)


// let productoServicio = new ProductoServicio()
let mensajeServicio = new MensajeServicio()

function sendSMS (mensaje) {
  clientTwilio.messages.create({
    body: mensaje,
    from: '+13236760277',
    to: '+5491140430759'
  })
  .then( message => console.log({message}))
  .catch ( err => console.log({err}))
}

io.on('connection', (client) => {
  console.log('cliente conectado')
  io.on('disconnect', () => {
    console.log('cliente desconectado')
  })

  client.on('message', async (data) => {
    console.log(data);

    if(data.text.includes('administrador')) {
      let mensaje = `${data.author.email} ${data.text}`
      sendSMS(mensaje)
    }

    let mensajeAgregado = await mensajeServicio.add(data)
    io.sockets.emit('message', JSON.stringify(mensajeAgregado))
  })

  async function emitirListaMensajes() {
    let  mensajes = await mensajeServicio.getAll()
    client.emit('todosLosMensajes', JSON.stringify(mensajes))
  }

  // emitirListaProductos()
  emitirListaMensajes()
})