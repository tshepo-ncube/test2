function rand(max) {
  return Math.floor(Math.random() * max);
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function changeBrightness(factor, sprite) {
  var virtCanvas = document.createElement("canvas");
  virtCanvas.width = 500;
  virtCanvas.height = 500;
  var context = virtCanvas.getContext("2d");
  context.drawImage(sprite, 0, 0, 500, 500);

  var imgData = context.getImageData(0, 0, 500, 500);

  for (let i = 0; i < imgData.data.length; i += 4) {
    imgData.data[i] = imgData.data[i] * factor;
    imgData.data[i + 1] = imgData.data[i + 1] * factor;
    imgData.data[i + 2] = imgData.data[i + 2] * factor;
  }
  context.putImageData(imgData, 0, 0);

  var spriteOutput = new Image();
  spriteOutput.src = virtCanvas.toDataURL();
  virtCanvas.remove();
  return spriteOutput;
}

function displayVictoryMess(moves) {
  document.getElementById("moves").innerHTML = "You Moved " + moves + " Steps.";
  toggleVisablity("Message-Container");
}

function toggleVisablity(id) {
  if (document.getElementById(id).style.visibility == "visible") {
    document.getElementById(id).style.visibility = "hidden";
  } else {
    document.getElementById(id).style.visibility = "visible";
  }
}

function Maze(Width, Height) {
  var mazeMap;
  var width = Width;
  var height = Height;
  var startCoord, endCoord;
  var dirs = ["n", "s", "e", "w"];
  var modDir = {
    n: {
      y: -1,
      x: 0,
      o: "s",
    },
    s: {
      y: 1,
      x: 0,
      o: "n",
    },
    e: {
      y: 0,
      x: 1,
      o: "w",
    },
    w: {
      y: 0,
      x: -1,
      o: "e",
    },
  };

  this.map = function () {
    return mazeMap;
  };
  this.startCoord = function () {
    return startCoord;
  };
  this.endCoord = function () {
    return endCoord;
  };

  function genMap() {
    mazeMap = new Array(height);
    for (y = 0; y < height; y++) {
      mazeMap[y] = new Array(width);
      for (x = 0; x < width; ++x) {
        mazeMap[y][x] = {
          n: false,
          s: false,
          e: false,
          w: false,
          visited: false,
          priorPos: null,
        };
      }
    }
  }

  function defineMaze() {
    var isComp = false;
    var move = false;
    var cellsVisited = 1;
    var numLoops = 0;
    var maxLoops = 0;
    var pos = {
      x: 0,
      y: 0,
    };
    var numCells = width * height;
    while (!isComp) {
      move = false;
      mazeMap[pos.x][pos.y].visited = true;

      if (numLoops >= maxLoops) {
        shuffle(dirs);
        maxLoops = Math.round(rand(height / 8));
        numLoops = 0;
      }
      numLoops++;
      for (index = 0; index < dirs.length; index++) {
        var direction = dirs[index];
        var nx = pos.x + modDir[direction].x;
        var ny = pos.y + modDir[direction].y;

        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          //Check if the tile is already visited
          if (!mazeMap[nx][ny].visited) {
            //Carve through walls from this tile to next
            mazeMap[pos.x][pos.y][direction] = true;
            mazeMap[nx][ny][modDir[direction].o] = true;

            //Set Currentcell as next cells Prior visited
            mazeMap[nx][ny].priorPos = pos;
            //Update Cell position to newly visited location
            pos = {
              x: nx,
              y: ny,
            };
            cellsVisited++;
            //Recursively call this method on the next tile
            move = true;
            break;
          }
        }
      }

      if (!move) {
        //  If it failed to find a direction,
        //  move the current position back to the prior cell and Recall the method.
        pos = mazeMap[pos.x][pos.y].priorPos;
      }
      if (numCells == cellsVisited) {
        isComp = true;
      }
    }
  }

  function defineStartEnd() {
    switch (rand(4)) {
      case 0:
        startCoord = {
          x: 0,
          y: 0,
        };
        endCoord = {
          x: height - 1,
          y: width - 1,
        };
        break;
      case 1:
        startCoord = {
          x: 0,
          y: width - 1,
        };
        endCoord = {
          x: height - 1,
          y: 0,
        };
        break;
      case 2:
        startCoord = {
          x: height - 1,
          y: 0,
        };
        endCoord = {
          x: 0,
          y: width - 1,
        };
        break;
      case 3:
        startCoord = {
          x: height - 1,
          y: width - 1,
        };
        endCoord = {
          x: 0,
          y: 0,
        };
        break;
    }
  }

  genMap();
  defineStartEnd();
  defineMaze();
}

