//@ts-check

import { checkLineLineCollision, checkPolyPolyCollision, rotatePoints, checkPolyCircleCollision, normalize, getOrthoNormal } from './util.js';

class DynamicObject {
    /**
     * @param {ObjectType} type 
     * @param {number} size 
     * @param {number} x
     * @param {number} y
     * @param {{x:number, y:number}} velocity
     * @param {number} mass
     * @param {number} angle  
     */
    constructor(type, size, x, y, velocity, mass, angle){
        this.type = type;
        this.size = size;
        this.x = x;
        this.y = y;
        this.velocity = velocity;
        this.mass = mass;
        this.angle = angle;
        this.angularVelocity = 0;
        this.vertices = /** @type {Array<{x, y}>} */ ([]);
        this.isSelected = false;
        this.updateVertices();
    }

    updateVertices() {
        if(this.type != ObjectType.SQUARE) return;
        const halfSize = this.size / 2;
        let /** @type {Array<{x: number, y: number}>} */ squarePoints = [
            {x: this.x + halfSize, y: this.y - halfSize},
            {x: this.x - halfSize, y: this.y - halfSize},
            {x: this.x - halfSize, y: this.y + halfSize},
            {x: this.x + halfSize, y: this.y + halfSize}
        ];
        if(this.angle % 360 != 0){
            const rotationRad = this.angle * Math.PI / 180;
            this.vertices = rotatePoints(squarePoints, rotationRad, {x: this.x, y: this.y});
        } else {
            this.vertices = squarePoints;
        }
    }
}

class PreviewObject {
    /**
     * @param {ObjectType} type 
     * @param {number} size 
     */
    constructor(type, size, x, y, angle){
        this.type = type;
        this.size = size;
        this.angle = 0;
    }
}

class ObjectType {
    static get SPHERE () {
        return "sphere";
    }
    
    static get SQUARE () {
        return "square";
    }
}

const {canvas, ctx, objectTypeSelect, bounceAtBordersCheckbox, objectTypeDisplayElement, objectPositionElement,
     objectSpeedInputElement, objectDirectionInputElement, newObjectSizeInputElement, newObjectMassInputElement,
     objectMassInputElement, objectAngleInputElement, objectAngularVelocityInputElement} = initPageElements();

   
const objects = /** @type {Array<DynamicObject>} */ ([]);
const drawSquareVertices = false;
let running = false;
let currentMousePosition = {x: 0, y: 0};
let addingObject = false;
const dragData = {isDragging: false, dragObject: /** @type {DynamicObject | undefined} */ (undefined), dragDelay: 200};
const selectionBoxData = {isSelecting: false, selectionStart: {x: 0, y: 0}, selectionEnd: {x: 0, y: 0}, 
selectedObjects: /** @type {Array<DynamicObject>} */ ([])};
let dragTimeout;
let /** @type {PreviewObject | null} */ previewObject = null;
let /** @type {DynamicObject | undefined} */ selectedObject = undefined;


document.addEventListener('DOMContentLoaded', () => {
    addEventListeners();
    bounceAtBordersCheckbox.checked = true;
    setInputsDisabled(true);
    newObjectMassInputElement.value = getMassForNewObject().toFixed(2);
});

