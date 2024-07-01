//const { text } = require("express");

//const { text } = require("express");

//const { randomFill } = require("crypto");

//const { text } = require("express");

//const { randomFill } = require("crypto");

//get container for our canvas

//const sketchContainer = document.getElementById("sketch-container");

//get socket which only uses websockets as a means of communication
const socket = io({
  transports: ["websocket"]
});
let currentRoomCode = null;

window.onload = () => {
  const join_option_input = prompt('Select: "CREATE" or "JOIN"', "CREATE");
  if (join_option_input === "CREATE") {
      socket.emit("requestCreateRoom");
  } else if (join_option_input === "JOIN") {
      const room_code_input = prompt("Enter Room Code");
      socket.emit("requestJoinRoom", room_code_input);
  } else {
      window.onload();
  }
};

socket.on("setRoomCode", (code) => {
  currentRoomCode = code;
});
socket.on('roomFull', (data) => {
  if(data){
    alert("Room is full, pick another room")
  }
})

class paddle{
  constructor(){
    this.x = 50
    this.y = 50
    this.w = 10
    this.h = 50
  }

  moveDown(speed){
    this.y -= speed
  }

  moveUp(speed){
    this.y += speed
  }

  draw(){
    rect(this.x, this.y, this.w, this.h)
  }
}


//the p5js sketch
//p5js is used in instance mode, so how the functions work are a bit different
/*
const sketch = (p) => {
  let positions = {};
  //the p5js setup function
  p.setup = () => {
    //to fill up the full container, get the width and height
    //const containerPos = sketchContainer.getBoundingClientRect();
    const cnv = p.createCanvas(windowWidth, windowHeight); //the canvas!

    cnv.mousePressed(() => {
      //when you click on the canvas, update your position
      socket.emit("updatePosition", {
        x: p.mouseX / p.width, // always send relative number of position between 0 and 1
        y: p.mouseY / p.height //so it positions are the relatively the same on different screen sizes.
      });
    });
    p.fill(255); //sets the fill color of the circle to white
    p.frameRate(30); //set framerate to 30, same as server
    socket.on("positions", (data) => {
      //get the data from the server to continually update the positions
      positions = data;
    });
  };

  //the p5js draw function, runs every frame rate
  //(30-60 times / sec)
  p.draw = () => {
    p.background(0); //reset background to black
    //draw a circle for every position
    for (const id in positions) {
      const position = positions[id];
      p.circle(position.x * p.width, position.y * p.height, 10);
    }
  };
};
*/
//initialize the sketch!
//new p5(sketch, sketchContainer);

let positions = {}
let cnv
let ball
let balls = {}
let numPlayers = 1
let ballData
let endgame = false
let didYouWin = false
function setup(){
  new Canvas(1000, 600) // new Canvas() ?
  ball = new paddle()
  balls[socket.id] = ball
  fill(255)
  frameRate(30)
  let text_layer = new Sprite();
  text_layer.visible = false;
  text_layer.collider = "none";
  text_layer.update = () => {
      textAlign(CENTER, CENTER);
      textSize(32);
      text(`Room Code: ${currentRoomCode}`, 0, 50, width, 50);
  };
}
socket.on("positions", (data) => {
  //get the data from the server to continually update the positions
  //positions = data;
  for(let room of data){
    console.log('its not happening')
    if(room.id == currentRoomCode){
      console.log('its happening')
      positions = room.positions
    }
  }
 /* if(Object.keys(positions).length > Object.keys(balls).length){
    
    let a  = new Sprite()
    a.diameter = 50;
    balls.push(a)
  }*/
  /*let pos = Object.keys(positions)
  for(let a of pos){
    if(Object.keys(balls).includes(a)){
      balls[a].x = positions[a].x * width
      balls[a].y = positions[a].y * height
    }
  }*/
 /* for(let id in positions){
    if(id == socket.id){
      let position = positions[id]
      balls[id].x = position.x * width
      balls[id].y = position.y * height
    }
    
  }*/
});


socket.on("newPlayer", (data) => {
  //balls[data] = new Sprite()
  //balls[data].w = 10
  //balls[data].h = 50
  //balls[data].x=positions[data].x
  //balls[data].y=positions[data].y
  numPlayers++;
});
let shake = false
socket.on('winner', (data) => {
  console.log('winner received')
  if(data[2] == currentRoomCode){
    if(data[0] == socket.id) {
    endgame = data[1]
    didYouWin = true
      shake = true
  }else{
    endgame = data[1]
    didYouWin = false
  }
  }
  
})
let points = [0, 0]
socket.on('points', (data) => {
  if(data.id == currentRoomCode){
    points = data.points
  }
})

socket.on('powerUp', (data) => {
  if (data) {
    ball.h = 100
  }
})

let ballPositions = []

function draw(){
  background(0)
  if(ballPositions.length > 3){
    ballPositions = []
  }
  textSize(32)
  text(`${points[0]} : ${points[1]}`, width/2, height / 3)
  //text()
  //console.log(positions)
  //circle(width/2, height/2, 50)
  let buffer = []
  let paddleBuffer = []
  for(const id in positions){
    
    if(id =='ball'){
      let ballData = positions['ball']
      let ballPosX = ballData.x * width
      let ballPosY = ballData.y * height
      //let ballClass = new Ball(ballPosX, ballPosY, ballData.diameter/2)
      //ballPositions.push(ballClass)
      fill(ballData.colour[0], ballData.colour[1], ballData.colour[2])
      buffer.push(ballPosY)
      
      circle(ballPosX, (ballPosY - (buffer[buffer.length-1]) * 0.1), ballData.diameter)
      fill('white')
      if((ballPosX <= 0.20 * width + 20) || (ballPosX >= 0.75 * width - 20)){
        if(dist(ballPosX, ballPosY, ball.x, ball.y) <= 50){
          //console.log(dist(ballPosX, ballPosY, ball.x, ball.y))
          //if the ball hits the paddle
          socket.emit('ballCollision', true)
        }
      }
      
    }else if(id == 'powercube'){
      let powercubeData = positions['powercube']
      for(const powercube of powercubeData){
        let powercubePosX = powercube.x * width
        let powercubePosY = powercube.y * height
        fill(powercube.colour[0], powercube.colour[1], powercube.colour[2])
        rect(powercubePosX, powercubePosY, powercube.w, powercube.h)
        fill('white')
      }
    }else{
      const position = positions[id]
      //ballPositions.push(new Ball(positions[id].x * width, positions[id].y * height, 50))
      paddleBuffer.push(position.y * height)
        rect(position.x * width, position.y * height, 10, position.h)
      
      
    }
//collision detection between ball and paddle

  }

/*  for(let i=0;i<ballPositions.length;i++){
    ballPositions[i].update()
    ballPositions[i].display()
    if(i !== 0){
      ballPositions[0].checkCollision(ballPositions[i])
    }
  }*/


  
  if(didYouWin == true && endgame == true) {
    textAlign(CENTER)
    textSize(32)
    text('YOU WON!', width/2, height/2)
    //noLoop()
  }else if(endgame == true && didYouWin == false){
    textAlign(CENTER)
    textSize(32)
    text('YOU LOST!', width/2, height/2)
    if(shake){
      translate(random(-5,5),random(-5,5));
    }
    if(frameCount % 300 == 0){
      shake = false
    }
    //noLoop()
  }
  move()
  socket.emit("updatePosition", {
    y: ball.y / height
  })
}



function move(){
  const SPEED = 10;
  if (kb.pressing("w")) {
      ball.y -= SPEED
  }
  
  if (kb.pressing("s")) {
      ball.y += SPEED
  }
  
}

