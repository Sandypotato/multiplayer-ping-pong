const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  transports: ["websocket"]
}); 

const port = process.env.PORT || 8080;
let numPlayers = 0
let playerIds = []
const width = 1000
const height = 600
let rooms = []

app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.render("index.html");
});


http.listen(port, () => {
  console.log(`Server is active at port:${port}`);
});

class Room {
    constructor(id) {
        this.clients = [];
        this.id = id;
        this.positions = {}
        //this.powercubes = []
        this.gameover = false
        this.points = [0, 0]
    }

    addClient(id) {
        if(this.clients.includes(id)){
          throw new Error("Client already in room")
        }
        this.clients.push(id);
        if(this.clients.length == 1){
          this.positions[id] = {x: 0.2, y: 0.5, h: 50}
        }
      if(this.clients.length == 2){
        this.positions[id] = {x: 0.8, y: 0.5, h: 50}
      }
    }

    removeClient(id) {
        if (!this.clients.includes(id)) {
            throw Error(`No such client in room`);
        }
        this.clients.splice(this.clients.indexOf(id), 1);
        if (this.clients.length === 0) {
            rooms.splice(rooms.indexOf(this), 1);
        }
    }

  addBall(ball){
    this.positions['ball'] = ball;
  }
}

const positions = {};
class ball{
  constructor(){
    this.x = 0.5
    this.y = 0.5
    this.diameter = 20
    this.velocity = {
      x: (Math.random() - 0.5) / 200,
      y: (Math.random() - 0.5) / 500
    }
    this.acceleration = {
      x: 0,
      y: 0
    }
    this.colour = [Math.random() * 255, Math.random() * 255, Math.random() * 255]
  }

  moveBall(){
    this.x += this.velocity.x
    this.y += this.velocity.y
    this.velocity.x += this.acceleration.x
    this.velocity.y += this.acceleration.y
  }
}

class powercube{
  constructor(){
    this.x = 0.5
    this.y = 0.5
    this.w = 50
    this.h = 50
    this.velocity = {
      x: (Math.random() - 0.5) / 500,
      y: (Math.random() - 0.5) / 700
    }
    this.acceleration = {
      x: 0,
      y: 0
    }
    this.colour = [255, 215, 0]
  }

  moveCube(){
    this.x += this.velocity.x
    this.y += this.velocity.y
    this.velocity.x += this.acceleration.x
    this.velocity.y += this.acceleration.y
  }

  getPowerUp(){
    //make paddle bigger for 5 hits
  }
}

//const ballStuff = new ball()
//Socket configuration
io.on("connection", (socket) => {
  numPlayers += 1;
  playerIds.push(socket.id)
  console.log(playerIds)
  console.log(`${socket.id} connected`);

  positions[socket.id] = {
    x: 0.2,
    y: 0.5,
    h: 50
  }
  socket.broadcast.emit('newPlayer', socket.id)

  socket.on("requestCreateRoom", () => {
      const roomCode = generateRandomRoomCode();
      let room = new Room(roomCode);
      room.addClient(socket.id);
      room.addBall(new ball())
      rooms.push(room);
      socket.emit("setRoomCode", roomCode);
  });

  socket.on("requestJoinRoom", (code) => {
      for (let room of rooms) {
          if (room.id === code) {
            if(room.clients.length < 2){
              room.addClient(socket.id);
              socket.emit("setRoomCode", code);
            }else{
              socket.to(socket.id).emit('roomFull', true)
            }
              
              return;
          }
      }
  });
  
  socket.on("disconnect", () => {
    delete positions[socket.id];
    console.log(`${socket.id} disconnected`);
  });

  socket.on("updatePosition", (data) => {
    //positions[socket.id].x = data.x;
    positions[socket.id].y = data.y;
    for(let room of rooms){
      if(room.clients.includes(socket.id)){
        room.positions[socket.id] = positions[socket.id]
      }
    }
  });

  socket.on('ballCollision', (data) => {
    //if(data == true){.velocity.x *= -1;}
  })
});