function initPageElements() {
    const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById("canvas"));
    if(!canvas) {
        throw new Error('Element with id "canvas" not found');
    }
    
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("2D context not available");
    }

    const objectTypeSelect = /** @type {HTMLSelectElement} */ (document.getElementById("objectType"));
    if (!objectTypeSelect) {throw new Error ("Element not found")}

    const bounceAtBordersCheckbox = /** @type {HTMLInputElement} */ (document.getElementById('bounceAtBorders'));
    if (!bounceAtBordersCheckbox) {throw new Error ("Element not found")};

    const objectTypeDisplayElement = document.getElementById("objectTypeDisplay")
    if (!objectTypeDisplayElement) {throw new Error ("Element not found")};

    const objectPositionElement = document.getElementById("objectPosition");
    if(!objectPositionElement) {throw new Error ("Element not found")};

    const objectSpeedInputElement = /** @type {HTMLInputElement} */ (document.getElementById("objectSpeedInput"));
    if(!objectSpeedInputElement) {throw new Error ("Element not found")};

    const objectDirectionInputElement =  /** @type {HTMLInputElement} */ (document.getElementById("objectDirectionInput"));
    if(!objectDirectionInputElement) {throw new Error ("Element not found")};

    const newObjectSizeInputElement = /** @type {HTMLInputElement}*/ (document.getElementById("newObjectSizeInput"));
    if(!newObjectSizeInputElement) {throw new Error ("Element not found")};

    const newObjectMassInputElement = /** @type {HTMLInputElement}*/ (document.getElementById("newObjectMassInput"));
    if(!newObjectMassInputElement) {throw new Error ("Element not found")};

    const objectMassInputElement = /** @type {HTMLInputElement} */ (document.getElementById("objectMassInput"));
    if(!objectMassInputElement) {throw new Error ("Element not found")};

    const objectAngleInputElement = /** @type {HTMLInputElement} */ (document.getElementById("objectAngleInput"));
    if(!objectAngleInputElement) {throw new Error ("Element not found")};

    const objectAngularVelocityInputElement = /** @type {HTMLInputElement} */ (document.getElementById("objectAngularVelocityInput"));
    if(!objectAngularVelocityInputElement) {throw new Error ("Element not found")};

    return {
        canvas,
        ctx,
        objectTypeSelect,
        bounceAtBordersCheckbox,
        objectTypeDisplayElement,
        objectPositionElement,
        objectSpeedInputElement,
        objectDirectionInputElement,
        newObjectSizeInputElement,
        newObjectMassInputElement,
        objectMassInputElement,
        objectAngleInputElement,
        objectAngularVelocityInputElement
    }
}

function addEventListeners() {
    
    canvas.addEventListener('mousemove', (event) => {
        currentMousePosition = getMousePos(canvas, event); 
        if ( selectionBoxData.isSelecting ) {
            selectionBoxData.selectionEnd = currentMousePosition;
        }
    });
    
    canvas.addEventListener('mousedown', (event) => {
        currentMousePosition = getMousePos(canvas, event);
        const x = currentMousePosition.x;
        const y = currentMousePosition.y;
        
        if (!selectionBoxData.isSelecting && !addingObject) {
            selectObject(event);
        }
        if (addingObject) {
            if (checkObjectPlacementForCollisions(previewObject, null, x, y)) return;
            const size =  parseFloat(newObjectSizeInputElement.value);
            const mass = parseFloat(newObjectMassInputElement.value);
            const type = objectTypeSelect.value; 
            objects.push(new DynamicObject(type, size, currentMousePosition.x, currentMousePosition.y, {x: 0, y: 0}, mass, 0));
            addingObject = false;
        }
    });

    canvas.addEventListener('mousedown', (e) => {
        if(!dragData.isDragging && selectedObject && !running){
            dragTimeout = setTimeout(() => {
                dragData.isDragging = true;
                dragData.dragObject = selectedObject;
                if(previewObject && selectedObject) {
                    previewObject.angle = selectedObject.angle;
                    previewObject.size = selectedObject.size;
                    previewObject.type = selectedObject.type;
                }
            }, dragData.dragDelay);
        }
        else {
            dragTimeout = setTimeout(() => {
                selectionBoxData.isSelecting = true;
                selectionBoxData.selectionStart = {x: currentMousePosition.x, y: currentMousePosition.y};
                selectionBoxData.selectionEnd = {x: currentMousePosition.x, y: currentMousePosition.y};
            }, 100);
        }
        });

    canvas.addEventListener('mouseup', () => {
        const x = currentMousePosition.x;
        const y = currentMousePosition.y;

        if(dragData.isDragging && dragData.dragObject) {
            const object = dragData.dragObject;
            if(checkObjectPlacementForCollisions(null, object ,x, y)) {
                clearTimeout(dragTimeout);
                dragData.isDragging = false;
                dragData.dragObject = undefined;
                return;
            }
            object.x = x;
            object.y = y;
            if(object.type === ObjectType.SQUARE) object.updateVertices();
        }
        else if (selectionBoxData.isSelecting) {
            selectionBoxData.isSelecting = false;
            selectionBoxData.selectionEnd = {x: x, y: y};
            applySelectionBox();
        }

        clearTimeout(dragTimeout);
        dragData.isDragging = false;
        dragData.dragObject = undefined;
    })

    canvas.addEventListener('mouseleave', () => {
        clearTimeout(dragTimeout);
        dragData.isDragging = false;
        dragData.dragObject = undefined;
    })
 

    newObjectSizeInputElement.addEventListener('input', () => {
        const size = parseFloat(newObjectSizeInputElement.value);
        if (!isNaN(size) && size >= 0) {
            newObjectMassInputElement.value = getMassForNewObject().toFixed(2);
        }
    });

    objectTypeSelect.addEventListener('input', () => {
        newObjectMassInputElement.value = getMassForNewObject().toFixed(2);
    })

    document.getElementById("startSimulation")?.addEventListener('click', startSimulation);
    document.getElementById("stopSimulation")?.addEventListener('click', stopSimulation);
    document.getElementById("addObject")?.addEventListener('click', startAddObject);
    document.getElementById("removeSelectedObject")?.addEventListener('click', removeSelectedObject);
    document.getElementById("updateProperties")?.addEventListener('click', updateProperties);

}

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

