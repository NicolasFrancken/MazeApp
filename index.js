// Matter
const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const cellsHorizontal = 10;
const cellsVertical = 10;
const width = window.innerWidth - 4;
const height = window.innerHeight - 4;

const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;

const engine = Engine.create();
engine.world.gravity.y = 0;

const { world } = engine;
const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    wireframes: false,
    width,
    height,
  },
});
Render.run(render);
Runner.run(Runner.create(), engine);

// Walls
const walls = [
  Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
  Bodies.rectangle(width / 2, height, width, 2, {
    isStatic: true,
  }),
  Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
  Bodies.rectangle(width, height / 2, 2, height, {
    isStatic: true,
  }),
];
World.add(world, walls);

// Maze generation
const shuffle = (arr) => {
  let counter = arr.length;

  while (counter > 0) {
    const index = Math.floor(Math.random() * counter);

    counter--;

    const temporary = arr[counter];
    arr[counter] = arr[index];
    arr[index] = temporary;
  }
  return arr;
};

const grid = Array(cellsVertical) //"Array(3)" crea un array con solo 3 posibles lugares
  .fill(null) //"fill" llena esos lugares
  .map(() => Array(cellsHorizontal).fill(false));

const verticals = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal - 1).fill(false));

const horizontals = Array(cellsVertical - 1)
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false));

const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

const stepThroughCell = (row, column) => {
  // if we have visited that cell at [row][column], then return
  if (grid[row][column]) {
    return;
  }

  // mark this cell as being visited
  grid[row][column] = true;

  // assemble randomly-ordered list of neighbors
  const neighbors = shuffle([
    [row - 1, column, "up"],
    [row, column + 1, "right"],
    [row + 1, column, "down"],
    [row, column - 1, "left"],
  ]);

  // for each neighbor
  for (let neighbor of neighbors) {
    const [nextRow, nextColumn, direction] = neighbor; //array destructuring

    // see if that neighbor is out of bounds
    if (
      nextRow < 0 ||
      nextRow >= cellsVertical ||
      nextColumn < 0 ||
      nextColumn >= cellsHorizontal
    ) {
      continue; //no hagas nada mas, pero continua con el loop (no ejecutará las lineas de mas abajo, solo pasará a la siguiente iteración)
    }

    // if we visited that neighbor, continue to next neighbor
    if (grid[nextRow][nextColumn]) {
      continue;
    }

    // remove a wall from either horizontals or verticals
    if (direction === "left") {
      verticals[row][column - 1] = true;
    } else if (direction === "right") {
      verticals[row][column] = true;
    } else if (direction === "up") {
      horizontals[row - 1][column] = true;
    } else if (direction === "down") {
      horizontals[row][column] = true;
    }

    stepThroughCell(nextRow, nextColumn);
  }
  // visit the next cell
};

stepThroughCell(startRow, startColumn);

horizontals.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) {
      return;
    }

    const wall = Bodies.rectangle(
      //estas ecuaciones me dan el centro de los segmentos horizontales
      columnIndex * unitLengthX + unitLengthX / 2,
      rowIndex * unitLengthY + unitLengthY,
      unitLengthX,
      10,
      {
        isStatic: true,
        label: "wall",
        render: { fillStyle: "white" },
      }
    );
    World.add(world, wall);
  });
});

verticals.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) {
      return;
    }

    const wall = Bodies.rectangle(
      columnIndex * unitLengthX + unitLengthX,
      rowIndex * unitLengthY + unitLengthY / 2,
      10,
      unitLengthY,
      {
        isStatic: true,
        label: "wall",
        render: { fillStyle: "white" },
      }
    );
    World.add(world, wall);
  });
});

// Goal
const goal = Bodies.rectangle(
  width - unitLengthX / 2,
  height - unitLengthY / 2,
  unitLengthX * 0.3,
  unitLengthY * 0.3,
  {
    isStatic: true,
    label: "goal",
    render: { fillStyle: "green" },
  }
);
World.add(world, goal);

// Ball
const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(unitLengthX / 2, unitLengthY / 2, ballRadius, {
  label: "ball",
  render: { fillStyle: "grey" },
});
World.add(world, ball);

document.addEventListener("keydown", (event) => {
  const { x, y } = ball.velocity;

  if (event.key === "w") {
    Body.setVelocity(ball, { x, y: y - 5 }); //añado velocidad al objeto
  }
  if (event.key === "d") {
    Body.setVelocity(ball, { x: x + 5, y });
  }
  if (event.key === "s") {
    Body.setVelocity(ball, { x, y: y + 5 });
  }
  if (event.key === "a") {
    Body.setVelocity(ball, { x: x - 5, y });
  }
});

// Win condition
Events.on(engine, "collisionStart", (event) => {
  event.pairs.forEach((collision) => {
    //pongo "forEach" porque se sobreescribe (continuamente) el array que contiene los datos (esto sucede pq Matter funciona asi)
    //con el "forEach" aggarro cada array antes de que se sobreescriba y uso los datos de adentro
    const labels = ["ball", "goal"];

    if (
      labels.includes(collision.bodyA.label) &&
      labels.includes(collision.bodyB.label)
    ) {
      document.querySelector(".winner").classList.remove("hidden");
      world.gravity.y = -1;
      world.bodies.forEach((body) => {
        if (body.label === "wall") {
          Body.setStatic(body, false);
        }
      });
      world.bodies.forEach((body) => {
        if (body.label === "goal") {
          Body.setStatic(body, false);
        }
      });
    }
  });
});
