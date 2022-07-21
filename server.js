const { Server } = require("socket.io")
const axios = require('axios').default
const chalk = require('chalk')
const port = process.env.PORT || 3000
const apiURL = 'http://localhost:5000'

// Registering
const io = new Server(port, {
  // options
});

// Events
io.on("connection", (socket) => {
	axios.get(`${apiURL}/${socket.handshake.auth.userID}`)
		.then(res => {
			if(res.data.code == 'success'){
				socket.data = res.data.data
				console.log(`${chalk.green.bold('[SERVER EVENT]')} ${chalk.blue.bold('Connection:')} ${chalk.yellow.bold(socket.data.username)} has connected to the server.`)

				socket.emit("hello", `${chalk.blue.bold('SERVER')}: Howdy, ${socket.data.username}! Connection succesfully established. Wait for response.`)
			} else{
				socket.disconnect()
			}
		})
		.catch((error) => {
			console.log(error)
		})

	socket.on("disconnect", (reason) => {
		if(socket.data.username != undefined){
			console.log(`${chalk.green.bold('[SERVER EVENT]')} ${chalk.red.bold('Disconnection:')} ${chalk.yellow.bold(socket.data.username)} has disconnected from the server.`)
		}
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
});


console.log(`ShadowNET Socket Server - RUNNING [PORT: ${port}]\n`)