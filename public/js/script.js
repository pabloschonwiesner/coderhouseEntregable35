let usuario = document.querySelector('#usuario')
let password = document.querySelector('#password')
let email = document.querySelector('#email')
let title = document.querySelector('#title')
let price = document.querySelector('#price')
let thumbnail = document.querySelector('#thumbnail')
let btnRegistrarse = document.querySelector('#registrarse')
let btnSalir = document.querySelector('#salir')
let btnEnviar = document.querySelector('#enviar')
let enviarMensaje = document.querySelector('#enviarMensaje')

let emailChat = document.querySelector('#emailChat')

if(emailChat) {
  emailChat.addEventListener('input', validarEmail)
}

if(enviarMensaje) {
  enviarMensaje.addEventListener('click', sendMessage)
}

// if(btnRegistrarse) {
//   btnRegistrarse.addEventListener('click', (event) => {
//     event.preventDefault()
//     console.log('registrarse')
//     fetch('http://localhost:3232/api/register', {
//       method: 'POST',
//       body: JSON.stringify({ usuario: usuario.value, password: password.value, email: email.value}),
//       headers: {
//         'Content-Type': 'application/json'
//       }
//     }).then( result => result.json())
//       .then( () => window.location.replace('http://localhost:3232/datos'))
//       .catch( err => console.log(err))
      
//   })

// }

document.addEventListener('DOMContentLoaded', function() {
  var elems = document.querySelectorAll('select');
  var instances = M.FormSelect.init(elems);
});



function salir ()  {
  console.log('salir')
  fetch('http://localhost:3232/sesion/salir', {
    method: 'GET',
  }).then( result => result.json())
    .then( () => window.location.replace('http://localhost:3232/'))
    .catch( err => console.log(err))
    
}



function deshabilitarBotonRegistro () {
  if(usuario.value != '' && password.value != '' && email.value != '') {
    btnRegistrarse.removeAttribute('disabled')
  } else {
    btnRegistrarse.setAttribute('disabled', true)
  }
}

function deshabilitarBotonEnviar () {
  if(title.value != '' && price.value != '' && thumbnail.value != '') {
    btnEnviar.removeAttribute('disabled')
  } else {
    btnEnviar.setAttribute('disabled', true)
  }
}

function validarEmail() {
  let format = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/

  if (format.test(emailChat.value)) {
    enviarMensaje.disabled = false
  } else {
    enviarMensaje.disabled = true
  }
}

function sendMessage (event) {
  event.preventDefault()
  socket.emit('message', {
    author: {
      email: emailChat.value,
      nombre: nombre.value,
      apellido: apellido.value,
      edad: edad.value,
      alias: alias.value,
      avatar: avatar.value
    },
    text: message.value
  })
  message.value = ''
}

function crearMensaje ( mensaje ) {
  mensaje = JSON.parse(mensaje)
  console.log({mensaje})
  let li = document.createElement('li')
  let spanEmail = document.createElement('span')
  let spanFechaHora = document.createElement('span')
  let spanMensaje = document.createElement('span')
  spanEmail.innerText = mensaje.author.email + ' -   '
  spanEmail.className = 'emailStyle'
  // spanFechaHora.innerText = mensaje.author.fechaHora
  // spanFechaHora.className = 'fechaHoraStyle'
  spanMensaje.innerText = mensaje.text
  spanMensaje.className = 'mensajeStyle'

  li.appendChild(spanEmail)
  li.appendChild(spanFechaHora)
  li.appendChild(spanMensaje)

  lista.appendChild(li)
}


let socket = io()
let sessionID = null

socket.on('connect', () => {
  console.log('conectado')



  socket.on('disconnect', () => {
    console.log('desconectado')
  })
  
  // socket.on('productos', (data) => {
  //   tbody.innerHTML = ''
  //   let productos = JSON.parse(data)
  //   productos.forEach( producto => crearRegistroTabla(producto))
  // })

  // socket.on('productoAgregado', (data) => {
  //   crearRegistroTabla(JSON.parse(data))
  // })

  socket.on('message', (data) => {
    console.log(data)
    crearMensaje(data)
  })

  socket.on('todosLosMensajes', (data) => {
    let mensajes = JSON.parse(data)
    console.log({mensajes})
    
    // crearMensaje(data)
  })
})