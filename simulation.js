//@ts-check
class DynamicObject {
    /**
     * 
     * @param {string} type 
     * @param {number} size 
     * @param {number} x
     * @param {number} y
     * @param {{x:number, y:number}} velocity 
     */
    constructor(type, size, x, y, velocity){
        this.type = type;
        this.size = size;
        this.x = x;
        this.y = y;
        this.velocity = velocity;
    }
}

const {canvas, ctx, objectTypeSelect, bounceAtBordersCheckbox, objectTypeDisplayElement, objectPositionElement,
     objectSpeedInputElement, objectDirectionInputElement} = initPageElements();
const objects = [];

let running = false;
let currentMousePosition = {x: 0, y: 0};
let addingObject = false;
let previewObject = null;
let selectedObject = /**@type {DynamicObject | null} */ (null);

document.addEventListener('DOMContentLoaded', () => {
    // @ts-ignore
    bounceAtBordersCheckbox.checked = false;
    setInputsDisabled(true);
});

function initPageElements() {
    let canvas = /** @type {HTMLCanvasElement} */ (document.getElementById("canvas"));
    if(!canvas) {
        throw new Error('Element with id "canvas" not found');
    }
    
    let ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("2D context not available");
    }

    let objectTypeSelect = /** @type {HTMLSelectElement} */ (document.getElementById("objectType"));
    if (!objectTypeSelect) {throw new Error ("Element not found")}

    let bounceAtBordersCheckbox = /** @type {HTMLInputElement} */ (document.getElementById('bounceAtBorders'));
    if (!bounceAtBordersCheckbox) {throw new Error ("Element not found")};

    let objectTypeDisplayElement = document.getElementById("objectTypeDisplay")
    if (!objectTypeDisplayElement) {throw new Error ("Element not found")};

    let objectPositionElement = document.getElementById("objectPosition");
    if(!objectPositionElement) {throw new Error ("Element not found")};

    let objectSpeedInputElement = /** @type {HTMLInputElement} */ (document.getElementById("objectSpeedInput"));
    if(!objectSpeedInputElement) {throw new Error ("Element not found")};

    let objectDirectionInputElement =  /** @type {HTMLInputElement} */ (document.getElementById("objectDirectionInput"));
    if(!objectDirectionInputElement) {throw new Error ("Element not found")};

    return {
        canvas: canvas,
        ctx: ctx,
        objectTypeSelect: objectTypeSelect,
        bounceAtBordersCheckbox: bounceAtBordersCheckbox,
        objectTypeDisplayElement: objectTypeDisplayElement,
        objectPositionElement: objectPositionElement,
        objectSpeedInputElement: objectSpeedInputElement,
        objectDirectionInputElement: objectDirectionInputElement
    }
}

canvas.addEventListener('mousemove', (event) => {
    if (addingObject) {
        const rect = canvas.getBoundingClientRect();
        currentMousePosition.x = event.clientX - rect.left;
        currentMousePosition.y = event.clientY - rect.top;
    }
});

canvas.addEventListener('click', (event) => {
    if (addingObject) {
        addObject(previewObject.type, 20, currentMousePosition.x, currentMousePosition.y);
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
    requestAnimationFrame(simulate);
}

/**
 * 
 * @param {string} type 
 * @param {number} x 
 * @param {number} y 
 * @param {number} size 
 */
function addObject(type,size, x, y) {
    objects.push(new DynamicObject(type, size, x, y, {x: 0, y: 0}));
}

function startAddObject() {
    addingObject = true;
    previewObject = {type: objectTypeSelect.value, x:0 , y: 0 };
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
    if (selectedObject) {
        displayObjectProperties();
        if(!running) {
            setInputsDisabled(false);
        }
    }
}


function removeSelectedObject() {
    if (selectedObject) {
        const index = objects.indexOf(selectedObject);
        if (index > -1) {
            objects.splice(index, 1);
            selectedObject = null;
            clearObjectProperties();
        }
    }
}

function clearObjectProperties() {
    objectTypeDisplayElement.innerText = "";
    objectPositionElement.innerText = "";
    objectSpeedInputElement.value = "";
    objectDirectionInputElement.value = "";
    
}

function updateProperties() {
    if (selectedObject) {
        var speed = parseFloat(objectSpeedInputElement.value);
        var direction = parseFloat(objectDirectionInputElement.value);
        selectedObject.velocity = velocityFromSpeedAndDirection(speed, direction);
        displayObjectProperties();
    }
}

function displayObjectProperties() {
    if(selectedObject) {
        let direction = directionFromVelocity(selectedObject.velocity);
        let speed = speedFromVelocity(selectedObject.velocity);
        
        objectTypeDisplayElement.innerText = "Type: " + selectedObject.type;
        objectPositionElement.innerText = "Position: (" 
        + selectedObject.x.toFixed(2) + ", " + selectedObject.y.toFixed(2) + ")";
        objectSpeedInputElement.value = speed.toFixed(2);
        objectDirectionInputElement.value = direction.toFixed(2);
    }
}

function setInputsDisabled(disabled) {
    objectSpeedInputElement.disabled = disabled;
    objectDirectionInputElement.disabled = disabled;
    objectSpeedInputElement.style.backgroundColor = disabled ? '#e0e0e0' : '#fff';
    objectDirectionInputElement.style.backgroundColor = disabled ? '#e0e0e0' : '#fff';
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    objects.forEach(obj => {
        if (obj.type === 'sphere') {
            drawSphere(obj.x, obj.y, "blue", obj.size);
        } else if (obj.type === 'square') {
            drawSquare(obj.x, obj.y, "red", obj.size);
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

function speedFromVelocity(velocity) {
    return Math.hypot(velocity.x, velocity.y);
}

function drawSphere(x, y, color, size) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size/2, 0, Math.PI * 2);
    ctx.fill();
}

function drawSquare(x, y, color, size) {
    ctx.fillStyle = color;
    ctx.fillRect(x -10, y -10, size, size);
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
                }
                if (obj.x > canvas.width) {
                    obj.x = canvas.width;
                    obj.velocity.x *= -1;
                }
                if (obj.y < 0) {
                    obj.y = 0;
                    obj.velocity.y *= -1;
                }
                if (obj.y > canvas.height) {
                    obj.y = canvas.height;
                    obj.velocity.y *= -1;
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