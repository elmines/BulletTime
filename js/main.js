const WIDTH = window.innerWidth,
  HEIGHT = window.innerHeight;
const FOV = 42.5, //field of view is angle of observable world (45-75 standard)
  ASPECT = WIDTH / HEIGHT, //difference between horizontal FOV and vertical FOV
  NEAR = 0.1, //distance from camera (usually small)
  FAR = 2000; //distance camera (usually larger)
const NUM_CUBES = 10;

var scene = new THREE.Scene(); //container for everything, all obects added here to be displayed in browser
var camera = new THREE.PerspectiveCamera(FOV, ASPECT, NEAR, FAR); //camera is how we see everything
scene.add(new THREE.HemisphereLight(0xaaaaaa, 0xffffff, 1.0));

var cam_width = camera.getFilmWidth();
var cam_height = camera.getFilmHeight();

camera.position.z = 10; //moves camera back 5 units
camera.position.y = 0; //positions camera above origin

var renderer = new THREE.WebGLRenderer(); //displays scene
renderer.setSize(WIDTH, HEIGHT);
document.body.appendChild(renderer.domElement);

let gameover = false;

function EventLoop() {
    MoveCubes(cubes, bulletTime);
    renderer.render(scene, camera);

    if(!gameover)
      setTimeout(EventLoop, 20);
}

setTimeout(EventLoop, 20);

// Create the cube
var cubes = [];
for (var i = 0; i < NUM_CUBES; ++i){
    cubes.push(RandomCube(i));
}

cubes.forEach(function(cube) {
  scene.add(cube);
});

bulletTime = false;

function RandomCube(color_index) {
  var possible_object_colors = [
    0xf69243,
    0xf6f043,
    0xffffff,
    0x5ef2a4,
    0x5c5cff,
    0x5ef2d1,
    0x5ec4f2,
    0x8684f6,
    0xd184f6,
    0xe84f63
  ];
  var geometry = new THREE.BoxBufferGeometry(1, 1, 1);
  var material = new THREE.MeshLambertMaterial({
    color: possible_object_colors[color_index]
  });
  MAX_DISPLACEMENT = 9;

  var cube = new THREE.Mesh(geometry, material);
  cube.translateZ(-5);
  cube.translateX((Math.random() - 0.5) * MAX_DISPLACEMENT * 2);
  cube.translateY((Math.random() - 0.5) * MAX_DISPLACEMENT * 2);
  return cube;
}

// Use these to keep up with which direciton the objects were previously moving in.
var cube_directions_x = [];
var cube_directions_y = [];
for (var i = 0; i < 10; i++) {
  var rand_power = Math.ceil(Math.random());
  var rand_base_number = Math.random() % 2;
  var rand_direction_x = rand_base_number * (-1) ** rand_power;
  cube_directions_x.push(rand_direction_x);
  var rand_power2 = Math.ceil(Math.random());
  var rand_base_number2 = Math.random() % 2;
  var rand_direction_y = rand_base_number2 * (-1) ** rand_power2;
  cube_directions_y.push(rand_direction_y);
}

function MoveCubes(cubes, bulletTime) {
  for (i = 0; i < cubes.length; i++) {
    MoveCube(cubes[i], bulletTime, i);
  }
}

function DeleteAtIndex(cubes, index) {
  scene.remove(cube[index]);
  cubes.splice(index, 1);
}

function MoveCube(cube, bulletTime, cube_index) {
  var speed = bulletTime ? 0.01 : 0.03;

  // See if the cube has reached a boundary. If so, send it the oposite direction, by updating the directional vectors.
  if (cube.position.x > 10 - 1) {
    cube_directions_x[cube_index] = -1;
  } else if (cube.position.x < -10 + 1) {
    cube_directions_x[cube_index] = 1;
  }

  if (cube.position.y > 5 - 1) {
    cube_directions_y[cube_index] = -1;
  } else if (cube.position.y < -5 + 1) {
    cube_directions_y[cube_index] = 1;
  }
  cube.position.x += speed * cube_directions_x[cube_index];
  cube.position.y += speed * cube_directions_y[cube_index];
}

// This script sets up a bunch of coins that we can get.
var coins = [];
var num_coins = 50;
for (var i = 0; i < num_coins; i++) {
  var coin_geom = new THREE.SphereBufferGeometry(0.2, 32, 32);
  var material = new THREE.MeshLambertMaterial({ color: 0xffcc00 });
  MAX_DISPLACEMENT = 9;
  var coin = new THREE.Mesh(coin_geom, material);
  scene.add(coin);
  coin.translateZ(-5);
  coin.translateX((Math.random() - 0.5) * MAX_DISPLACEMENT * 2);
  coin.translateY((Math.random() - 0.5) * MAX_DISPLACEMENT * 2);
  coins.push(coin);
}

// This is where the clicker is set up.
var clicking_geometry = new THREE.SphereGeometry(0.4, 32, 32);
var not_clicking_geometry = new THREE.SphereGeometry(0.4, 32, 32);
var clicking_material = new THREE.MeshLambertMaterial({ color: 0x006600 });
var not_clicking_material = new THREE.MeshLambertMaterial({ color: 0x00cc66 });

