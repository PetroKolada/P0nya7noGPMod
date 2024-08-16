//
// Значит ты сюда зашел, да?)
// Ну я не против, делай тут что хочешь
// Если ты сделал мод мода, то пожалуйста, не присваивай ВЕСЬ мод себе
//

// Подключение к открытому веб-сокету игры.
const originalSend = WebSocket.prototype.send;
WebSocket.prototype.send = function(...args) {
    if (window.sockets.indexOf(this) === -1){
        window.sockets.push(this);
        console.log(DEFAULT_MOD_PREFIX + "Подключено к вебсокету.");
        messageListener()
    }
    return originalSend.call(this, ...args);
};

// Удаление бокового блока с рекламой.
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector(".side").remove()
    console.log(DEFAULT_MOD_PREFIX + "Реклама удалена.");
})

// Создание основных переменных ----
// Дефолтные значения (Значения которые присваиваются при отсутсвия кастомных).
const DEFAULT_ZOOM_SENS = 0.0002
const DEFAULT_BINDS = {
    MIRROR_KEY : "CapsLock",
    BRUSH_KEY : "KeyB",
    ERASER_KEY : "KeyE",
    COLOR_PICKER_KEY : "AltLeft",
    CHANGE_KEY : "KeyX"
}

// Рабочие значения
let ZOOM_SENS = 0.0002
let BINDS = {
    MIRROR_KEY : "CapsLock",
    BRUSH_KEY : "KeyB",
    ERASER_KEY : "KeyE",
    COLOR_PICKER_KEY : "AltLeft",
    CHANGE_KEY : "KeyX"
}
let SHORTCUTS = {

}
let MODIFICATION_KEYS = {
    Additive : "ControlLeft",
    Modifying : "ShiftLeft",
    Switching : "AltLeft"
}
let SETTINGS = {
    GLOBAL_LAYERS : {
        name : "Глобальные слои",
        description : "Глобальные слои - слои которые переносятся в игру (Требуют рендер - (600 линий в минуту))",
        state : false,
    },
    PALETTE_UPDATE : {
        name : "Обновление палитры",
        description : "Обновление палитры - ререндер палитры после изменения цвета",
        state : true,
    }
}

// Переменные используемые самим модом (Активно-изменяющиеся значения).
window.sockets = [];
let CLASS_INSTANCES = []
const DEFAULT_GAME_STATE = {
    MAIN_MENU : 0,
    LOBBY : 1,
    WRITING : 2,
    DRAWING : 3,
    WATCHING : 4,
    FINISHING : 5
}
const DEFAULT_TOOLS = {
    BRUSH : 0,
    ERASER : 1,
    COLOR_PICKER : 2,
    FILL : 3,
    RECTANGLE : 4,
    CIRCLE : 5,
    FILLED_CIRCLE : 6,
}
const DEFAULT_MOD_PREFIX = "|PGP|> "
const GAME_STATES = [
    {
        state : DEFAULT_GAME_STATE.WATCHING,
        necessity : [24]
    },
    {
        state : DEFAULT_GAME_STATE.LOBBY,
        necessity : [20, 5]
    }
]
const GAME_STATES_ALTERED = [
    {
        state : DEFAULT_GAME_STATE.DRAWING,
        necessity : [5]
    },
    {
        state : DEFAULT_GAME_STATE.WRITING,
        necessity : [3]
    },
    {
        state : DEFAULT_GAME_STATE.WATCHING,
        necessity : [4]
    }
]

const DEFAULT_CURSORS = {
    CIRCLE : 1,
    CIRCLE_WITH_DOT : 2,
    CROSSHAIR : 3,
}

const PING_IGNORE = "3"
const INCLUDED_STATES = [24,20,4,5,3]
let CURRENT_ROUND = -1
let CURRENT_GAME_STATE = DEFAULT_GAME_STATE.LOBBY
let SCALE_WEIGHT = 5
let GLOBAL_KEYS = {}