function DrawMaze(Maze, ctx, cellsize, endSprite = null) {
  var map = Maze.map();
  var cellSize = cellsize;
  var drawEndMethod;
  ctx.lineWidth = cellSize / 40;

  this.redrawMaze = function (size) {
    cellSize = size;
    ctx.lineWidth = cellSize / 50;
    drawMap();
    drawEndMethod();
  };

  function drawCell(xCord, yCord, cell) {
    var x = xCord * cellSize;
    var y = yCord * cellSize;

    if (cell.n == false) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + cellSize, y);
      ctx.stroke();
    }
    if (cell.s === false) {
      ctx.beginPath();
      ctx.moveTo(x, y + cellSize);
      ctx.lineTo(x + cellSize, y + cellSize);
      ctx.stroke();
    }
    if (cell.e === false) {
      ctx.beginPath();
      ctx.moveTo(x + cellSize, y);
      ctx.lineTo(x + cellSize, y + cellSize);
      ctx.stroke();
    }
    if (cell.w === false) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + cellSize);
      ctx.stroke();
    }
  }

  function drawMap() {
    for (x = 0; x < map.length; x++) {
      for (y = 0; y < map[x].length; y++) {
        drawCell(x, y, map[x][y]);
      }
    }
  }

  function drawEndFlag() {
    var coord = Maze.endCoord();
    var gridSize = 4;
    var fraction = cellSize / gridSize - 2;
    var colorSwap = true;
    for (let y = 0; y < gridSize; y++) {
      if (gridSize % 2 == 0) {
        colorSwap = !colorSwap;
      }
      for (let x = 0; x < gridSize; x++) {
        ctx.beginPath();
        ctx.rect(
          coord.x * cellSize + x * fraction + 4.5,
          coord.y * cellSize + y * fraction + 4.5,
          fraction,
          fraction
        );
        if (colorSwap) {
          ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        } else {
          ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        }
        ctx.fill();
        colorSwap = !colorSwap;
      }
    }
  }

  function drawEndSprite() {
    var offsetLeft = cellSize / 50;
    var offsetRight = cellSize / 25;
    var coord = Maze.endCoord();
    ctx.drawImage(
      endSprite,
      2,
      2,
      endSprite.width,
      endSprite.height,
      coord.x * cellSize + offsetLeft,
      coord.y * cellSize + offsetLeft,
      cellSize - offsetRight,
      cellSize - offsetRight
    );
  }

  function clear() {
    var canvasSize = cellSize * map.length;
    ctx.clearRect(0, 0, canvasSize, canvasSize);
  }

  if (endSprite != null) {
    drawEndMethod = drawEndSprite;
  } else {
    drawEndMethod = drawEndFlag;
  }
  clear();
  drawMap();
  drawEndMethod();
}

// var mazeCanvas = document.getElementById("mazeCanvas");
// var ctx = mazeCanvas.getContext("2d");
// var sprite;
// var finishSprite;
// var maze, draw, player;
// var cellSize;
// var difficulty;