function startAddObject() {
    addingObject = true;
    const typeString = objectTypeSelect.value;
    const size = parseFloat(newObjectSizeInputElement.value);
    let objectType = new ObjectType;
    switch (typeString) {
        case "sphere":
            objectType = ObjectType.SPHERE;
            break;
        case "square":
            objectType = ObjectType.SQUARE;
    }
    previewObject = new PreviewObject(objectType, size, 0, 0, 0);
}

function getMassForNewObject() {
    const type = objectTypeSelect.value;
    const size = parseFloat(newObjectSizeInputElement.value);
    let mass = 0;
    if (type === "sphere") {
        mass = Math.PI * ((size / 2) ** 2);
    }
    else if (type === "square") {
        mass = size ** 2
    }
    return mass;
}

function selectObject(event) {
    console.log("selectObject")
    const x = currentMousePosition.x;
    const y = currentMousePosition.y;

    objects.forEach((obj) => obj.isSelected = false);
    selectionBoxData.selectedObjects = [];
    selectedObject = objects.find(obj => {
        if (obj.type === ObjectType.SPHERE) {
            return Math.hypot(obj.x - x, obj.y - y) < obj.size / 2;
        } else if (obj.type === ObjectType.SQUARE) {
            return x > obj.x -  obj.size && x < obj.x +  obj.size 
            && y > obj.y - obj.size && y < obj.y +  obj.size;
        }
    });
    
    if (selectedObject) {
        displayObjectProperties();
        selectedObject.isSelected = true;
        if(!running) {
            setInputsDisabled(false);
        }
    }
}

function applySelectionBox () {
    const minX = Math.min(selectionBoxData.selectionStart.x, selectionBoxData.selectionEnd.x);
    const maxX = Math.max(selectionBoxData.selectionStart.x, selectionBoxData.selectionEnd.x);
    const minY = Math.min(selectionBoxData.selectionStart.y, selectionBoxData.selectionEnd.y);
    const maxY = Math.max(selectionBoxData.selectionStart.y, selectionBoxData.selectionEnd.y);

    selectionBoxData.selectedObjects.forEach((obj) => obj.isSelected = false);
    selectionBoxData.selectedObjects = objects.filter(obj => (obj.x >= minX && obj.x <= maxX && obj.y >= minY && obj.y <= maxY));
    selectionBoxData.selectedObjects.forEach((obj) => obj.isSelected = true);
    console.log(selectionBoxData.selectedObjects.length+ " objects selected");
}

function getMousePos(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    }
}

function removeSelectedObject() {
    if (selectedObject) {
        const index = objects.indexOf(selectedObject);
        if (index > -1) {
            objects.splice(index, 1);
            selectedObject = undefined;
            clearObjectProperties();
        }
    }
}

