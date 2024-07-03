const express = require("express");
const path = require("path");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const port = 8080;

const cors = require("cors");
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const rollAroundCap = (cap, ball) => {
  // The direction the ball can't move any further because the wall holds it back
  let impactAngle = getAngle(ball, cap);

  // The direction the ball wants to move based on it's velocity
  let heading = getAngle(
    { x: 0, y: 0 },
    { x: ball.velocityX, y: ball.velocityY }
  );

  // The angle between the impact direction and the ball's desired direction
  // The smaller this angle is, the bigger the impact
  // The closer it is to 90 degrees the smoother it gets (at 90 there would be no collision)
  let impactHeadingAngle = impactAngle - heading;

  // Velocity distance if not hit would have occurred
  const velocityMagnitude = distance2D(
    { x: 0, y: 0 },
    { x: ball.velocityX, y: ball.velocityY }
  );
  // Velocity component diagonal to the impact
  const velocityMagnitudeDiagonalToTheImpact =
    Math.sin(impactHeadingAngle) * velocityMagnitude;

  // How far should the ball be from the wall cap
  const closestDistance = wallW / 2 + ballSize / 2;

  const rotationAngle = Math.atan(
    velocityMagnitudeDiagonalToTheImpact / closestDistance
  );

  const deltaFromCap = {
    x: Math.cos(impactAngle + Math.PI - rotationAngle) * closestDistance,
    y: Math.sin(impactAngle + Math.PI - rotationAngle) * closestDistance,
  };

  const x = ball.x;
  const y = ball.y;
  const velocityX = ball.x - (cap.x + deltaFromCap.x);
  const velocityY = ball.y - (cap.y + deltaFromCap.y);
  const nextX = x + velocityX;
  const nextY = y + velocityY;

  return { x, y, velocityX, velocityY, nextX, nextY };
};

// Angle between the two points
const getAngle = (p1, p2) => {
  let angle = Math.atan((p2.y - p1.y) / (p2.x - p1.x));
  if (p2.x - p1.x < 0) angle += Math.PI;
  return angle;
};

const closestItCanBe = (cap, ball) => {
  let angle = getAngle(cap, ball);

  const deltaX = Math.cos(angle) * (wallW / 2 + ballSize / 2);
  const deltaY = Math.sin(angle) * (wallW / 2 + ballSize / 2);

  return { x: cap.x + deltaX, y: cap.y + deltaY };
};

let sessions = [];
let players = [];
const pathW = 25; // Path width
const wallW = 10; // Wall width
const ballSize = 10; // Width and height of the ball
const holeSize = 18;

const distance2D = (p1, p2) => {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
};

