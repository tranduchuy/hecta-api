const { encrypt } = require('./Encrypt');
let io = null;
const SocketEvents = require('../config/socket-event');

const onDisconnect = (socket) => { };

const onConnectFn = (socket) => {
  console.log('User connect');
    socket.on(SocketEvents.JOIN, (data)=>{
        socket.join(data.userId);//using room of socket io
    })
  socket.on('disconnection', () => { onDisconnect(socket) });
};

const init = (ioInput) => {
  if (ioInput) {
    io = ioInput;
    io.set('origins', '*:*');
    io.on('connection', onConnectFn);
  }
};

const broadcast = (type, content) => {
  if (!io) {
    return;
  }

  type = type.toString().toUpperCase();
  io.emit(type, encrypt(JSON.stringify(content)));
};

module.exports = {
  init,
  broadcast
};