// Рабочие переменные для классов
// DrawingModule
let DRAWING_COLOR = "#000000"
let BACKGROUND_COLOR = "#FF0000"
let CURRENT_TOOL = DEFAULT_TOOLS.BRUSH
let DRAWING_WIDHT = "4"
let DRAWING_TRANSPARENCY = "1"
let CANVAS_SIZE = {
    width : 1516,
    height : 848
}
let CANVAS_ZOOM = window.innerWidth / 1920
let CANVAS_LAYERS = [[]]
let BRUSH_CURSOR = DEFAULT_CURSORS.CIRCLE
let CANVAS_LOCK = false


// ---------------------------------------

// Функции

function getKeyByValue(object, value) {
    if (value != null) {
        return Object.keys(object).find(key => object[key] === value);
    }
}

function checkState(message, gameStates) {
    for (const item of gameStates) {
        if (item.necessity.includes(message)) {
            return item.state
        }
    }
    return null
}

// Слушатель сообщений от вебсокета.
function messageListener() {    
    if (window.sockets) {
        window.sockets[window.sockets.length-1].addEventListener("message", (event) => {
            let message
            try {
                if (event.data != PING_IGNORE) {
                    message = JSON.parse(event.data.slice(2).toString())
                    if (message[1] != 11 && INCLUDED_STATES.includes(message[1])) {
                        CURRENT_GAME_STATE = checkState(message[1], GAME_STATES)
                        console.log(DEFAULT_MOD_PREFIX + "Игре задан новый state - " + getKeyByValue(DEFAULT_GAME_STATE, CURRENT_GAME_STATE));
                        
                    }else if(INCLUDED_STATES.includes(message[2].screen)){
                        CURRENT_GAME_STATE = checkState(message[2].screen, GAME_STATES_ALTERED)
                        console.log(DEFAULT_MOD_PREFIX + "Игре задан новый state - " + getKeyByValue(DEFAULT_GAME_STATE, CURRENT_GAME_STATE));
                    }
                }else{
                    message = PING_IGNORE
                }
            } catch {
                console.warn(DEFAULT_MOD_PREFIX + "Переменная message содержит не JSON-parsable значение.");
            }
        })
            
    } else {
        console.error(DEFAULT_MOD_PREFIX + "Сокеты не существуют.");
    }
}

// Классы
class DrawingModule{
    isDrawing = false
    isDragging = false
    isMirrored = false
    isScaling = false
    points = []
    strokeAmount = 0
    snapshot
    continiousPoints = ""

    undoAmount = 0

    constructor(canvas, brushCanvas, proxyModule, width, height){
        this.canvas = canvas
        this.brushCanvas = brushCanvas
        this.canvas.width = width
        this.canvas.height = height
        this.brushCanvas.width = width
        this.brushCanvas.height = height
        this.drawingContainer = this.canvas.parentElement
        this.proxyModule = proxyModule
    }

    init(){
        this.drawingContainer.style.scale = this.scale
        this.isDragging = false
        this.setModuleContext()
        this.canvasList = [[]]
        this.points = []
        this.context.fillStyle = "white"
        this.context.fillRect(0,0, this.canvas.width, this.canvas.height)
        this.setMouseEvents()
    }

    setDrawColor(color){
        this.drawColor = color
    }

    getMirrorPhase(){
        return (+this.isMirrored*2-1)*-1
    }

    setMouseEvents(){
        const { drawingContainer } = this;
        const parentElement = drawingContainer.parentElement;
    
        const startEvents = ["touchstart", "pointerdown"];
        startEvents.forEach(eventType => {
            drawingContainer.addEventListener(eventType, event => this.dragStart(event));
            drawingContainer.addEventListener(eventType, event => this.startLine(event));
        });
    
        const moveEvents = ["touchmove", "pointermove"];
        moveEvents.forEach(eventType => {
            document.querySelector(".screen").addEventListener(eventType, event => this.dragCanvas(event));
            parentElement.addEventListener(eventType, event => this.drawLine(event));
            parentElement.addEventListener(eventType, event => this.renderCrosshair(event));
        });
    
        const endEvents = ["touchend", "pointerup"];
        endEvents.forEach(eventType => {
            document.querySelector(".screen").addEventListener(eventType, event => this.dragEnd(event));
            document.querySelector(".screen").addEventListener(eventType, event => this.stopLine(event));
        });

        drawingContainer.addEventListener("wheel", event => this.zoom(event))
    
    }