var clicker = new THREE.Mesh(not_clicking_geometry, not_clicking_material);
scene.add(clicker);
clicker.position.x = 0;
clicker.position.y = 0;
clicker.position.z = -5;

var move_clicker_to_position = function(x_pos, y_pos) {
  // Xpos and Ypos come directly from the sensor.
  // X range on that is -160 to 160.
  // Y range on that is 100 to 460.
  // Use the camera width and height to control how far left and right and up and down the paddles can go.
  /*
                The math to use:
                (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
                */

  var cam_width_range = cam_width;
  var cam_height_range = cam_height;
  var input_x_min = -100;
  var input_x_max = 100;
  var input_y_min = 150;
  var input_y_max = 300;

  var calibrated_x =
    ((x_pos - input_x_min) * cam_width) / (input_x_max - input_x_min) -
    cam_width / 2;
  var calibrated_y =
    ((y_pos - input_y_min) * cam_height) / (input_y_max - input_y_min) -
    cam_height / 2.5;

  clicker.position.x = calibrated_x;
  clicker.position.y = calibrated_y;
  renderer.render(scene, camera);
};

var click_clicker = function() {
  clicker.geometry = clicking_geometry;
  clicker.material = clicking_material;
};

var unclick_clicker = function() {
  clicker.geometry = not_clicking_geometry;
  clicker.material = not_clicking_material;
};

var find_index_of_block_by_color = function(block) {
  var the_block = new THREE.Mesh(block);
  for (var i = 0; i < cubes.length; i++) {
    console.log(cubes[i].material.color);
    console.log(the_block.material.color);

    if (cubes[i].material.color == the_block.material.color) {
      console.log("the index selected is: " + i);
      return i;
    }
  }
  return -1;
};

var move_block_with_clicker = function(block, x_pos, y_pos) {
  // Use the blocks color to find it in the list of moving blocks.
  var block_index = find_index_of_block_by_color(block);

  // Take block out of the list of moving randomly blocks.
  if (block_index != -1) {
    cube_directions_x.splice(block_index, 1);
    cube_directions_y.splice(block_index, 1);
    cubes.splice(block_index, 1);
  }

  // Then, move it just like we move it with the mouse.
  var input_x_min = -160;
  var input_x_max = 160;
  var input_y_min = 100;
  var input_y_max = 460;
  var calibrated_x =
    ((x_pos - input_x_min) * cam_width) / (input_x_max - input_x_min) -
    cam_width / 2;
  var calibrated_y =
    ((y_pos - input_y_min) * cam_height) / (input_y_max - input_y_min) -
    cam_height / 2.5;
  block.position.x = calibrated_x;
  block.position.y = calibrated_y;
  renderer.render(scene, camera);
};

// Store frame for motion functions
var paused = false;
var pauseOnGesture = false;

// Setup Leap loop with frame callback function
var controllerOptions = { enableGestures: true };

// to use HMD mode:
// controllerOptions.optimizeHMD = true;

Leap.loop(controllerOptions, function(frame) {
    if (paused || frame.hands.length == 0) {
        return; // Skip this update
    }

    // Get first hand
    let hand = frame.hands[0];

    // Move cursor to hand position. For this, we hold the sensor where the front facing camera of the computer would be.
    move_clicker_to_position(hand.palmPosition[0], hand.palmPosition[1]);

    // Check to see if closed fist or not.
    if (hand.pinchStrength > 0.4) {
    click_clicker();
    } else {
    unclick_clicker();
    }

    // Test for if it is hitting a cube.
    var playerBB = new THREE.Box3().setFromObject(clicker);
    for (var i = 0; i < cubes.length; i++) {
    var cubeBB = new THREE.Box3().setFromObject(cubes[i]);
    if (playerBB.intersectsBox(cubeBB) || typeof abc !== "undefined") {
        // The player has hit a cube
        console.log("The player has hit a cube");
        console.log("GameOver");
        gameover = true;
        document.getElementById("gameoverMessage").style.display = "block";
    }
    }

    // Here is a score keeping variable. We could display it or something?
    var score = 0;

    // Test for if it is collecting a coin.
    for (var i = 0; i < coins.length; i++) {
    var coinBB = new THREE.Box3().setFromObject(coins[i]);
    if (playerBB.intersectsBox(coinBB)) {
        // The player has collected a coin.
        console.log(" The player has collected a coin.");
        scene.remove(coins[i]);
        coins.splice(i, 1);
        score += 1;
    }
    }
});

function vectorToString(vector, digits) {
  if (typeof digits === "undefined") {
    digits = 1;
  }
  return (
    "(" +
    vector[0].toFixed(digits) +
    ", " +
    vector[1].toFixed(digits) +
    ", " +
    vector[2].toFixed(digits) +
    ")"
  );
}

function togglePause() {
  paused = !paused;

  if (paused) {
    document.getElementById("pause").innerText = "Resume";
  } else {
    document.getElementById("pause").innerText = "Pause";
  }
}

function pauseForGestures() {
  if (document.getElementById("pauseOnGesture").checked) {
    pauseOnGesture = true;
  } else {
    pauseOnGesture = false;
  }
}