const walls = [
  // Border
  { column: 0, row: 0, horizontal: true, length: 10 },
  { column: 0, row: 0, horizontal: false, length: 9 },
  { column: 0, row: 9, horizontal: true, length: 10 },
  { column: 10, row: 0, horizontal: false, length: 9 },

  // Horizontal lines starting in 1st column
  { column: 0, row: 6, horizontal: true, length: 1 },
  { column: 0, row: 8, horizontal: true, length: 1 },

  // Horizontal lines starting in 2nd column
  { column: 1, row: 1, horizontal: true, length: 2 },
  { column: 1, row: 7, horizontal: true, length: 1 },

  // Horizontal lines starting in 3rd column
  { column: 2, row: 2, horizontal: true, length: 2 },
  { column: 2, row: 4, horizontal: true, length: 1 },
  { column: 2, row: 5, horizontal: true, length: 1 },
  { column: 2, row: 6, horizontal: true, length: 1 },

  // Horizontal lines starting in 4th column
  { column: 3, row: 3, horizontal: true, length: 1 },
  { column: 3, row: 8, horizontal: true, length: 3 },

  // Horizontal lines starting in 5th column
  { column: 4, row: 6, horizontal: true, length: 1 },

  // Horizontal lines starting in 6th column
  { column: 5, row: 2, horizontal: true, length: 2 },
  { column: 5, row: 7, horizontal: true, length: 1 },

  // Horizontal lines starting in 7th column
  { column: 6, row: 1, horizontal: true, length: 1 },
  { column: 6, row: 6, horizontal: true, length: 2 },

  // Horizontal lines starting in 8th column
  { column: 7, row: 3, horizontal: true, length: 2 },
  { column: 7, row: 7, horizontal: true, length: 2 },

  // Horizontal lines starting in 9th column
  { column: 8, row: 1, horizontal: true, length: 1 },
  { column: 8, row: 2, horizontal: true, length: 1 },
  { column: 8, row: 3, horizontal: true, length: 1 },
  { column: 8, row: 4, horizontal: true, length: 2 },
  { column: 8, row: 8, horizontal: true, length: 2 },

  // Vertical lines after the 1st column
  { column: 1, row: 1, horizontal: false, length: 2 },
  { column: 1, row: 4, horizontal: false, length: 2 },

  // Vertical lines after the 2nd column
  { column: 2, row: 2, horizontal: false, length: 2 },
  { column: 2, row: 5, horizontal: false, length: 1 },
  { column: 2, row: 7, horizontal: false, length: 2 },

  // Vertical lines after the 3rd column
  { column: 3, row: 0, horizontal: false, length: 1 },
  { column: 3, row: 4, horizontal: false, length: 1 },
  { column: 3, row: 6, horizontal: false, length: 2 },

  // Vertical lines after the 4th column
  { column: 4, row: 1, horizontal: false, length: 2 },
  { column: 4, row: 6, horizontal: false, length: 1 },

  // Vertical lines after the 5th column
  { column: 5, row: 0, horizontal: false, length: 2 },
  { column: 5, row: 6, horizontal: false, length: 1 },
  { column: 5, row: 8, horizontal: false, length: 1 },

  // Vertical lines after the 6th column
  { column: 6, row: 4, horizontal: false, length: 1 },
  { column: 6, row: 6, horizontal: false, length: 1 },

  // Vertical lines after the 7th column
  { column: 7, row: 1, horizontal: false, length: 4 },
  { column: 7, row: 7, horizontal: false, length: 2 },

  // Vertical lines after the 8th column
  { column: 8, row: 2, horizontal: false, length: 1 },
  { column: 8, row: 4, horizontal: false, length: 2 },

  // Vertical lines after the 9th column
  { column: 9, row: 1, horizontal: false, length: 1 },
  { column: 9, row: 5, horizontal: false, length: 2 },
].map((wall) => ({
  x: wall.column * (pathW + wallW),
  y: wall.row * (pathW + wallW),
  horizontal: wall.horizontal,
  length: wall.length * (pathW + wallW),
}));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "player.html"));
});

app.get("/game", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "game.html"));
});

app.get("/playerView", (req, res) => {
  const queryParam = req.query.q;
  console.log("Query Parameter:", queryParam); // Log the query parameter
  res.sendFile(path.join(__dirname, "public", "html", "playerView.html"));
});