function clearObjectProperties() {
    objectTypeDisplayElement.innerText = "";
    objectPositionElement.innerText = "";
    objectSpeedInputElement.value = "";
    objectDirectionInputElement.value = "";
    objectMassInputElement.value = "";
    objectAngleInputElement.value = "";
    objectAngularVelocityInputElement.value = "";
}

function updateProperties() {
    if (selectedObject) {
        const speed = parseFloat(objectSpeedInputElement.value);
        const direction = parseFloat(objectDirectionInputElement.value);
        const mass = parseFloat(objectMassInputElement.value);
        const angle = parseFloat(objectAngleInputElement.value);
        const angularVelocity = parseFloat(objectAngularVelocityInputElement.value);
        selectedObject.velocity = velocityFromSpeedAndDirection(speed, direction);
        selectedObject.mass = mass;
        selectedObject.angle = angle;
        selectedObject.angularVelocity = angularVelocity;
        selectedObject.updateVertices();
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
        objectMassInputElement.value = selectedObject.mass.toFixed(2);
        objectAngleInputElement.value = selectedObject.angle.toFixed(2);
        objectAngularVelocityInputElement.value = selectedObject.angularVelocity.toFixed(2);
    }
}

function setInputsDisabled(disabled) {
    objectSpeedInputElement.disabled = disabled;
    objectDirectionInputElement.disabled = disabled;
    objectMassInputElement.disabled = disabled;
    objectAngleInputElement.disabled = disabled;
    objectAngularVelocityInputElement.disabled = disabled;
    objectSpeedInputElement.style.backgroundColor = disabled ? '#e0e0e0' : '#fff';
    objectDirectionInputElement.style.backgroundColor = disabled ? '#e0e0e0' : '#fff';
    objectMassInputElement.style.backgroundColor = disabled ? '#e0e0e0' : '#fff';
    objectAngleInputElement.style.backgroundColor = disabled ? '#e0e0e0' : '#fff';
    objectAngularVelocityInputElement.style.backgroundColor = disabled ? '#e0e0e0' : '#fff';

}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    objects.forEach(obj => {
        if (obj.type === 'sphere') {
            drawSphere(obj.x, obj.y, "blue", obj.size, obj.isSelected);
            
        } else if (obj.type === 'square') {
            ctx.save();
            ctx.translate(obj.x, obj.y);
            ctx.rotate(obj.angle * Math.PI / 180);
            ctx.translate(-obj.x, -obj.y);
            drawSquare(obj.x, obj.y, "black", obj.size, obj.isSelected);
            ctx.restore();
            if(drawSquareVertices) {
                obj.vertices.forEach(v => {
                    drawSphere(v.x, v.y,'red', 10);
                })  
            }
        }
    })
    if (addingObject && previewObject || dragData.isDragging ) {
        drawPreviewObject();
    }
    if (selectionBoxData.isSelecting) {
        ctx.fillStyle = 'rgba(0, 0, 1, 0.3)';
        const height = Math.abs(selectionBoxData.selectionEnd.y - selectionBoxData.selectionStart.y);
        const width = Math.abs(selectionBoxData.selectionEnd.x - selectionBoxData.selectionStart.x);
        if(height + width > 2) {
            const left = Math.min(selectionBoxData.selectionStart.x, selectionBoxData.selectionEnd.x);
            const top = Math.min(selectionBoxData.selectionStart.y, selectionBoxData.selectionEnd.y);
            ctx.fillRect(left, top, width, height);
        }
    }
}

function drawPreviewObject() {
    
    if (!previewObject) {throw new Error ("Preview object is null")};
    let size = previewObject.size;
    let x = currentMousePosition.x;
    let y = currentMousePosition.y;
    let drawRed = false;
    
    if(addingObject && !dragData.isDragging && checkObjectPlacementForCollisions(previewObject, null, x, y) || 
        (!addingObject && dragData.isDragging && selectedObject && 
        checkObjectPlacementForCollisions(null, selectedObject, x, y))) drawRed = true;
    
    if (previewObject.type === 'sphere') {
         
        ctx.fillStyle = !drawRed ? 'rgba(0, 0, 255, 0.5)' : 'rgba(255, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(x, y, size/2, 0, Math.PI * 2);
        ctx.fill();
    } else if (previewObject.type === 'square') {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(previewObject.angle * Math.PI / 180);
        ctx.translate(-x, -y);
        ctx.fillStyle = !drawRed ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
        ctx.fillRect(x -size/2, y -size/2, size, size);
        ctx.restore();
    }
    
}

