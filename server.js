const { Server } = require("socket.io")
const {setTimeout} = require("timers/promises");
const axios = require('axios').default
const chalk = require('chalk')
const port = process.env.PORT || 3000
const devMode = false
const apiURL = devMode ? 'http://localhost:5000' : 'https://shadownet-api.herokuapp.com'

// Registering
const io = new Server(port, {
  // options
});

const connectedTokens = []

// Utils
async function startTokenTimer(token) {
	await setTimeout(216000000);

	for(t in connectedTokens){
		if(connectedTokens[t].t == token){
			connectedTokens.splice(t, 1)
		}
	}
}

function genToken(){
	const c = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!-_'
	var token = ''

	for(let i=0; i<30; i++){
		token += c[Math.floor(Math.random()*c.length)]
	}

	return token
}

// Events
io.on("connection", (socket) => {
	for(t in connectedTokens){
		if(socket.handshake.auth.token == connectedTokens[t].t){
			socket.data = {
				't': connectedTokens[t].t,
				'username': connectedTokens[t].username,
				'id': connectedTokens[t].id,
				'pass': connectedTokens[t].pass,
				'access_level': connectedTokens[t].acess_level
			}
		}
	}

	console.log(`${chalk.green.bold('[SERVER EVENT]')} ${chalk.blue.bold('Connection:')} ${socket.data.username == undefined ? socket.id : socket.data.username} has connected to the server.`)

	socket.on("disconnect", (reason) => {
		console.log(`${chalk.green.bold('[SERVER EVENT]')} ${chalk.red.bold('Disconnection:')} ${socket.data.username == undefined ? socket.id : socket.data.username} has disconnected from the server.`)
	})

	socket.on('get_all_netrunners', (id) => {
		axios.get(`${apiURL}/netrunners/${id}`)
			.then(res => {
				if(res.data.code == 'success'){
					socket.emit('response_all_netrunners', res.data.data)
				} else{
					socket.emit('bad_response')
				}
			})
	})

	socket.on('get_all_online', (id) => {
		axios.get(`${apiURL}/netrunners/${id}`)
			.then(res => {
				if(res.data.code == 'success'){

					var data = []
					io.sockets.sockets.forEach((connectedSocket) => {
						data.push([connectedSocket.data.username, connectedSocket.id])
					})

					socket.emit('response_all_online', data)
				} else{
					socket.emit('bad_response')
				}
			})
	})

	socket.on('get_netrunner', args => {
		axios.get(`${apiURL}/netrunners/${args[0]}`)
			.then(res => {
				if(res.data.code == 'success'){
					axios.get(`${apiURL}/${args[1]}`)
					.then((data) => {
						socket.emit('response_netrunner', data.data.data)
					})
				} else{
					socket.emit('bad_response')
				}
			})
	})

	socket.on('check_token', token => {
		var r = false

		connectedTokens.forEach((t) => {
			if(t['t'] == token){
				socket.emit('token_found', t)
				r = true
			}
		})

		if(!r){
			socket.emit('token_not_found')
		}
	})

	socket.on('try_to_login', netrunnerData => {
		axios.get(`${apiURL}/${socket.handshake.auth.id}`)
			.then(res => {
				if(res.data.code == 'success'){
					if(res.data.data.pass == socket.handshake.auth.pass){
						let token = genToken()

						connectedTokens.push({
							't': token,
							'username': res.data.data.username,
							'id': res.data.data.id,
							'pass': res.data.data.pass,
							'access_level': res.data.data.access_level
						})

						startTokenTimer(token)

						socket.emit('login_succesful', token)
					} else{
						console.log(`${chalk.green.bold('[SERVER EVENT]')} ${chalk.red.bold('Disconnection:')} ${socket.id} has disconnected from the server while trying to login.`)
						socket.emit('login_failed')
					}
				} else{
					console.log(`${chalk.green.bold('[SERVER EVENT]')} ${chalk.red.bold('Disconnection:')} ${socket.id} has disconnected from the server while trying to login.`)
					socket.emit('login_failed')
				}
			})
			.catch((error) => {
				console.log(error)
			})
	})
});


console.log(`ShadowNET Socket Server - RUNNING [PORT: ${port}]\n`)