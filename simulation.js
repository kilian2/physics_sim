let running = false;
const canvas = document.getElementById('simulation');
const ctx = canvas.getContext('2d');

const objects = [];

const objectTypeSelect = document.getElementById("objectType");
const bounceAtBordersCheckbox = document.getElementById('bounceAtBorders')
let currentMousePosition = {x: 0, y: 0};
let addingObject = false;
let previewObject = null;
let selectedObject = null;

document.addEventListener('DOMContentLoaded', () => {
    bounceAtBordersCheckbox.checked = false;
    setInputsDisabled(true);
});

canvas.addEventListener('mousemove', (event) => {
    if (addingObject) {
        const rect = canvas.getBoundingClientRect();
        currentMousePosition.x = event.clientX - rect.left;
        currentMousePosition.y = event.clientY - rect.top;
    }
});

canvas.addEventListener('click', (event) => {
    if (addingObject) {
        addObject(previewObject.type, currentMousePosition.x, currentMousePosition.y);
        addingObject = false;
        previewObject = null;
    } else {
        selectObject(event);
    }
});

function startSimulation() {
    running = true;
    simulate();
    setInputsDisabled(true);
}

function stopSimulation() {
    running = false;
    setInputsDisabled(false);
}

function simulate() {
    if (!running) return;
    updateSimulation();
    displayObjectProperties();
    draw();
    //simulation logic goes here
    requestAnimationFrame(simulate);
}

function startAddObject() {
    addingObject = true;
    previewObject = { type: objectTypeSelect.value, x:0 , y: 0 };
}

function addObject(type, x, y) {
    objects.push({ type, x, y, color: getColorForType(type), speed: 0.0, direction: 0.0, velocity: {x: 0.0, y: 0.0}});
}

function getColorForType(type) {
    return type === 'sphere' ? 'blue' : 'red';
}

function selectObject(event) {
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    selectedObject = objects.find(obj => {
        if (obj.type === 'sphere') {
            return Math.hypot(obj.x - clickX, obj.y - clickY) < 10;
        } else if (obj.type === 'square') {
            return clickX > obj.x - 10 && clickX < obj.x + 10 && clickY > obj.y -10 && clickY < obj.y + 10;
        }
    });
    if (selectObject) {
        displayObjectProperties();
        if(!running) {
            setInputsDisabled(false);
        }
    }
}

function displayObjectProperties() {
    if(selectedObject) {
        document.getElementById("objectTypeDisplay").innerText = "Type: " + selectedObject.type;
        document.getElementById("objectPosition").innerText = "Position: (" + selectedObject.x.toFixed(2) + ", " + selectedObject.y.toFixed(2) + ")";
        document.getElementById("objectSpeedInput").value = selectedObject.speed;
        document.getElementById("objectDirectionInput").value = selectedObject.direction.toFixed(2);
    }
}

function removeSelectedObject() {
    if (selectObject) {
        const index = objects.indexOf(selectedObject);
        if (index > -1) {
            objects.splice(index, 1);
            selectedObject = null;
            clearObjectProperties();
        }
    }
}

function clearObjectProperties() {
    document.getElementById("objectTypeDisplay").innerText = "";
    document.getElementById("objectPosition").innerText = "";
    document.getElementById("objectSpeedInput").value = "";
    document.getElementById("objectDirectionInput").value = "";
    
}

function updateProperties() {
    if (selectedObject) {
        var speed = parseFloat(document.getElementById("objectSpeedInput").value);
        var direction = parseFloat(document.getElementById("objectDirectionInput").value);
        selectedObject.speed = speed;
        selectedObject.direction = direction;
        selectedObject.velocity = velocityFromSpeedAndDirection(speed, direction);
        displayObjectProperties();
    }
}

function setInputsDisabled(disabled) {
    document.getElementById('objectSpeedInput').disabled = disabled;
    document.getElementById('objectDirectionInput').disabled = disabled;
    document.getElementById('objectSpeedInput').style.backgroundColor = disabled ? '#e0e0e0' : '#fff';
    document.getElementById('objectDirectionInput').style.backgroundColor = disabled ? '#e0e0e0' : '#fff';
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    objects.forEach(obj => {
        if (obj.type === 'sphere') {
            drawSphere(obj.x, obj.y, obj.color);
        } else if (obj.type === 'square') {
            drawSquare(obj.x, obj.y, obj.color);
        }
    })
    if (addingObject && previewObject) {
        drawPreviewObject();
    }
}

function drawPreviewObject() {
    if ( previewObject.type === 'sphere') {
        ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(currentMousePosition.x, currentMousePosition.y, 10, 0, Math.PI * 2);
        ctx.fill();
    } else if (previewObject.type === 'square') {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillRect(currentMousePosition.x -10, currentMousePosition.y -10, 20, 20);
    }
    
}

function velocityFromSpeedAndDirection(speed, direction) {
    const radians = (Math.PI / 180) * direction;
    return {
        x: speed * Math.cos(radians),
        y: -speed * Math.sin(radians) // y is negative because canvas y-axis is downward
    }
}

function directionFromVelocity(velocity) {
    const angle = Math.atan2(-velocity.y, velocity.x);
    const degrees = (angle * 180 / Math.PI + 360) % 360;
    return degrees;
}

function drawSphere(x, y, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
}

function drawSquare(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x -10, y -10, 20, 20);
}

function drawLoop() {
    draw();
    requestAnimationFrame(drawLoop);
}

function updateSimulation() {
    const bounceAtBorders = bounceAtBordersCheckbox.checked;
    objects.forEach(obj => {
        obj.x += obj.velocity.x;
        obj.y += obj.velocity.y;
    
        if (bounceAtBorders) {
                if (obj.x < 0) {
                    obj.x = 0;
                    obj.velocity.x *= -1;
                    obj.direction = directionFromVelocity(obj.velocity);
                }
                if (obj.x > canvas.width) {
                    obj.x = canvas.width;
                    obj.velocity.x *= -1;
                    obj.direction = directionFromVelocity(obj.velocity);
                }
                if (obj.y < 0) {
                    obj.y = 0;
                    obj.velocity.y *= -1;
                    obj.direction = directionFromVelocity(obj.velocity);
                }
                if (obj.y > canvas.height) {
                    obj.y = canvas.height;
                    obj.velocity.y *= -1;
                    obj.direction = directionFromVelocity(obj.velocity);
                }
            } else {
                // Keep objects within canvas bounds without bouncing
                if (obj.x < 0) obj.x = 0;
                if (obj.x > canvas.width) obj.x = canvas.width;
                if (obj.y < 0) obj.y = 0;
                if (obj.y > canvas.height) obj.y = canvas.height;
            }
    })

}



drawLoop();