// window.onload = function () {
//   let viewWidth = $("#view").width();
//   let viewHeight = $("#view").height();
//   if (viewHeight < viewWidth) {
//     ctx.canvas.width = viewHeight - viewHeight / 100;
//     ctx.canvas.height = viewHeight - viewHeight / 100;
//   } else {
//     ctx.canvas.width = viewWidth - viewWidth / 100;
//     ctx.canvas.height = viewWidth - viewWidth / 100;
//   }

//   var completeOne = false;
//   var completeTwo = false;
//   var isComplete = () => {
//     if (completeOne === true && completeTwo === true) {
//       console.log("Runs");
//       setTimeout(function () {
//         makeMaze();
//       }, 500);
//     }
//   };
//   sprite = new Image();
//   sprite.src = "./basketball.png" + "?" + new Date().getTime();
//   sprite.setAttribute("crossOrigin", " ");
//   sprite.onload = function () {
//     sprite = changeBrightness(1.2, sprite);
//     completeOne = true;
//     console.log(completeOne);
//     isComplete();
//   };

//   finishSprite = new Image();
//   finishSprite.src = "./home.png" + "?" + new Date().getTime();
//   finishSprite.setAttribute("crossOrigin", " ");
//   finishSprite.onload = function () {
//     finishSprite = changeBrightness(1.1, finishSprite);
//     completeTwo = true;
//     console.log(completeTwo);
//     isComplete();
//   };

//   window.addEventListener("deviceorientation", handleOrientation);
// };

// window.onresize = function () {
//   let viewWidth = $("#view").width();
//   let viewHeight = $("#view").height();
//   if (viewHeight < viewWidth) {
//     ctx.canvas.width = viewHeight - viewHeight / 100;
//     ctx.canvas.height = viewHeight - viewHeight / 100;
//   } else {
//     ctx.canvas.width = viewWidth - viewWidth / 100;
//     ctx.canvas.height = viewWidth - viewWidth / 100;
//   }
//   cellSize = mazeCanvas.width / difficulty;
//   if (player != null) {
//     draw.redrawMaze(cellSize);
//     player.redrawPlayer(cellSize);
//   }
// };

// function makeMaze() {
//   if (player != undefined) {
//     player.unbindKeyDown();
//     player = null;
//   }
//   var e = document.getElementById("diffSelect");
//   difficulty = e.options[e.selectedIndex].value;
//   cellSize = mazeCanvas.width / difficulty;
//   maze = new Maze(difficulty, difficulty);
//   draw = new DrawMaze(maze, ctx, cellSize, finishSprite);
//   player = new Player(maze, mazeCanvas, cellSize, displayVictoryMess, sprite);
//   if (document.getElementById("mazeContainer").style.opacity < "100") {
//     document.getElementById("mazeContainer").style.opacity = "100";
//   }
// }

// var velocity = { x: 0, y: 0 };
// var accelerationFactor = 0.01;
// var friction = 0.95;

// function handleOrientation(event) {
//   var beta = event.beta; // In degree in the range [-180,180], forward/backward tilt
//   var gamma = event.gamma; // In degree in the range [-90,90], left/right tilt

//   velocity.x += gamma * accelerationFactor;
//   velocity.y += beta * accelerationFactor;
// }

// function update() {
//   velocity.x *= friction;
//   velocity.y *= friction;

//   var cell = maze.map()[player.cellCoords.x][player.cellCoords.y];

//   if (velocity.x > 0.1 && cell.e) {
//     player.movePlayer("e", velocity.x);
//   } else if (velocity.x < -0.1 && cell.w) {
//     player.movePlayer("w", velocity.x);
//   }
//   if (velocity.y > 0.1 && cell.s) {
//     player.movePlayer("s", velocity.y);
//   } else if (velocity.y < -0.1 && cell.n) {
//     player.movePlayer("n", velocity.y);
//   }

//   requestAnimationFrame(update);
// }