function generateRandomRoomCode() {
    return (+new Date()).toString(36).slice(-5);
}



const frameRate = 60;
let frameCount = 0
let powercubeInstance = null
let noPowercubes = 0
let powercubes = []

setInterval(() => {
  //console.log(ballStuff)
  frameCount++
for(let room of rooms){
  if(room.positions['ball'] == null && room.points[0] < 3 && room.points[1] < 3){
    room.positions['ball'] = new ball();
  }
  if(room.clients.length == 2 && room.positions['ball'] !== null){
    let player1 = room.positions[room.clients[0]] // = {x: 0.2, y: 0.5, h: 50}
    let player2 = room.positions[room.clients[1]] // = {x: 0.2, y: 0.5, h: 50}
    let roomBall = room.positions['ball']
    player1.x = 0.2
    player2.x = 0.8
    roomBall.moveBall()
    if(ballCollision(roomBall.x, roomBall.y, player1.x, 
     player1.y, 20, player1.h) === true || ballCollision(roomBall.x, roomBall.y, player2.x, 
         player2.y, 20, player2.h)){
        roomBall.velocity.x *= -1 * (Math.random() * 2)
     }
    if(frameCount % 120 == 0 && Math.random() > 0.9){
      //every 120 frames, there is a 10% chance that a powercube will spawn
      noPowercubes++
      powercubeInstance = new powercube()

      powercubes.push(powercubeInstance)
      room.positions['powercube'] = powercubes
    }
    if(powercubes.length > 0){
      for(let i = 0; i < powercubes.length; i++){
      powercubes[i].moveCube()
      //let player1 = positions[playerIds[0]]
      //let player2 = positions[playerIds[1]]
        if(powercubes[i] == null){break;}
      if(ballCollision(powercubes[i].x, powercubes[i].y, player1.x, player1.y, 20, player1.h) === true){
        powercubes.splice(i, 1)
        noPowercubes--
        io.to(room.clients[0]).emit('powerUp', true)
        player1.h = 100
        }
      if(ballCollision(powercubes[i].x, powercubes[i].y, player2.x, player2.y, 20, player2.h) === true){
        powercubes.splice(i, 1)
        noPowercubes--
        io.to(room.clients[1]).emit('powerUp', true)
        player2.h = 100
        }
      }
    }

  }
  let roomBall = room.positions['ball']
  if(roomBall.y < 0){
    roomBall.velocity.y *= -1
  }
  if(roomBall.y > 1){
    roomBall.velocity.y *= -1
  }
  console.log(room.id)
  if(roomBall.x < 0.1){
    room.gameover = true
    room.points[1] += 1
    if(room.points[1] == 3){
      io.emit('winner', [room.clients[1], room.gameover, room.id])
    }
    
    io.emit('points', {
      id: room.id,
      points: room.points
    })
    delete room.positions['ball']
    console.log(room.id)
  }
  if(roomBall.x > 0.9){
    room.gameover = true
    room.points[0] += 1
    if(room.points[0] == 3){
      io.emit('winner', [room.clients[0], room.gameover, room.id])
    }
    
    io.emit('points', {
      id: room.id,
      points: room.points
    })
    delete room.positions['ball']
    console.log(room.id)
  }


  //positions['ball'] = roomBall



  console.log(rooms)
  io.emit("positions", rooms);
  
}
  

}, 1000 / frameRate);

function ballCollision(ballPosX, ballPosY, paddlePosX, paddlePosY, ballDiameter, paddleHeight){
  if(paddlePosX === 0.2){
    if(ballPosX * width - (ballDiameter / 2) <= paddlePosX * width && ballPosY * height >= paddlePosY * height && ballPosY * height <= paddlePosY * height + paddleHeight){
      return true
    }else{
      return false
    }
  }
  if(paddlePosX === 0.8){
    if(ballPosX * width + (ballDiameter / 2) >= paddlePosX * width && ballPosY * height >= paddlePosY * height && ballPosY * height <= paddlePosY * height + paddleHeight){
      return true
    }else{
      return false
    }
  }
}