// Socket.IO Handling
io.on("connection", (socket) => {
  const playerId = socket.id;
  console.log(`New user connected. Current player id:: ${playerId}`);
  //enter a new ball in balls.
  newPlayer(playerId);

  socket.on("MazeMoves", (data) => {
    console.log("Maze wants to move now.");
    // console.log(data);
    let {
      velocityChangeX,
      velocityChangeY,
      frictionDeltaX,
      frictionDeltaY,
      accelerationX,
      accelerationY,
      frictionX,
      frictionY,
      timeElapsed,
      maxVelocity,
      debugMode,
    } = data;

    // Example usage:
    // const accelerationX = 0.5; // Example acceleration values
    // const accelerationY = -0.2;
    // const frictionX = 0.1; // Example friction values
    // const frictionY = 0.1;
    // const timeElapsed = 0.1; // Example time elapsed
    // //const walls = []; // Array of walls (define your walls here)
    // const maxVelocity = 1.5; // Example maximum velocity
    // const debugMode = false; // Debug mode flag

    players.forEach((player) => {
      updateBallPhysics(
        player.ball,
        velocityChangeX,
        velocityChangeY,
        frictionDeltaX,
        frictionDeltaY,
        accelerationX,
        accelerationY,
        frictionX,
        frictionY,
        timeElapsed,
        maxVelocity,
        debugMode
      );
    });

    players.forEach((player) => {
      console.log(
        `Player ${player.playerId} - x: ${player.ball.x}, y: ${player.ball.y}, velocityX: ${player.ball.velocityX}, velocityY: ${player.ball.velocityY}`
      );
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", playerId);
    players.forEach((player, index) => {
      if (player.playerId === playerId) {
        players.splice(index, 1); // Remove 1 element at the current index
      }
    });

    console.log(players);
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

setInterval(() => {
  io.emit("updatePlayers", players);
}, 1); // 1 millisecond interval

//   balls = [
//     { column: 0, row: 0 },
//     { column: 9, row: 0 },
//     { column: 0, row: 8 },
//     { column: 9, row: 8 },
function newPlayer(playerId) {
  if (players.length == 0) {
    let newBall = {
      x: 0 * (wallW + pathW) + (wallW / 2 + pathW / 2),
      y: 0 * (wallW + pathW) + (wallW / 2 + pathW / 2),
      velocityX: 0,
      velocityY: 0,
    };
    console.log(newBall);
    players.push({ playerId: playerId, ball: newBall });
    console.log(players);
  } else if (players.length == 1) {
    let newBall = {
      x: 9 * (wallW + pathW) + (wallW / 2 + pathW / 2),
      y: 0 * (wallW + pathW) + (wallW / 2 + pathW / 2),
      velocityX: 0,
      velocityY: 0,
    };
    console.log(newBall);
    players.push({ playerId: playerId, ball: newBall });
    console.log(players);
  } else if (players.length == 2) {
    let newBall = {
      x: 0 * (wallW + pathW) + (wallW / 2 + pathW / 2),
      y: 8 * (wallW + pathW) + (wallW / 2 + pathW / 2),
      velocityX: 0,
      velocityY: 0,
    };
    console.log(newBall);
    players.push({ playerId: playerId, ball: newBall });
    console.log(players);
  } else if (players.length == 3) {
    let newBall = {
      x: 9 * (wallW + pathW) + (wallW / 2 + pathW / 2),
      y: 8 * (wallW + pathW) + (wallW / 2 + pathW / 2),
      velocityX: 0,
      velocityY: 0,
    };
    console.log(newBall);
    players.push({ playerId: playerId, ball: newBall });
    console.log(players);
  }
}

function moveBalls() {}

// // Assuming 'players' array is defined as follows:
// let players = [
//   {
//     playerId: 'Vri5komHgndwBH78AAAC',
//     ball: { x: 17.5, y: 17.5, velocityX: 0, velocityY: 0 }
//   },
//   {
//     playerId: 'lUpMBeQ_IjUPBI9jAAAL',
//     ball: { x: 332.5, y: 17.5, velocityX: 0, velocityY: 0 }
//   }
// ];

// Function to update ball properties
function updateBallPhysics(
  ball,
  velocityChangeX,
  velocityChangeY,
  frictionDeltaX,
  frictionDeltaY,
  accelerationX,
  accelerationY,
  frictionX,
  frictionY,
  timeElapsed,
  maxVelocity,
  debugMode
) {
  //console.log(walls);
  if (accelerationX !== undefined && accelerationY !== undefined) {
    // const velocityChangeX = accelerationX * timeElapsed;
    // const velocityChangeY = accelerationY * timeElapsed;
    // const frictionDeltaX = frictionX * timeElapsed;
    // const frictionDeltaY = frictionY * timeElapsed;

    if (velocityChangeX === 0) {
      ball.velocityX = slow(ball.velocityX, frictionDeltaX);
    } else {
      //   ball.velocityX += velocityChangeX;
      //   ball.velocityX = Math.max(Math.min(ball.velocityX, 1.5), -1.5);
      //   ball.velocityX -= Math.sign(velocityChangeX) * frictionDeltaX;
      //   ball.velocityX = clamp(ball.velocityX, -maxVelocity, maxVelocity);
      ball.velocityX = ball.velocityX + velocityChangeX;
      ball.velocityX = Math.max(Math.min(ball.velocityX, 1.5), -1.5);
      ball.velocityX =
        ball.velocityX - Math.sign(velocityChangeX) * frictionDeltaX;
      ball.velocityX = Math.minmax(ball.velocityX, maxVelocity);
    }

    if (velocityChangeY === 0) {
      ball.velocityY = slow(ball.velocityY, frictionDeltaY);
    } else {
      //   ball.velocityY += velocityChangeY;
      //   ball.velocityY -= Math.sign(velocityChangeY) * frictionDeltaY;
      //   ball.velocityY = clamp(ball.velocityY, -maxVelocity, maxVelocity);
      ball.velocityY = ball.velocityY + velocityChangeY;
      ball.velocityY =
        ball.velocityY - Math.sign(velocityChangeY) * frictionDeltaY;
      ball.velocityY = Math.minmax(ball.velocityY, maxVelocity);
    }

    ball.nextX = ball.x + ball.velocityX;
    ball.nextY = ball.y + ball.velocityY;

    walls.forEach((wall, wi) => {
      if (wall.horizontal) {
        // Horizontal wall

        if (
          ball.nextY + ballSize / 2 >= wall.y - wallW / 2 &&
          ball.nextY - ballSize / 2 <= wall.y + wallW / 2
        ) {
          // Ball got within the strip of the wall
          // (not necessarily hit it, could be before or after)

          const wallStart = {
            x: wall.x,
            y: wall.y,
          };
          const wallEnd = {
            x: wall.x + wall.length,
            y: wall.y,
          };

          if (
            ball.nextX + ballSize / 2 >= wallStart.x - wallW / 2 &&
            ball.nextX < wallStart.x
          ) {
            // Ball might hit the left cap of a horizontal wall
            const distance = distance2D(wallStart, {
              x: ball.nextX,
              y: ball.nextY,
            });
            if (distance < ballSize / 2 + wallW / 2) {
              if (debugMode && wi > 4)
                console.warn("too close h head", distance, ball);

              // Ball hits the left cap of a horizontal wall
              const closest = closestItCanBe(wallStart, {
                x: ball.nextX,
                y: ball.nextY,
              });
              const rolled = rollAroundCap(wallStart, {
                x: closest.x,
                y: closest.y,
                velocityX: ball.velocityX,
                velocityY: ball.velocityY,
              });

              Object.assign(ball, rolled);
            }
          }

          if (
            ball.nextX - ballSize / 2 <= wallEnd.x + wallW / 2 &&
            ball.nextX > wallEnd.x
          ) {
            // Ball might hit the right cap of a horizontal wall
            const distance = distance2D(wallEnd, {
              x: ball.nextX,
              y: ball.nextY,
            });
            if (distance < ballSize / 2 + wallW / 2) {
              if (debugMode && wi > 4)
                console.warn("too close h tail", distance, ball);

              // Ball hits the right cap of a horizontal wall
              const closest = closestItCanBe(wallEnd, {
                x: ball.nextX,
                y: ball.nextY,
              });
              const rolled = rollAroundCap(wallEnd, {
                x: closest.x,
                y: closest.y,
                velocityX: ball.velocityX,
                velocityY: ball.velocityY,
              });

              Object.assign(ball, rolled);
            }
          }

          if (ball.nextX >= wallStart.x && ball.nextX <= wallEnd.x) {
            // The ball got inside the main body of the wall
            if (ball.nextY < wall.y) {
              // Hit horizontal wall from top
              ball.nextY = wall.y - wallW / 2 - ballSize / 2;
            } else {
              // Hit horizontal wall from bottom
              ball.nextY = wall.y + wallW / 2 + ballSize / 2;
            }
            ball.y = ball.nextY;
            ball.velocityY = -ball.velocityY / 3;

            if (debugMode && wi > 4)
              console.error("crossing h line, HIT", ball);
          }
        }
      } else {
        // Vertical wall

        if (
          ball.nextX + ballSize / 2 >= wall.x - wallW / 2 &&
          ball.nextX - ballSize / 2 <= wall.x + wallW / 2
        ) {
          // Ball got within the strip of the wall
          // (not necessarily hit it, could be before or after)

          const wallStart = {
            x: wall.x,
            y: wall.y,
          };
          const wallEnd = {
            x: wall.x,
            y: wall.y + wall.length,
          };

          if (
            ball.nextY + ballSize / 2 >= wallStart.y - wallW / 2 &&
            ball.nextY < wallStart.y
          ) {
            // Ball might hit the top cap of a horizontal wall
            const distance = distance2D(wallStart, {
              x: ball.nextX,
              y: ball.nextY,
            });
            if (distance < ballSize / 2 + wallW / 2) {
              if (debugMode && wi > 4)
                console.warn("too close v head", distance, ball);

              // Ball hits the left cap of a horizontal wall
              const closest = closestItCanBe(wallStart, {
                x: ball.nextX,
                y: ball.nextY,
              });
              const rolled = rollAroundCap(wallStart, {
                x: closest.x,
                y: closest.y,
                velocityX: ball.velocityX,
                velocityY: ball.velocityY,
              });

              Object.assign(ball, rolled);
            }
          }

          if (
            ball.nextY - ballSize / 2 <= wallEnd.y + wallW / 2 &&
            ball.nextY > wallEnd.y
          ) {
            // Ball might hit the bottom cap of a horizontal wall
            const distance = distance2D(wallEnd, {
              x: ball.nextX,
              y: ball.nextY,
            });
            if (distance < ballSize / 2 + wallW / 2) {
              if (debugMode && wi > 4)
                console.warn("too close v tail", distance, ball);

              // Ball hits the right cap of a horizontal wall
              const closest = closestItCanBe(wallEnd, {
                x: ball.nextX,
                y: ball.nextY,
              });
              const rolled = rollAroundCap(wallEnd, {
                x: closest.x,
                y: closest.y,
                velocityX: ball.velocityX,
                velocityY: ball.velocityY,
              });

              Object.assign(ball, rolled);
            }
          }

          if (ball.nextY >= wallStart.y && ball.nextY <= wallEnd.y) {
            // The ball got inside the main body of the wall
            if (ball.nextX < wall.x) {
              // Hit vertical wall from left
              ball.nextX = wall.x - wallW / 2 - ballSize / 2;
            } else {
              // Hit vertical wall from right
              ball.nextX = wall.x + wallW / 2 + ballSize / 2;
            }
            ball.x = ball.nextX;
            ball.velocityX = -ball.velocityX / 3;

            if (debugMode && wi > 4)
              console.error("crossing v line, HIT", ball);
          }
        }
      }
    });

    // Additional logic for holes (if needed)

    ball.x = ball.nextX;
    ball.y = ball.nextY;
  }
}

// After updating, you can access the updated positions and velocities:
players.forEach((player) => {
  console.log(
    `Player ${player.playerId} - x: ${player.ball.x}, y: ${player.ball.y}, velocityX: ${player.ball.velocityX}, velocityY: ${player.ball.velocityY}`
  );
});

const slow = (number, difference) => {
  if (Math.abs(number) <= difference) return 0;
  if (number > difference) return number - difference;
  return number + difference;
};

Math.minmax = (value, limit) => {
  return Math.max(Math.min(value, limit), -limit);
};