// function Player(maze, c, _cellsize, onComplete, sprite = null) {
//   var ctx = c.getContext("2d");
//   var drawSprite;
//   var moves = 0;
//   drawSprite = drawSpriteCircle;
//   if (sprite != null) {
//     drawSprite = drawSpriteImg;
//   }
//   var player = this;
//   var map = maze.map();
//   var cellCoords = {
//     x: maze.startCoord().x,
//     y: maze.startCoord().y,
//   };
//   this.cellCoords = cellCoords;
//   var cellSize = _cellsize;
//   var halfCellSize = cellSize / 2;

//   this.redrawPlayer = function (_cellsize) {
//     cellSize = _cellsize;
//     drawSpriteImg(cellCoords);
//   };

//   function drawSpriteCircle(coord) {
//     ctx.beginPath();
//     ctx.fillStyle = "yellow";
//     ctx.arc(
//       (coord.x + 1) * cellSize - halfCellSize,
//       (coord.y + 1) * cellSize - halfCellSize,
//       halfCellSize - 2,
//       0,
//       2 * Math.PI
//     );
//     ctx.fill();
//     if (coord.x === maze.endCoord().x && coord.y === maze.endCoord().y) {
//       onComplete(moves);
//       player.unbindKeyDown();
//     }
//   }

//   function drawSpriteImg(coord) {
//     var offsetLeft = cellSize / 50;
//     var offsetRight = cellSize / 25;
//     ctx.drawImage(
//       sprite,
//       0,
//       0,
//       sprite.width,
//       sprite.height,
//       coord.x * cellSize + offsetLeft,
//       coord.y * cellSize + offsetLeft,
//       cellSize - offsetRight,
//       cellSize - offsetRight
//     );
//     if (coord.x === maze.endCoord().x && coord.y === maze.endCoord().y) {
//       onComplete(moves);
//       player.unbindKeyDown();
//     }
//   }

//   function removeSprite(coord) {
//     var offsetLeft = cellSize / 50;
//     var offsetRight = cellSize / 25;
//     ctx.clearRect(
//       coord.x * cellSize + offsetLeft,
//       coord.y * cellSize + offsetLeft,
//       cellSize - offsetRight,
//       cellSize - offsetRight
//     );
//   }

//   this.movePlayer = function (direction, speed) {
//     var cell = map[cellCoords.x][cellCoords.y];
//     moves++;
//     switch (direction) {
//       case "w": // west
//         if (cell.w == true) {
//           removeSprite(cellCoords);
//           cellCoords = {
//             x: cellCoords.x - Math.ceil(speed),
//             y: cellCoords.y,
//           };
//           drawSprite(cellCoords);
//         }
//         break;
//       case "n": // north
//         if (cell.n == true) {
//           removeSprite(cellCoords);
//           cellCoords = {
//             x: cellCoords.x,
//             y: cellCoords.y - Math.ceil(speed),
//           };
//           drawSprite(cellCoords);
//         }
//         break;
//       case "e": // east
//         if (cell.e == true) {
//           removeSprite(cellCoords);
//           cellCoords = {
//             x: cellCoords.x + Math.ceil(speed),
//             y: cellCoords.y,
//           };
//           drawSprite(cellCoords);
//         }
//         break;
//       case "s": // south
//         if (cell.s == true) {
//           removeSprite(cellCoords);
//           cellCoords = {
//             x: cellCoords.x,
//             y: cellCoords.y + Math.ceil(speed),
//           };
//           drawSprite(cellCoords);
//         }
//         break;
//     }
//   };

//   this.bindKeyDown = function () {
//     window.addEventListener("keydown", check, false);

//     $("#view").swipe({
//       swipe: function (
//         event,
//         direction,
//         distance,
//         duration,
//         fingerCount,
//         fingerData
//       ) {
//         console.log(direction);
//         switch (direction) {
//           case "up":
//             check({
//               keyCode: 38,
//             });
//             break;
//           case "down":
//             check({
//               keyCode: 40,
//             });
//             break;
//           case "left":
//             check({
//               keyCode: 37,
//             });
//             break;
//           case "right":
//             check({
//               keyCode: 39,
//             });
//             break;
//         }
//       },
//       threshold: 0,
//     });
//   };