function velocityFromSpeedAndDirection(speed, direction) {
    const radians = (Math.PI / 180) * direction;
    return {
        x: speed * Math.cos(radians),
        y: speed * Math.sin(radians) 
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

function drawSphere(x, y, color, size, drawBorder) {
    ctx.fillStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, size/2, 0, Math.PI * 2);
    ctx.fill();
    if(drawBorder) {
        ctx.strokeStyle = "green";
        ctx.stroke()
    }
    ctx.closePath();
}

function drawSquare(x, y, color, size, drawBorder) {
    ctx.lineWidth = 3;
    ctx.fillStyle = color;
    ctx.fillRect(x - size/2, y -size/2, size, size);
    if(drawBorder) {
        ctx.strokeStyle = "green";
        ctx.strokeRect(x - size/2, y -size/2, size, size);
    }
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
        obj.angle += obj.angularVelocity;
        obj.angle %= 360;
        if(obj.type === ObjectType.SQUARE) obj.updateVertices();
    
        if (bounceAtBorders) {
                if (obj.x - obj.size/2 < 0) {
                    obj.x =  0 + obj.size / 2;
                    obj.velocity.x *= -1;
                }
                if (obj.x + obj.size / 2 > canvas.width) {
                    obj.x =  canvas.width - obj.size / 2;
                    obj.velocity.x *= -1;
                }
                if (obj.y - obj.size/2 < 0) {
                    obj.y = 0 + obj.size / 2;
                    obj.velocity.y *= -1;
                }
                if (obj.y + obj.size / 2 > canvas.height) {
                    obj.y = canvas.height - obj.size / 2;
                    obj.velocity.y *= -1;
                }
            } else {
                // Keep objects within canvas bounds without bouncing
                if (obj.x - obj.size / 2 < 0) obj.x = 0 + obj.size / 2;
                if (obj.x + obj.size / 2 > canvas.width) obj.x = canvas.width - obj.size / 2;
                if (obj.y - obj.size / 2 < 0) obj.y = 0 + obj.size / 2;
                if (obj.y + obj.size / 2 > canvas.height) obj.y = canvas.height - obj.size / 2;
            }
            handleCollisions();
    })
}

function checkObjectPlacementForCollisions( /**@type {PreviewObject | null} */ previewObject, 
    /** @type {DynamicObject | null} */ objectToMove, x, y){
    
    if (previewObject && !objectToMove) {
        const newObj = new DynamicObject(previewObject.type, previewObject.size, x, y, {x: 0,y: 0}, 1, 0);
        return objects.some(obj => checkCollision(newObj, obj) != null);    
    }
    if (!previewObject && objectToMove) {
        const newObj = new DynamicObject(objectToMove.type, objectToMove.size, x, y, {x: 0, y: 0}, 1, objectToMove.angle);
        return objects.some(obj => checkCollision(newObj, obj) != null && obj != selectedObject )
    }
}

function handleCollisions() {
    for (let i = 0; i < objects.length -1; i++) {
        for (let j = i+1; j < objects.length; j++) {
            const obj1 = /** @type {DynamicObject} */ (objects[i]);
            const obj2 = /** @type {DynamicObject} */ (objects[j]);

            const relativeVelocityX = obj2.velocity.x - obj1.velocity.x;
            const relativeVelocityY = obj2.velocity.y - obj1.velocity.y;
            
            // Calculate distance components
            const distanceX = obj2.x - obj1.x;
            const distanceY = obj2.y - obj1.y;
            
            // Check if they are closing in on each other
            const closingInX = distanceX * relativeVelocityX < 0;
            const closingInY = distanceY * relativeVelocityY < 0;
            
            if (!(closingInX || closingInY)) {
                continue; // Skip further calculations if not closing in
            }

            const collisionData = checkCollision(obj1, obj2);

            if (collisionData) {
                resolveCollision(obj1, obj2, collisionData);
            }
        }
    }
}