    zoom(event){
        event.preventDefault()
        this.scale += event.deltaY * ZOOM_SENS * -1
        this.scale = Math.min(Math.max(0.125, this.scale), 4);
        this.drawingContainer.style.scale = this.scale
        document.querySelectorAll(".PMFooter_element")[0].textContent = `ZOOM: ${Math.floor(this.scale*100)}%`
    }

    startX
    startY
    shiftX
    shiftY

    dragStart(event){
        if(event.which == 2){
            this.isDragging = true
            const rect = this.drawingContainer.getBoundingClientRect();
            this.shiftX = ((this.drawingContainer.offsetWidth - (rect.right - rect.left)) / 2) + (event.clientX - rect.left)
            this.shiftY = ((this.drawingContainer.offsetHeight - (rect.bottom - rect.top)) / 2) + (event.clientY - rect.top)
            event.preventDefault()
            event.stopImmediatePropagation()
        }
    }

    dragCanvas(event){
        if (this.isDragging) {
            if(event.which == 0){
                this.drawingContainer.style.left = ((event.clientX - this.shiftX)) + "px" //(event.x - this.shiftX) + "px"
                this.drawingContainer.style.top = ((event.clientY - this.shiftY)) + "px"//(event.y - this.shiftY) + "px"
                event.preventDefault()
                event.stopImmediatePropagation()
            }
        }
    }

    dragEnd(event){
        if(event.which == 2){
            this.isDragging = false
            event.preventDefault()
            event.stopImmediatePropagation()
        }
    }

    getMouseCursor(event, canvas){
        let canvasPos = this.canvas.getBoundingClientRect()
        this.prevPos.x = ((this.canvas.width*this.isMirrored*-1) + (((event.clientX - canvasPos.left)*2)/this.scale))*this.getMirrorPhase()
        this.prevPos.y = (((event.clientY - canvasPos.top)*2)/this.scale)
        return {
            x:((this.canvas.width*this.isMirrored*-1) + (((event.clientX - canvasPos.left)*2)/this.scale))*this.getMirrorPhase(),
            y:(((event.clientY - canvasPos.top)*2)/this.scale)
            }
    }

    prevPos = {x:0, y:0}

    setDrawStyle(){
        this.context.strokeStyle = this.drawColor
        this.context.lineWidth = this.drawWidth
        this.context.globalAlpha = this.drawTransparency
        this.context.lineCap = "round"
        this.context.lineJoin = "round"
    }

    getModuleContext(){
        return this.context
    }

    setModuleContext(){
        this.context = this.canvas.getContext("2d")
    }

    lockCanvas(state){
        this.canvasLocked = state
    }

    midPointBtw(p1, p2) {
        return {
          x: p1.x + (p2.x - p1.x) / 2,
          y: p1.y + (p2.y - p1.y) / 2
        };
    }

