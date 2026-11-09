// Random LED.
// Boards announce themselves with "<id>,<ldr>" lines. Press the spacebar:
// every board blinks a few times, then one random board stays on.
// LEDs are driven with "led,<id>,1" / "led,<id>,0".

const SERVER =
  (location.protocol === "https:" ? "wss://" : "ws://") + location.host;
// const SERVER = "wss://esp-sockets-class-example.onrender.com";

const TIMEOUT_MS = 3000;   // forget a board that stays silent this long
const BLINKS = 3;          // how many times everything blinks before the pick
const BLINK_MS = 150;      // on time and off time of each blink

let ws;
let boards = {};           // id -> last time seen
let lit = null;            // id of the board whose LED is on
let allOn = false;         // true while every LED is on during the blink

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);
  noStroke();
  connect();
}

function connect() {
  ws = new WebSocket(SERVER);
  ws.onmessage = (event) => {
    let parts = event.data.trim().split(",");
    if (parts.length === 2) boards[parts[0]] = millis();   // "<id>,<ldr>"
  };
  ws.onclose = () => setTimeout(connect, 2000);
}

function send(msg) {
  if (ws.readyState === 1) ws.send(msg);
}

function setAll(on) {
  allOn = on;
  for (let id in boards) send("led," + id + "," + (on ? "1" : "0"));
}

function pick() {
  let ids = Object.keys(boards);
  if (ids.length === 0) return;
  lit = null;

  // blink everything BLINKS times...
  for (let i = 0; i < BLINKS; i++) {
    setTimeout(() => setAll(true), i * 2 * BLINK_MS);
    setTimeout(() => setAll(false), i * 2 * BLINK_MS + BLINK_MS);
  }
  // ...then leave one random board on
  setTimeout(() => {
    lit = random(Object.keys(boards));
    send("led," + lit + ",1");
  }, BLINKS * 2 * BLINK_MS);
}

function keyPressed() {
  if (key === " ") pick();
}

function draw() {
  background(17);

  // forget silent boards
  for (let id in boards) {
    if (millis() - boards[id] > TIMEOUT_MS) {
      delete boards[id];
      if (lit === id) lit = null;
    }
  }

  // one box per board, green when its LED is on
  let ids = Object.keys(boards);
  let w = width / max(1, ids.length);
  for (let i = 0; i < ids.length; i++) {
    fill(allOn || ids[i] === lit ? color(0, 200, 90) : 40);
    rect(i * w + 4, 60, w - 8, 120);
    fill(255);
    textSize(24);
    text(ids[i], i * w + w / 2, 120);
  }

  fill(200);
  textSize(18);
  text(ws.readyState === 1 ? ids.length + " board(s)" : "connecting...", width / 2, 30);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