//   this.unbindKeyDown = function () {
//     window.removeEventListener("keydown", check, false);
//     $("#view").swipe("destroy");
//   };

//   drawSprite(maze.startCoord());

//   this.bindKeyDown();
// }

// update();

var mazeCanvas = document.getElementById("mazeCanvas");
var ctx = mazeCanvas.getContext("2d");
var sprite;
var finishSprite;
var maze, draw, player;
var cellSize;
var difficulty;

window.onload = function () {
  let viewWidth = $("#view").width();
  let viewHeight = $("#view").height();
  if (viewHeight < viewWidth) {
    ctx.canvas.width = viewHeight - viewHeight / 100;
    ctx.canvas.height = viewHeight - viewHeight / 100;
  } else {
    ctx.canvas.width = viewWidth - viewWidth / 100;
    ctx.canvas.height = viewWidth - viewWidth / 100;
  }

  var completeOne = false;
  var completeTwo = false;
  var isComplete = () => {
    if (completeOne === true && completeTwo === true) {
      console.log("Runs");
      setTimeout(function () {
        makeMaze();
      }, 500);
    }
  };
  sprite = new Image();
  sprite.src = "./basketball300x300.png" + "?" + new Date().getTime();
  sprite.setAttribute("crossOrigin", " ");
  sprite.onload = function () {
    sprite = changeBrightness(1.2, sprite);
    completeOne = true;
    console.log(completeOne);
    isComplete();
  };

  finishSprite = new Image();
  finishSprite.src = "./home.png" + "?" + new Date().getTime();
  finishSprite.setAttribute("crossOrigin", " ");
  finishSprite.onload = function () {
    finishSprite = changeBrightness(1.1, finishSprite);
    completeTwo = true;
    console.log(completeTwo);
    isComplete();
  };

  window.addEventListener("deviceorientation", handleOrientation);
  update();
};

window.onresize = function () {
  let viewWidth = $("#view").width();
  let viewHeight = $("#view").height();
  if (viewHeight < viewWidth) {
    ctx.canvas.width = viewHeight - viewHeight / 100;
    ctx.canvas.height = viewHeight - viewHeight / 100;
  } else {
    ctx.canvas.width = viewWidth - viewWidth / 100;
    ctx.canvas.height = viewWidth - viewWidth / 100;
  }
  cellSize = mazeCanvas.width / difficulty;
  if (player != null) {
    draw.redrawMaze(cellSize);
    player.redrawPlayer(cellSize);
  }
};

function makeMaze() {
  if (player != undefined) {
    player.unbindKeyDown();
    player = null;
  }
  var e = document.getElementById("diffSelect");
  difficulty = e.options[e.selectedIndex].value;
  cellSize = mazeCanvas.width / difficulty;
  maze = new Maze(difficulty, difficulty);
  draw = new DrawMaze(maze, ctx, cellSize, finishSprite);
  player = new Player(maze, mazeCanvas, cellSize, displayVictoryMess, sprite);
  if (document.getElementById("mazeContainer").style.opacity < "100") {
    document.getElementById("mazeContainer").style.opacity = "100";
  }
}

var velocity = { x: 0, y: 0 };
var accelerationFactor = 0.1;
var friction = 0.95;

function handleOrientation(event) {
  var beta = event.beta; // In degree in the range [-180,180], forward/backward tilt
  var gamma = event.gamma; // In degree in the range [-90,90], left/right tilt

  velocity.x += gamma * accelerationFactor;
  velocity.y += beta * accelerationFactor;
}

