const { encrypt } = require('./Encrypt');

let io = null;

const onDisconnect = (socket) => { }

const onConnectFn = (socket) => {
  console.log('User connect');
  socket.on('disconnection', () => { onDisconnect(socket) });
}

const init = (ioInput) => {
  if (ioInput) {
    io = ioInput;
    io.set('origins', '*:*');
    io.on('connection', onConnectFn);
  }
}

const broadcast = async (type, content) => {
  if (!io) {
    return;
  }

  type = type.toString().toUpperCase();
  io.emit(type, encrypt(JSON.stringify(content)));
}

module.exports = {
  init,
  broadcast
}