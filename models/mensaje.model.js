const mongoose = require('mongoose')
const AutoIncrement = require('mongoose-sequence')(mongoose);

let Schema = mongoose.Schema;

let mensajeSchema = new Schema({
  author: {
    email: String,
    nombre: String,
    apellido: String,
    edad: Number,
    alias: String,
    avatar: String
  },
  text: String
})



module.exports = mongoose.model('Mensaje', mensajeSchema)