function update() {
  velocity.x *= friction;
  velocity.y *= friction;

  if (player != null) {
    player.updatePosition(velocity.x, velocity.y);
  }

  requestAnimationFrame(update);
}

function Player(maze, c, _cellsize, onComplete, sprite = null) {
  var ctx = c.getContext("2d");
  var drawSprite;
  var moves = 0;
  drawSprite = drawSpriteCircle;
  if (sprite != null) {
    drawSprite = drawSpriteImg;
  }
  var player = this;
  var map = maze.map();
  var cellCoords = {
    x: maze.startCoord().x,
    y: maze.startCoord().y,
  };
  this.cellCoords = cellCoords;
  var cellSize = _cellsize;
  var halfCellSize = cellSize / 2;

  this.redrawPlayer = function (_cellsize) {
    cellSize = _cellsize;
    drawSpriteImg(cellCoords);
  };

  function drawSpriteCircle(coord) {
    ctx.beginPath();
    ctx.fillStyle = "yellow";
    ctx.arc(
      (coord.x + 1) * cellSize - halfCellSize,
      (coord.y + 1) * cellSize - halfCellSize,
      halfCellSize - 2,
      0,
      2 * Math.PI
    );
    ctx.fill();
    if (coord.x === maze.endCoord().x && coord.y === maze.endCoord().y) {
      onComplete(moves);
      player.unbindKeyDown();
    }
  }

  function drawSpriteImg(coord) {
    var offsetLeft = cellSize / 50;
    var offsetRight = cellSize / 25;
    ctx.drawImage(
      sprite,
      0,
      0,
      sprite.width,
      sprite.height,
      coord.x * cellSize + offsetLeft,
      coord.y * cellSize + offsetLeft,
      cellSize - offsetRight,
      cellSize - offsetRight
    );
    if (coord.x === maze.endCoord().x && coord.y === maze.endCoord().y) {
      onComplete(moves);
      player.unbindKeyDown();
    }
  }

  function removeSprite(coord) {
    var offsetLeft = cellSize / 50;
    var offsetRight = cellSize / 25;
    ctx.clearRect(
      coord.x * cellSize + offsetLeft,
      coord.y * cellSize + offsetLeft,
      cellSize - offsetRight,
      cellSize - offsetRight
    );
  }

  this.updatePosition = function (velX, velY) {
    var cell = map[cellCoords.x][cellCoords.y];
    var newCoords = { x: cellCoords.x, y: cellCoords.y };

    if (velX > 0.1 && cell.e) {
      newCoords.x += Math.min(velX, 1); // Move east
    } else if (velX < -0.1 && cell.w) {
      newCoords.x += Math.max(velX, -1); // Move west
    }
    if (velY > 0.1 && cell.s) {
      newCoords.y += Math.min(velY, 1); // Move south
    } else if (velY < -0.1 && cell.n) {
      newCoords.y += Math.max(velY, -1); // Move north
    }

    if (newCoords.x !== cellCoords.x || newCoords.y !== cellCoords.y) {
      removeSprite(cellCoords);
      cellCoords = newCoords;
      drawSprite(cellCoords);
      moves++;
    }
  };

  this.bindKeyDown = function () {
    window.addEventListener("keydown", check, false);

    $("#view").swipe({
      swipe: function (
        event,
        direction,
        distance,
        duration,
        fingerCount,
        fingerData
      ) {
        console.log(direction);
        switch (direction) {
          case "up":
            check({
              keyCode: 38,
            });
            break;
          case "down":
            check({
              keyCode: 40,
            });
            break;
          case "left":
            check({
              keyCode: 37,
            });
            break;
          case "right":
            check({
              keyCode: 39,
            });
            break;
        }
      },
      threshold: 0,
    });
  };

  this.unbindKeyDown = function () {
    window.removeEventListener("keydown", check, false);
    $("#view").swipe("destroy");
  };

  drawSprite(maze.startCoord());
  this.bindKeyDown();
}