function checkCollision(/** @type {DynamicObject} */ obj1, /** @type {DynamicObject} */ obj2) {
    
    const isSphereSphere = (obj1.type === ObjectType.SPHERE && obj2.type === ObjectType.SPHERE);
    const isSquareSquare = (obj1.type === ObjectType.SQUARE && obj2.type == ObjectType.SQUARE);
    const isSquareSphere = (obj1.type === ObjectType.SQUARE && obj2.type == ObjectType.SPHERE);
    const isSphereSquare = (obj1.type === ObjectType.SPHERE && obj2.type == ObjectType.SQUARE);
    let collisionData = null;

    if (isSphereSphere) collisionData = checkSphereSphereCollision(obj1, obj2);
    else if (isSquareSquare) collisionData = checkSquareSquareCollision(obj1, obj2);
    else if (isSquareSphere) collisionData = checkSquareSphereCollision(obj1, obj2);
    else if (isSquareSphere) collisionData = checkSquareSphereCollision(obj1, obj2);
    else if(isSquareSphere) {
        collisionData = checkSquareSphereCollision(obj1, obj2);
    }
    else if(isSphereSquare) {
        collisionData = checkSquareSphereCollision(obj2, obj1);
        if(collisionData) {
            collisionData.normal.x *= -1;
            collisionData.normal.y *= -1;
        }   
    }
    
    /*
    else if (isSphereSquare || isSquareSphere ) {
        const collisionDataWithInvertedCollisionNormal = checkSquareSphereCollision(obj2, obj1);
        collisionDataWithInvertedCollisionNormal? collisionData = 
        {normal: {x: -collisionDataWithInvertedCollisionNormal?.x, y: -collisionDataWithInvertedCollisionNormal.y},
         location: collisionDataWithInvertedCollisionNormal.location } : null;
        
    }
         */


    else {
        throw new Error("Invalid Object Type!");
    }
    return collisionData;
}

function checkSphereSphereCollision(/** @type {DynamicObject} */ obj1, /** @type {DynamicObject} */ obj2) {
    const distanceX = obj2.x - obj1.x;
    const distanceY = obj2.y - obj1.y;
    const distanceSquared = distanceX ** 2 + distanceY ** 2;
    
    const combinedRadius = (obj1.size / 2) + (obj2.size / 2);
    
    if (distanceSquared < combinedRadius ** 2) {
        const distance = Math.sqrt(distanceSquared);
        const directionFromObj1ToObj2 = {x: distanceX / distance, y: distanceY / distance};
        const collisionLocation = {x: obj1.x + directionFromObj1ToObj2.x * (distance - (obj2.size / 2)), 
            y: obj1.y + directionFromObj1ToObj2.y * (distance - (obj2.size / 2))};
        return {normal: {x: distanceX / distance, y: distanceY / distance}, location: collisionLocation};
    }
    return null;
}

function checkSquareSquareCollision(/** @type {DynamicObject} */ obj1, /** @type {DynamicObject} */ obj2){
    //TODO: Keep the vertices updated at different location (simulationloop?)
    obj1.updateVertices();
    obj2.updateVertices();
    const collision = checkPolyPolyCollision(obj1.vertices, obj2.vertices);
    let collisionData = /** @type {{normal: {x: number, y: number}, location: {x, y}} | null}*/ (null);

    if(collision) {
        const distanceX = obj2.x - obj1.x;
        const distanceY = obj2.y - obj1.y;
        const distanceSquared = distanceX ** 2 + distanceY ** 2;
        const distance = Math.sqrt(distanceSquared);
        collisionData = {normal: {x: distanceX / distance, y: distanceY / distance}, location: collision};
    }
    return collisionData;
}

