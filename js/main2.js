//boolean pinching
//boolean grabbing
//double leftPositonX leftPositionY leftPositionZ rightPositionX rightPositionY rightPositionZ
//double leftRotationX leftRotationY leftRotationZ rightRotationX rightRotationY rightRotationZ
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
//console.log("camera width: " + camera.getFilmWidth())
//console.log("camera hgt: " + camera.getFilmHeight())
var cam_width = camera.getFilmWidth();
var cam_height = camera.getFilmHeight();

camera.position.z = 10; //moves camera back 5 units
camera.position.y = 0; //positions camera above origin
var renderer = new THREE.WebGLRenderer({alpha:true}); //displays scene
renderer.setSize(WIDTH, HEIGHT);
document.body.appendChild(renderer.domElement);

var dodged_cubes = [];
var cubes = [];
for (var i = 0; i < NUM_CUBES; ++i) cubes.push(RandomCube());
cubes.forEach(function(cube) {
  scene.add(cube);
});
bulletTime = false;
let gameover = false;
//change bulletTime bool based on Pierce's concentration algorithm
function EventLoop() {
  for (var i = 0; i < dodged_cubes.length; i++) {
    fancy_matrix_move_bullet_goes_off_screen(dodged_cubes[i]);
  }

  MoveCubesForward(cubes, bulletTime);
  if (cubes.some(pastCamera)) gameOver();
  Animate();

  if(!gameover)
    setTimeout(EventLoop, 20);
}

function gameOver() {
    gameover = true;
    console.log("gameover");
    document.getElementById("gameoverMessage").style.display = "block";
}

function RandomCube() {
  var geometry = new THREE.SphereBufferGeometry(0.5, 16, 64);
  var material = new THREE.MeshLambertMaterial({ color: RandomColor() });
  MAX_DISPLACEMENT = 9;
  var cube = new THREE.Mesh(geometry, material);
  cube.translateZ(-15);
  cube.translateX((Math.random() - 0.5) * MAX_DISPLACEMENT * 2);
  cube.translateY((Math.random() - 0.5) * MAX_DISPLACEMENT * 2);
  cube.translateZ((Math.random() - 0.5) * MAX_DISPLACEMENT * 2);
  return cube;
}
function RandomColor() {
  num = Math.random();
  if (num < 0.1) {
    color = 0xf69243;
  } else if (num < 0.2) {
    color = 0xf6f043;
  } else if (num < 0.3) {
    color = 0xaff25e;
  } else if (num < 0.4) {
    color = 0x5ef2a4;
  } else if (num < 0.5) {
    color = 0x5c5cff;
  } else if (num < 0.6) {
    color = 0x5ef2d1;
  } else if (num < 0.7) {
    color = 0x5ec4f2;
  } else if (num < 0.8) {
    color = 0x8684f6;
  } else if (num < 0.9) {
    color = 0xd184f6;
  } else if (num < 1.0) {
    color = 0xe84f63;
  }
  return color;
}
function pastCamera(cube) {
  return cube.position.z > camera.position.z;
}
function MoveCubesForward(cubes, bulletTime) {
  cubes.forEach(function(cube) {
    MoveForward(cube);
  });
}
function DeleteAtIndex(cubes, index) {
  scene.remove(cube[index]);
  cubes.splice(index, 1);
}
function Animate() {
  renderer.render(scene, camera); //continues to display scene on each animation call
}
function MoveForward(cube, bulletTime) {
  var dist = bulletTime ? 0.01 : 0.03;
  cube.position.x /= 1.002;
  cube.position.y /= 1.002;
  cube.position.z += dist;
}

function fancy_matrix_move_bullet_goes_off_screen(the_bullet) {
  var dist = bulletTime ? -0.01 : -0.03;
  if (the_bullet.position.x < 0) {
    the_bullet.position.x -= 0.02;
  } else {
    the_bullet.position.x += 0.02;
  }
  if (the_bullet.position.y < 0) {
    the_bullet.position.y -= 0.02;
  } else {
    the_bullet.position.y += 0.02;
  }
}

// This is where the left and right paddles are set up.
var paddle = new THREE.BoxGeometry(0.5, 0.5, 0.5);
var fist = new THREE.BoxGeometry(0.5, 0.5, 0.5);
var material1 = new THREE.MeshLambertMaterial({ color: 0x005500 });
var material2 = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
var right_paddle = new THREE.Mesh(paddle, material1);
scene.add(right_paddle);
right_paddle.position.x = 5;
right_paddle.position.y = 0;
right_paddle.position.z = 1;
var move_right_paddle_to_position = function(x_pos, y_pos, z_pos) {
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
  var input_x_min = -160;
  var input_x_max = 160;
  var input_y_min = 50;
  var input_y_max = 460;
  var input_z_min = -100;
  var input_z_max = 100;
  //var calibrated_x = (x_pos > 1) ? ((x_pos - input_x_min)*(cam_width)/(input_x_max - input_x_min) - cam_width/2)  : 1;
  var calibrated_x =
    ((x_pos - input_x_min) * cam_width) / (input_x_max - input_x_min) -
    cam_width / 2;
  var calibrated_y =
    ((y_pos - input_y_min) * cam_height) / (input_y_max - input_y_min) -
    cam_height / 2.5;
  var calibrated_z =
    ((z_pos - input_z_min) * 4) / (input_z_max - input_z_min) + 1;
  //console.log("\n\n\n  CALIBRATED Y = " + calibrated_y)
  //requestAnimationFrame(animate);
  //console.log("new x = " + x_pos)
  //console.log("new y = " + y_pos)
  right_paddle.position.x = calibrated_x;
  right_paddle.position.y = calibrated_y;
  right_paddle.position.z = calibrated_z;
  renderer.render(scene, camera);
};
var make_right_hand_fist = function() {
  right_paddle.geometry = fist;
};

var open_right_hand = function() {
  right_paddle.geometry = paddle;
};

// Store frame for motion functions
var previousFrame = null;
var paused = false;
var pauseOnGesture = false;
// Setup Leap loop with frame callback function
var controllerOptions = { enableGestures: true };
// to use HMD mode:
// controllerOptions.optimizeHMD = true;
Leap.loop(controllerOptions, function(frame) {
  if (paused) {
    return; // Skip this update
  }
  if (frame.hands.length < 1) return;
  var hand = frame.hands[0];
  // Move cursor to hand position.
  move_right_paddle_to_position(
    hand.palmPosition[0],
    hand.palmPosition[1],
    hand.palmPosition[2]
  );
  // Check to see if closed fist or not.
  if (hand.grabStrength > 0.4) make_right_hand_fist();
  else open_right_hand();
  // Test for collision.
  var playerBB = new THREE.Box3().setFromObject(right_paddle);
  for (var i = 0; i < cubes.length; i++) {
    var cubeBB = new THREE.Box3().setFromObject(cubes[i]);
    if (playerBB.intersectsBox(cubeBB)) {
      // The player has hit a cube
      console.log(" The player has hit a cube");
      dodged_cubes.push(cubes[i]);
      cubes.splice(i, 1);
    }
  }
  // Store frame for motion functions
  previousFrame = frame;
}); //End Houston's now good loop

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

function pauseForGestures() {
  if (document.getElementById("pauseOnGesture").checked) {
    pauseOnGesture = true;
  } else {
    pauseOnGesture = false;
  }
}
