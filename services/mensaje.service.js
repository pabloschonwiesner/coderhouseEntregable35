const Mensaje = require('./../models/mensaje.model')

class MensajeService {
  

  getAll () {
    return Mensaje.find();
  }

  async add ( mensaje ) {
    
    let nuevoMensaje = new Mensaje( { 
      author: {
        email: mensaje.author.email,
        nombre: mensaje.author.nombre,
        apellido: mensaje.author.apellido,
        edad: mensaje.author.edad,
        alias: mensaje.author.alias,
        avatar: mensaje.author.avatar
      }, 
      text: mensaje.text
    })
    return await nuevoMensaje.save()
  }
}


module.exports = MensajeService