    firstPos = {x:0, y:0}
    preWidth = 0
    startLine(event){
        if (!this.canvasLocked) {
            if (GLOBAL_KEYS["ShiftLeft"] == true && GLOBAL_KEYS["ControlLeft"] == undefined){
                this.isScaling = true
                this.firstPos = this.getMouseCursor(event, this.drawingContainer.parentElement)
                this.preWidth = this.drawWidth
                this.renderCrosshair(event)
            }
            else if (GLOBAL_KEYS["ShiftLeft"] == true && GLOBAL_KEYS["ControlLeft"] == true) {
                this.isScaling = true
                this.firstPos = this.getMouseCursor(event, this.drawingContainer.parentElement)
                this.preTransparency = this.drawTransparency
            }else{
                this.isDrawing = true
                switch (this.currentTool) {
                    case TOOLS.BRUSH:
                        this.setDrawStyle()
                        this.snapshot = this.getModuleContext().getImageData(0, 0, 1516, 848)
                        this.points.push({x:this.getMouseCursor(event, this.drawingContainer.parentElement).x, y:this.getMouseCursor(event, this.drawingContainer.parentElement).y})
                        this.continiousPoints = ""

                        this.continiousPoints += `[${(this.getMouseCursor(event, this.drawingContainer.parentElement).x)/2},${(this.getMouseCursor(event, this.drawingContainer.parentElement).y)/2}],`

                        this.canvasList[0].push({
                            press : 1,
                            color : this.drawColor,
                            transparency : this.drawTransparency,
                            pressNumber : this.strokeAmount,
                            posArray : `[${(this.getMouseCursor(event, this.drawingContainer.parentElement).x)/2},${(this.getMouseCursor(event, this.drawingContainer.parentElement).y)/2}]`,
                            width : this.drawWidth,
                            canvasContext : this.getModuleContext()
                        })

                        if (!SETTINGS.GLOBAL_LAYERS.state) {
                            this.proxyModule.sendStroke(this.canvasList[0][this.canvasList[0].length-1])
                        }
                        break;
                
                    case TOOLS.ERASER:
                        this.setDrawStyle()
                        this.snapshot = this.getModuleContext().getImageData(0, 0, 1516, 848)
                        this.points.push({x:this.getMouseCursor(event, this.drawingContainer.parentElement).x, y:this.getMouseCursor(event, this.drawingContainer.parentElement).y})
                        this.continiousPoints = ""

                        this.continiousPoints += `[${(this.getMouseCursor(event, this.drawingContainer.parentElement).x)/2},${(this.getMouseCursor(event, this.drawingContainer.parentElement).y)/2}],`

                        this.canvasList[0].push({
                            press : 1,
                            color : this.drawColor,
                            transparency : this.drawTransparency,
                            pressNumber : this.strokeAmount,
                            posArray : `[${(this.getMouseCursor(event, this.drawingContainer.parentElement).x)/2},${(this.getMouseCursor(event, this.drawingContainer.parentElement).y)/2}]`,
                            width : this.drawWidth,
                            canvasContext : this.getModuleContext()
                        })

                        if (!SETTINGS.GLOBAL_LAYERS.state) {
                            this.proxyModule.sendStroke(this.canvasList[0][this.canvasList[0].length-1])
                        }
                        break;
                }
            }
            
            this.drawLine(event)


            event.preventDefault()
        }
    }
    drawLine(event) {
        if(GLOBAL_KEYS["ShiftLeft"] == true && GLOBAL_KEYS["ControlLeft"] == undefined) {
            if (this.isScaling) {
                //this.drawWidth = Math.round(Math.sqrt(
                //    Math.pow((this.firstPos.x - this.getMouseCursor(event).x), 2) + Math.pow((this.firstPos.y - this.getMouseCursor(event).y), 2)
                //)/SCALE_WEIGHT + 1)
                let scale = Math.round((this.getMouseCursor(event).x - this.firstPos.x)/SCALE_WEIGHT)
                this.drawWidth = Math.max(+this.preWidth + scale, 1)
                this.renderCrosshair(event)
                document.querySelector("#brushRadiusValue").value = this.drawWidth
                document.querySelector("#brushRadiusInput").value = this.drawWidth + " пикс."
            }
        }
        else if(GLOBAL_KEYS["ShiftLeft"] == true && GLOBAL_KEYS["ControlLeft"] == true) {
            if (this.isScaling) {
                let scale = Math.round((this.getMouseCursor(event).x - this.firstPos.x)/SCALE_WEIGHT)
                this.drawTransparency = Math.round(Math.min(Math.max(+this.preTransparency*100 + scale, 1), 100))/100
                this.renderCrosshair(event)
                document.querySelector("#brushTransparencyValue").value = Math.round(this.drawTransparency*100)
                document.querySelector("#brushTransparencyInput").value = Math.round(this.drawTransparency*100) + "%"
            }
        }else{
            if (this.isDrawing) {
                let p1, p2
                switch (this.currentTool) {
                    case TOOLS.BRUSH:
                        this.drawColor = this.foregroundColor
                        this.setDrawStyle()
                        this.points.push({x:this.getMouseCursor(event, this.drawingContainer.parentElement).x, y:this.getMouseCursor(event, this.drawingContainer.parentElement).y})
                        this.getModuleContext().clearRect(0, 0, this.width, this.height)
                        this.getModuleContext().putImageData(this.snapshot, 0, 0);
                        p1 = this.points[0]
                        p2 = this.points[1]
                        this.getModuleContext().beginPath()
                        this.getModuleContext().moveTo(p1.x, p1.y)
            
            
                        for (let index = 1, len = this.points.length; index < len; index++) {
                            let midPoint = this.midPointBtw(p1, p2)
                            this.getModuleContext().quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y)
                            p1 = this.points[index]
                            p2 = this.points[index+1]
                            
                        }
            
                        this.getModuleContext().lineTo(p1.x, p1.y)
                        this.getModuleContext().stroke()
            
                        this.continiousPoints += `[${p1.x/2}, ${p1.y/2}],`
                        break;
                
                    case TOOLS.ERASER:
                        this.points.push({x:this.getMouseCursor(event, this.drawingContainer.parentElement).x, y:this.getMouseCursor(event, this.drawingContainer.parentElement).y})
                        this.getModuleContext().clearRect(0, 0, this.width, this.height)
                        this.getModuleContext().putImageData(this.snapshot, 0, 0);
                        p1 = this.points[0]
                        p2 = this.points[1]
                        this.getModuleContext().beginPath()
                        this.getModuleContext().moveTo(p1.x, p1.y)
            
            
                        for (let index = 1, len = this.points.length; index < len; index++) {
                            let midPoint = this.midPointBtw(p1, p2)
                            this.getModuleContext().quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y)
                            p1 = this.points[index]
                            p2 = this.points[index+1]
                            
                        }
                        this.drawColor = "#FFFFFF"
                        this.setDrawStyle()
                        this.getModuleContext().lineTo(p1.x, p1.y)
                        this.getModuleContext().stroke()
            
                        this.continiousPoints += `[${p1.x/2}, ${p1.y/2}],`
                        break
    
                    case TOOLS.COLOR_PICKER:
                        this.drawColor = this.getColor()
                        this.foregroundColor = this.getColor()
                        document.querySelectorAll(".PMFast__color")[0].style.backgroundColor = this.foregroundColor
                        CLASS_INSTANCES[3].refreshPalette()
                        break
                    
                    case TOOLS.FILL:
                        this.floodFill(event, this.canvasLayer)
                        break
                }
            }
        }
        event.preventDefault()
    }

    stopLine(event) {
        if (this.isDrawing) {
            /*
            this.getModuleContext().stroke()
            this.getModuleContext().closePath()
            this.isDrawing = false
            */
            this.isDrawing = false
            this.points.length = 0
            switch (this.currentTool) {
                case TOOLS.BRUSH:
                    this.canvasList[0].push({
                        press : 3,
                        color : this.drawColor,
                        transparency : this.drawTransparency,
                        pressNumber : this.strokeAmount,
                        posArray : this.continiousPoints.slice(0, -1),
                        width : this.drawWidth,
                        canvasContext : this.getModuleContext()
                    })
        
                    if (!SETTINGS.GLOBAL_LAYERS.state) {
                        this.proxyModule.sendStroke(this.canvasList[0][this.canvasList[0].length - 1])
                    }
                    this.strokeAmount++;
                    this.undoAmount = this.strokeAmount
                    break;
            
                case TOOLS.ERASER:
                    this.canvasList[0].push({
                        press : 3,
                        color : this.drawColor,
                        transparency : this.drawTransparency,
                        pressNumber : this.strokeAmount,
                        posArray : this.continiousPoints.slice(0, -1),
                        width : this.drawWidth,
                        canvasContext : this.getModuleContext()
                    })
        
                    if (!SETTINGS.GLOBAL_LAYERS.state) {
                        this.proxyModule.sendStroke(this.canvasList[0][this.canvasList[0].length - 1])
                    }
                    this.strokeAmount++;
                    this.undoAmount = this.strokeAmount
                    break;
                
                case TOOLS.FILL:

                    break
            }
        }

        if (this.isScaling) {
            this.isScaling = false
        }
        event.preventDefault()
    }

    renderCrosshair(event){
        let brushContext
        switch (this.currentTool) {
            case TOOLS.COLOR_PICKER:
                brushContext = this.brushCanvas.getContext("2d")
                brushContext.clearRect(0, 0, this.brushCanvas.width, this.brushCanvas.height);
                brushContext.strokeStyle = "#000000";
                brushContext.beginPath();
                brushContext.moveTo(this.getMouseCursor(event, this.brushCanvas).x - 5, this.getMouseCursor(event, this.brushCanvas).y)
                brushContext.lineTo(this.getMouseCursor(event, this.brushCanvas).x + 5, this.getMouseCursor(event, this.brushCanvas).y)
                brushContext.moveTo(this.getMouseCursor(event, this.brushCanvas).x, this.getMouseCursor(event, this.brushCanvas).y - 5)
                brushContext.lineTo(this.getMouseCursor(event, this.brushCanvas).x, this.getMouseCursor(event, this.brushCanvas).y + 5)
                brushContext.stroke();

                brushContext.strokeStyle = "#FFFFFF";
                brushContext.beginPath();
                brushContext.moveTo(this.getMouseCursor(event, this.brushCanvas).x - 5, this.getMouseCursor(event, this.brushCanvas).y+1)
                brushContext.lineTo(this.getMouseCursor(event, this.brushCanvas).x + 5, this.getMouseCursor(event, this.brushCanvas).y+1)
                brushContext.moveTo(this.getMouseCursor(event, this.brushCanvas).x, this.getMouseCursor(event, this.brushCanvas).y - 5+1)
                brushContext.lineTo(this.getMouseCursor(event, this.brushCanvas).x, this.getMouseCursor(event, this.brushCanvas).y + 5+1)
                brushContext.stroke();
                break;
        
            default:
                brushContext = this.brushCanvas.getContext("2d")
                brushContext.clearRect(0, 0, this.brushCanvas.width, this.brushCanvas.height);
                brushContext.strokeStyle = "#000000";
                brushContext.beginPath();
                brushContext.arc(
                    this.getMouseCursor(event, this.brushCanvas).x,
                    this.getMouseCursor(event, this.brushCanvas).y,
                    this.drawWidth/2, 0, Math.PI * 2
                );
                brushContext.stroke();

                if (this.drawWidth >= 20) {
                    brushContext.strokeStyle = "rgba(0, 0, 0, 0.5)";
                    brushContext.beginPath();
                    brushContext.arc(
                        this.getMouseCursor(event, this.brushCanvas).x,
                        this.getMouseCursor(event, this.brushCanvas).y,
                        0.5, 0, Math.PI * 2
                    );

                    brushContext.stroke();
                    brushContext.strokeStyle = "rgba(255, 255, 255, 0.5)";
                    brushContext.beginPath();
                    brushContext.arc(
                        this.getMouseCursor(event, this.brushCanvas).x,
                        this.getMouseCursor(event, this.brushCanvas).y,
                        1, 0, Math.PI * 2
                    );
                    brushContext.stroke();
                }

                brushContext.strokeStyle = "#FFFFFF";
                brushContext.beginPath();
                brushContext.arc(
                    this.getMouseCursor(event, this.brushCanvas).x,
                    this.getMouseCursor(event, this.brushCanvas).y,
                    this.drawWidth/2+1, 0, Math.PI * 2
                );
                brushContext.stroke();
                break;
        }
    }

    listToLayer(canvasLayer, cursor){
        let layer = {
            points : stringToArray(canvasLayer[cursor].posArray),
            color : canvasLayer[cursor].color,
            width : canvasLayer[cursor].width,
            transparency : canvasLayer[cursor].transparency
        }
        return layer
    }

    floodFill(event, canvasLayer) {
        let x = this.getMouseCursor(event, canvasLayer).x
        let y = this.getMouseCursor(event, canvasLayer).y
        const imageData = this.getModuleContext().getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        const targetColor = this.foregroundColor
        let targetColorStr
        if (targetColor[0] == "#") {
            targetColorStr = `rgba(${hexToRgb(targetColor).r}}, ${hexToRgb(targetColor).g}, ${hexToRgb(targetColor).b}, ${this.drawTransparency})`;
        }else{
            targetColorStr = `rgba(${targetColor.r}, ${targetColor.g}, ${targetColor.b}, ${this.drawTransparency})`;
        }
        
        const stack = [{ x: x, y: y }];
    
        while (stack.length) {
            const { x, y } = stack.pop();
    
            const index = (y * this.canvas.width + x) * 4;
            if (data[index] !== targetColor.r || data[index + 1] !== targetColor.g ||
                data[index + 2] !== targetColor.b || data[index + 3] !== this.drawTransparency) {
                continue;
            }
    
            data[index] = parseInt(fillColor.substring(1, 3), 16); // r
            data[index + 1] = parseInt(fillColor.substring(3, 5), 16); // g
            data[index + 2] = parseInt(fillColor.substring(5, 7), 16); // b
            data[index + 3] = this.drawTransparency; // Полная непрозрачность
    
            stack.push({ x: x + 1, y: y });
            stack.push({ x: x - 1, y: y });
            stack.push({ x: x, y: y + 1 });
            stack.push({ x: x, y: y - 1 });
        }
    
        this.getModuleContext().putImageData(imageData, 0, 0);
    }

    refresh(layer){
        const context = this.getModuleContext();
        context.fillStyle = "#fff";
        context.globalAlpha = 1;
        context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        
        for (let layerCount = 1; layerCount <= layer.length; layerCount += 2) {
            const currentLayer = this.listToLayer(layer, layerCount);
            const points = currentLayer.points;
            context.clearRect(0, 0, this.width, this.height);
            context.strokeStyle = currentLayer.color;
            context.lineWidth = currentLayer.width;
            context.globalAlpha = currentLayer.transparency;
        
            context.beginPath();
            context.moveTo(points[0][0] * 2, points[0][1] * 2);
        
            points.forEach((coords, index) => {
                const nextIndex = index + 1 < points.length ? index + 1 : index;
                const p1 = points[nextIndex][0];
                const p2 = points[nextIndex][1];
        
                const midPoint = this.midPointBtw(
                    { x: coords[0], y: coords[1] },
                    { x: p1, y: p2 }
                );
        
                context.quadraticCurveTo(coords[0] * 2, coords[1] * 2, midPoint.x * 2, midPoint.y * 2);
            });
        
            context.stroke();
        }
    }

    mirrorCanvas(){
        this.isMirrored == false ? this.isMirrored = true : this.isMirrored = false
        this.isMirrored == true? this.drawingContainer.style.transformOrigin = `50% 50%`: this.drawingContainer.style.transformOrigin = `50% 50%`
        this.drawingContainer.style.transform = "scaleX("+this.getMirrorPhase()+")"
        document.querySelectorAll(".PMFooter_element")[1].textContent = this.isMirrored? "MIRRORED: TRUE" : "MIRRORED: false"
    }

    getColor(){
        let pixel = this.getModuleContext().getImageData(
            this.prevPos.x, 
            this.prevPos.y,
            1,
            1
        )['data']
        return `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`
    }
    
    undoHandler(){
        if (this.isDragging == false) {
            if (!SETTINGS.GLOBAL_LAYERS.state) {
                this.proxyModule.undo({
                    strokeAmount : this.undoAmount,
                })
            }
        }
    }
}

// Подгрузка модулей
const MODULES_ONLOAD = {
    "proxyModule": {
        name : ProxyModule,
        constructor : [],
        stateRequired : DEFAULT_GAME_STATE.DRAWING
    }
}