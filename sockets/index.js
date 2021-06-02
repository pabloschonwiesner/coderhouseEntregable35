const { io } = require('../index')
const ProductoServicio = require('./../services/producto.service')
const MensajeServicio = require('./../services/mensaje.service')

let productoServicio = new ProductoServicio()
let mensajeServicio = new MensajeServicio()

io.on('connection', (client) => {
  console.log('cliente conectado')
  io.on('disconnect', () => {
    console.log('cliente desconectado')
  })

  // client.on('agregarProducto', async (data) => {
  //   let productoAgregado = await productoServicio.add(JSON.parse(data))
  //   io.sockets.emit('productoAgregado', JSON.stringify(productoAgregado))
    
  // })

  client.on('message', async (data) => {
    let mensajeAgregado = await mensajeServicio.add(data)
    io.sockets.emit('message', JSON.stringify(mensajeAgregado))
  })

  // async function emitirListaProductos() {
  //   let listaProductos = JSON.stringify(await productoServicio.getAll())
  //   client.emit('productos', listaProductos)
  // }

  async function emitirListaMensajes() {
    let  mensajes = await mensajeServicio.getAll()
    client.emit('todosLosMensajes', JSON.stringify(mensajes))
  }

  // emitirListaProductos()
  emitirListaMensajes()
})