function checkSquareSphereCollision(/** @type {DynamicObject} */  square, /** @type {DynamicObject} */ sphere) {
    //if (square.type != ObjectType.SQUARE || sphere.type != ObjectType.SPHERE) throw new Error("ObjectType mismatch!");
    //TODO: Keep the vertices updated at different location (simulationloop?)
    square.updateVertices();
    const collisionLocation = checkPolyCircleCollision(square.vertices, {x: sphere.x, y: sphere.y, radius: sphere.size / 2});
    if (collisionLocation) {
        const distanceX = sphere.x - square.x;
        const distanceY = sphere.y - square.y;
        const distanceSquared = distanceX ** 2 + distanceY ** 2;
        const distance = Math.sqrt(distanceSquared);
        const collisionData = {normal: {x: distanceX / distance, y: distanceY / distance}, location: collisionLocation};
        return collisionData;
    } 
    return null;
}

function resolveCollision(/** @type {DynamicObject } */ obj1, /** @type {DynamicObject} */ obj2, 
    /** @type {{ normal: {x: number, y: number}, location: {x, y}}} */ collisionData) {
    const relativeVelocityX = obj2.velocity.x -obj1.velocity.x;
    const relativeVelocityY = obj2.velocity.y - obj1.velocity.y;
    const normal = collisionData.normal;
    const velocityAlongNormal = relativeVelocityX * normal.x + relativeVelocityY * normal.y;

    //For handling rotations
    const collisionPointToObj1 = {x: obj1.x - collisionData.location.x, y: obj1.y - collisionData.location.y};
    const collisionPointToObj1Norm = normalize(collisionPointToObj1);
    const collisionPointToObj2 = {x: obj2.x - collisionData.location.x, y: obj2.y - collisionData.location.y};
    const collisionPointToObj2Norm = normalize(collisionPointToObj2);
    const orthogonalToCollisionPointToObj1Norm = getOrthoNormal(collisionPointToObj1Norm);
    const orthogonalToCollisionPointToObj2Norm = getOrthoNormal(collisionPointToObj2Norm);
    const relVelocityNorm = normalize({x: relativeVelocityX, y: relativeVelocityY});
    const relVelocityNormDottedorthogonalToCollisionPointToObj1Norm = orthogonalToCollisionPointToObj1Norm.x * relVelocityNorm.x 
    + orthogonalToCollisionPointToObj1Norm.y * relativeVelocityY;
    const relVelocityNormDottedorthogonalToCollisionPointToObj2Norm = orthogonalToCollisionPointToObj2Norm.x * relVelocityNorm.x 
    + orthogonalToCollisionPointToObj2Norm.y * relativeVelocityY;
    const relVelocityDottedcCollisionPointToObj1Norm = relVelocityNorm.x * collisionPointToObj1Norm.x + relVelocityNorm.y * collisionPointToObj1Norm.y;
    const relVelocityDottedcCollisionPointToObj2Norm = relVelocityNorm.x * collisionPointToObj2Norm.x + relVelocityNorm.y * collisionPointToObj2Norm.y;


    //No collision handling required if objects are moving apart
    if(velocityAlongNormal > 0) return;

    //restituion = 1 -> perfect elastic collisions -> all kinetic energy is conserved
    //restituion = 0 -> perfect inelastic collisions -> no kinetic energy is conserved
    const restituion = 1;

    const impulseScalar = - (1 + restituion) * velocityAlongNormal / (1 / obj1.mass + 1 / obj2.mass);
    const impulseX = impulseScalar * normal.x;
    const impulseY = impulseScalar * normal.y;

    //Calvulate new velocities
    const newObj1VelocityX = obj1.velocity.x - impulseX / obj1.mass;
    const newObj1VelocityY = obj1.velocity.y - impulseY / obj1.mass;
    const newObj2VelocityX = obj2.velocity.x + impulseX / obj2.mass;
    const newObj2VelocityY = obj2.velocity.y + impulseY / obj2.mass;
    
    //Update velocitys 
    obj1.velocity.x = newObj1VelocityX;
    obj1.velocity.y = newObj1VelocityY;
    obj2.velocity.x = newObj2VelocityX;
    obj2.velocity.y = newObj2VelocityY;   
}

drawLoop();

