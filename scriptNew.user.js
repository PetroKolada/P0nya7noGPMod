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
let ZOOM_BOUNDS = {
    min : 0.125,
    max : 4
}
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
let BRUSH_SCALE_WEIGHT = 5
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

const EVENT_SHOOTER = {
    ActionStart : "pointerdown",
    ActionMove : "pointermove",
    ActionEnd : "pointerup",
}

const MOUSE_EVENT_FILTER = {
    leftMouse : 0,
    middleMouse : 1,
    rightMouse : 2,
}

// HudModule
const HUD_HTML = `
            <div class="PMCenter_panel">
                <div class="PMHeader">
                    <div class="PMHeader_links">
                        <div class="PMHeader_element">P0nya7noGP</div>
                        <div class="PMHeader_element"><a href="https://discord.gg/XH5jeyD3hg" target=”_blank”>Дискорд сервер</a></div>
                        <div class="PMHeader_element">Настройки</div>
                        <div class="PMHeader_element">Окна</div>
                        <div class="PMHeader_element">Фильтры</div>
                    </div>
                    <div class="PMHeader_links">
                        <div class="PMHeader_element">14/13</div>
                        <div class="PMHeader_element">00:05</div>
                    </div>
                </div>
                <div class="PMPanel_inside">
                    <div class="PMReady__overlay"></div>
                    <div class="PMPanel_tools">
                        <div class="PMTool PMTool__active"><svg id="Layer_1" height="512" viewBox="0 0 24 24" width="512" xmlns="http://www.w3.org/2000/svg" data-name="Layer 1"><path d="m.024 23.976.076-1.05c.076-1.1.545-6.688 2.307-8.451a5.036 5.036 0 0 1 7.118 7.125c-1.762 1.762-7.349 2.23-8.452 2.306zm23.076-23.108a3.137 3.137 0 0 0 -4.333 0l-10.515 10.519a6.967 6.967 0 0 1 4.342 4.324l10.506-10.511a3.067 3.067 0 0 0 0-4.332z"/></svg></div>
                        <div class="PMTool"><svg xmlns="http://www.w3.org/2000/svg" id="Layer_1" data-name="Layer 1" viewBox="0 0 24 24" width="512" height="512"><path d="m7.242,7.438L12.751,1.911c1.17-1.175,3.213-1.175,4.383,0l5.935,5.955c1.206,1.21,1.206,3.179,0,4.389l-5.506,5.525L7.242,7.438Zm7.111,13.562l1.798-1.804L5.83,8.855.882,13.82c-1.206,1.21-1.206,3.179,0,4.389l4.774,4.791h18.344v-2h-9.647Z"/></svg></div>
                        <div class="PMTool"><svg id="Layer_1" height="512" viewBox="0 0 24 24" width="512" xmlns="http://www.w3.org/2000/svg" data-name="Layer 1"><path d="m24 3.023a3 3 0 0 1 -.886 2.138l-3.407 3.407a3.455 3.455 0 0 0 -.071 4.837l-1.436 1.395-9-9 1.4-1.436a3.456 3.456 0 0 0 4.837-.071l3.402-3.407a3.094 3.094 0 0 1 4.276 0 3 3 0 0 1 .885 2.137zm-22.087 14.658a3.074 3.074 0 0 0 -.582 3.574l-1.331 1.331 1.414 1.414 1.331-1.331a3.074 3.074 0 0 0 3.574-.582l8.049-8.049-4.406-4.406z"/></svg></div>
                        <div class="PMTool"><svg id="Layer_1" height="512" viewBox="0 0 24 24" width="512" xmlns="http://www.w3.org/2000/svg" data-name="Layer 1"><path d="m21.45 13.864-9.258 9.257a3 3 0 0 1 -4.243 0l-7.07-7.071a3 3 0 0 1 0-4.242l6.3-6.3-2.861-2.886 1.422-1.406 8.969 9.08 1.537-1.526-6.125-6.2.015-.016-1.1-1.1 1.415-1.417 13.577 13.576-1.415 1.415zm-2.45 7.636a2.5 2.5 0 0 0 5 0c0-1.381-2.5-4.5-2.5-4.5s-2.5 3.25-2.5 4.5z"/></svg></div>
                        <div class="PMTool"><svg xmlns="http://www.w3.org/2000/svg" id="Isolation_Mode" data-name="Isolation Mode" viewBox="0 0 24 24" width="512" height="512"><path d="M24,24H0V0H24ZM3,21H21V3H3Z"/></svg></div>
                        <div class="PMTool"><svg xmlns="http://www.w3.org/2000/svg" id="Bold" viewBox="0 0 24 24" width="512" height="512"><path d="M12,0A12,12,0,1,0,24,12,12.013,12.013,0,0,0,12,0Zm0,21a9,9,0,1,1,9-9A9.01,9.01,0,0,1,12,21Z"/></svg></div>
                        <div class="PMTool"><svg xmlns="http://www.w3.org/2000/svg" id="Layer_1" data-name="Layer 1" viewBox="0 0 24 24" width="512" height="512"><path d="M12,0A12,12,0,1,0,24,12,12.013,12.013,0,0,0,12,0Z"/></svg></div>
                    </div>
                </div>
                <div class="PMFooter">
                    <span>
                        <div class="PMFooter_element">ZOOM: 100%</div>
                        <div class="PMFooter_element">MIRRORED: false</div>
                        <div class="PMFooter_element">1516px. X 848px. (300ppi)</div>
                    </span>
                    <button class="PMRender__button">Готово.</button>
                </div>
            </div>
            <div class="PMRight_panel">
                <div class="PMPanel">
                    <div class="PMPanel_header">
                        <div class="PMPTitle PMPanel__active">Палитра</div>
                    </div>
                    <div class="PMPanel_main_holder">
                        <div class="PMPanel_hero PMColor">
                            <div class="PMFast_color_holder">
                                <div class="PMFast__color">+</div>
                                <div class="PMFast__color"></div>
                            </div>
                            <canvas class="PMPalette"></canvas>
                            <canvas class="PMPalette_hue"></canvas>
                        </div>
                    </div>
                </div>
                <div class="PMPanel">
                    <div class="PMPanel_header">
                        <div class="PMPTitle PMPanel__active">Сохраненные цвета</div>
                    </div>
                    <div class="PMPanel_main_holder">
                        <div class="PMPanel_hero PMColorPresets">
                            <div class="PMColor_save" style="background-color: rgb(0, 0, 0)"></div>
                            <div class="PMColor_save" style="background-color: rgb(255, 255, 255)"></div>
                            <div class="PMColor_save" style="background-color: rgb(255, 0, 0)"></div>
                            <div class="PMColor_save" style="background-color: rgb(0, 255, 0)"></div>
                            <div class="PMColor_save" style="background-color: rgb(0, 0, 255)"></div>

                        </div>
                    </div>
                </div>
                <div class="PMPanel">
                    <div class="PMPanel_header">
                        <div class="PMPTitle PMPanel__active">Кисть</div>
                        <div class="PMPTitle">Пресеты</div>
                    </div>
                    <div class="PMPanel_main_holder">
                        <div class="PMPanel_hero" id="brushSettingsHolder">
                            <div class="PMBrush_setting_holder">
                                <div class="PMBrush_setting_title">
                                    Размер:
                                    <input type="value" id="brushRadiusInput" min="1" value="4 пикс.">
                                </div>
                                <input type="range" id="brushRadiusValue" min="1" value="4">
                            </div>
                            <div class="PMBrush_setting_holder">
                                <div class="PMBrush_setting_title">
                                    Непрозрачность:
                                    <input type="value" id="brushTransparencyInput" min="1" value="100%">
                                </div>
                                <input type="range" id="brushTransparencyValue" min="1" value="100">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="PMPanel">
                    <div class="PMPanel_header">
                        <div class="PMPTitle PMPanel__active">Слои</div>
                    </div>
                    <div class="PMPanel_main_holder">
                        <div class="PMPanel_hero">
                            <div class="PMLayer_holder">
                                <div class="PMLayer">
                                    <div class="PMLayer__hide PMLayer_button"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="512" height="512"><g id="_01_align_center" data-name="01 align center"><path d="M23.821,11.181v0C22.943,9.261,19.5,3,12,3S1.057,9.261.179,11.181a1.969,1.969,0,0,0,0,1.64C1.057,14.739,4.5,21,12,21s10.943-6.261,11.821-8.181A1.968,1.968,0,0,0,23.821,11.181ZM12,19c-6.307,0-9.25-5.366-10-6.989C2.75,10.366,5.693,5,12,5c6.292,0,9.236,5.343,10,7C21.236,13.657,18.292,19,12,19Z"/><path d="M12,7a5,5,0,1,0,5,5A5.006,5.006,0,0,0,12,7Zm0,8a3,3,0,1,1,3-3A3,3,0,0,1,12,15Z"/></g></svg>
                                    </div>
                                    <input class="PMLayer__title" type="text" placeholder="Безымянный слой">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="PMLayer_holder_footer">
                        <div class="PMLayer_button"><svg xmlns="http://www.w3.org/2000/svg" id="Layer_1" data-name="Layer 1" viewBox="0 0 24 24" width="512" height="512"><path d="M24,9.367v2.332l-12,7.2L0,11.7v-2.332l12,7.2,12-7.2Zm-.056-2.137L12,.064,.056,7.23l11.944,7.166,11.944-7.166ZM0,13.699v2.332l12,7.2,2-1.2v-2.332l-2,1.2L0,13.699Zm21,2.301h-2v3h-3v2h3v3h2v-3h3v-2h-3v-3Z"/></svg></div>
                        <div class="PMLayer_button"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="512" height="512"><g id="_01_align_center" data-name="01 align center"><path d="M22,4H17V2a2,2,0,0,0-2-2H9A2,2,0,0,0,7,2V4H2V6H4V21a3,3,0,0,0,3,3H17a3,3,0,0,0,3-3V6h2ZM9,2h6V4H9Zm9,19a1,1,0,0,1-1,1H7a1,1,0,0,1-1-1V6H18Z"/><rect x="9" y="10" width="2" height="8"/><rect x="13" y="10" width="2" height="8"/></g></svg></div>
                    </div>
                </div>
            </div>
        `
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

function emptyObject(myObject) {
    for (var member in myObject) delete myObject[member];
}

function midPointBtw(p1, p2) {
    return {
      x: p1.x + (p2.x - p1.x) / 2,
      y: p1.y + (p2.y - p1.y) / 2
    };
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
                        modificationInit(MODULES_ONLOAD)
                        
                    }else if(INCLUDED_STATES.includes(message[2].screen)){
                        CURRENT_GAME_STATE = checkState(message[2].screen, GAME_STATES_ALTERED)
                        console.log(DEFAULT_MOD_PREFIX + "Игре задан новый state - " + getKeyByValue(DEFAULT_GAME_STATE, CURRENT_GAME_STATE));
                        modificationInit(MODULES_ONLOAD)
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
    continiousPoints = ""
    strokeAmount = 0
    undoAmount = 0

    drawingCanvas 
    finishingCanvas 
    brushCanvas

    drawingCanvasContext
    finishingCanvasContext
    brushCanvasContext

    screen = document.querySelector(".screen")

    constructor(declarationElement, width, height){
        this.width = width
        this.height = height
        this.declarationElement = document.querySelector(declarationElement)
        this.init()
    }

    init(){
        this.declarationElement.style.scale = CANVAS_ZOOM
        this.setMouseEvents(EVENT_SHOOTER)
        this.buildFirstCanvas()
    }

    buildFirstCanvas(){
        this.drawingCanvas = document.createElement("canvas")
        this.drawingCanvas.width = this.width
        this.drawingCanvas.height = this.height

        this.finishingCanvas = document.createElement("canvas")
        this.finishingCanvas.width = this.width
        this.finishingCanvas.height = this.height

        this.brushCanvas = document.createElement("canvas")
        this.brushCanvas.width = this.width
        this.brushCanvas.height = this.height

        this.drawingCanvasContext = this.drawingCanvas.getContext("2d")
        this.finishingCanvasContext = this.finishingCanvas.getContext("2d")
        this.brushCanvasContext = this.brushCanvas.getContext("2d")

        this.declarationElement.appendChild(this.finishingCanvas)
        this.declarationElement.appendChild(this.drawingCanvas)
        this.declarationElement.appendChild(this.brushCanvas)
    }

    getMouseCursorOnElement(event, element){
        let elementBounds = element.getBoundingClientRect()
        return {
            x: event.clientX - elementBounds.left,
            y: event.clientY - elementBounds.top
        }
    }

    getCanvasCursor(event, canvas){
        let canvasPos = canvas.getBoundingClientRect()
        return {
            x:((this.width*this.isMirrored*-1) + (((event.clientX - canvasPos.left)*2)/CANVAS_ZOOM))*this.getMirrorPhase(),
            y:(((event.clientY - canvasPos.top)*2)/CANVAS_ZOOM)
        }
    }

    setMouseEvents(eventObject){
        this.screen.addEventListener(eventObject.ActionStart, event => this.actionStart(event))
        this.screen.addEventListener(eventObject.ActionMove, event => this.actionMove(event))
        this.screen.addEventListener(eventObject.ActionEnd, event => this.actionEnd(event))
        this.declarationElement.addEventListener("wheel", event => this.actionWheel(event))
    }

    getColor(x, y){
        let pixel = this.getModuleContext().getImageData(
            x, 
            y,
            1,
            1
        )['data']
        return `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`
    }

    actionStart(event){
        if (!CANVAS_LOCK){
            switch (event.button) {
                case MOUSE_EVENT_FILTER.leftMouse:
                    if(GLOBAL_KEYS[MODIFICATION_KEYS.Switching]){
                        
                    }else{
                        this.drawLine(this.getCanvasCursor(event, this.drawingCanvas).x,
                        this.getCanvasCursor(event, this.drawingCanvas).y,
                        DRAWING_WIDHT,
                        DRAWING_TRANSPARENCY,
                        DRAWING_COLOR
                    )
                    }
                    break;
                case MOUSE_EVENT_FILTER.middleMouse:
    
                    break;
                case MOUSE_EVENT_FILTER.rightMouse:
    
                    break;
            }
        }
    }

    actionMove(event){
        switch (event.button) {
            case MOUSE_EVENT_FILTER.leftMouse:
                
                break;
            case MOUSE_EVENT_FILTER.middleMouse:

                break;
            case MOUSE_EVENT_FILTER.rightMouse:

                break;
        }
    }

    actionEnd(event){
        switch (event.button) {
            case MOUSE_EVENT_FILTER.leftMouse:
                
                break;
            case MOUSE_EVENT_FILTER.middleMouse:

                break;
            case MOUSE_EVENT_FILTER.rightMouse:

                break;
        }
    }

    drawLine(x, y, width, transparency, color){

    }

    actionWheel(event){
        event.preventDefault()
        CANVAS_ZOOM = event.deltaY * ZOOM_SENS * -1
        this.zoomCanvas(CANVAS_ZOOM)
    }

    zoomCanvas(amount){
        this.declarationElement.style.scale = amount
    }

    getMirrorPhase(){
        return (+this.isMirrored*2-1)*-1
    }
}

class HudModule{
    constructor(HudElement){
        this.hudElement = document.querySelector(HudElement)
        this.init()
    }

    resetDefault(){
        try {
            let draw = document.querySelector(".jsx-267435985")
            document.querySelector(".jsx-83c337f44c9d610").innerHTML += draw.outerHTML
            document.querySelector(".core").remove()
            document.querySelector(".jsx-470877037").remove()
            document.querySelector(".bottom").remove()
            document.querySelector(".download").remove()
            document.querySelector(".sound").remove()
            this.hudElement.querySelector(".colors").remove()
            this.hudElement.querySelector(".tools").remove()
        } catch (error) {}
        //this.hudElement.querySelector(".options").remove()?[]:[]
    }

    renderHud(){
        this.hudElement.innerHTML += HUD_HTML
        document.querySelector(".PMPanel_inside").appendChild(document.querySelector(".draw"))
        
    }

    init(){
        this.resetDefault()
        this.renderHud()
    }
}

class PaletteModule{
    color = "#ff0000"
    colorSelecting = false
    saveColors = []

    constructor(paletteElement, drawingModule){
        this.paletteElement = paletteElement
        this.drawingModule = drawingModule
    }


    getMouseCursor(event, canvas){
        let canvasPos = canvas.getBoundingClientRect()
        return {
            x:(event.clientX - canvasPos.left),
            y:(event.clientY - canvasPos.top)
            }
    }

    getModuleContext(){
        return this.context
    }

    setModuleContext(canvas){
        this.context = canvas.getContext("2d")
    }

    PaletteInit(){
        this.setModuleContext(this.paletteElement)
        this.getModuleContext().canvas.height = 252
        this.getModuleContext().canvas.width = 252
        document.querySelectorAll(".PMFast__color")[0].style.backgroundColor = this.drawingModule.foregroundColor
        document.querySelectorAll(".PMFast__color")[1].style.backgroundColor = this.drawingModule.backgroundColor
        localStorage.getItem("savedColors") != undefined ? this.savedColors = localStorage.getItem("savedColors").split(',') : this.savedColors = []
        this.savedColors.forEach(color => {
            document.querySelector(".PMColorPresets").innerHTML += `<div class="PMColor_save" style="background-color: ${color}"></div>`
        })
    }

    renderPalette(color){
        this.setModuleContext(this.paletteElement)

        this.getModuleContext().clearRect(0,0,this.getModuleContext().canvas.width, this.getModuleContext().canvas.height)

        let gradientH = this.getModuleContext() .createLinearGradient(0, 0, this.getModuleContext().canvas.width, 0);
        gradientH.addColorStop(0, '#fff');
        gradientH.addColorStop(1, color);
        this.getModuleContext().fillStyle = gradientH;
        this.getModuleContext().fillRect(0, 0, this.getModuleContext().canvas.width, this.getModuleContext().canvas.height);
    

        let gradientV = this.getModuleContext().createLinearGradient(0,0,0,this.getModuleContext().canvas.height)
        gradientV.addColorStop(0, 'rgba(0,0,0,0)');
        gradientV.addColorStop(1, '#000000');
        this.getModuleContext().fillStyle = gradientV;
        this.getModuleContext().fillRect(0, 0, this.getModuleContext().canvas.width, 
        this.getModuleContext().canvas.height); 
    }

    refreshPalette(){
        if (SETTINGS.PALETTE_UPDATE) {
            this.color = this.drawingModule.foregroundColor
            this.renderPalette(this.drawingModule.foregroundColor)
        }
    }

    setMouseEventsPalette(){
        this.paletteElement.addEventListener("touchstart", event => this.startPaletteColor(event))
        this.paletteElement.addEventListener("touchmove", event => this.setColor(event))
        this.paletteElement.addEventListener("mousedown", event => this.startPaletteColor(event))
        this.paletteElement.addEventListener("mousemove", event => this.setColor(event))
        this.paletteElement.addEventListener("touchend", event => this.stopPaletteColor(event))
        this.paletteElement.addEventListener("mouseup", event => this.stopPaletteColor(event))
        this.paletteElement.addEventListener("mouseout", event => this.stopPaletteColor(event))
        document.querySelector(".PMFast_color_holder").addEventListener("mousedown", event => this.saveColor(event))
        document.querySelector(".PMColorPresets").addEventListener("mousedown", event => this.applyColor(event))
    }

    saveColor(event){
        if (event.target.classList.contains("PMFast__color")) {
            document.querySelector(".PMColorPresets").innerHTML += `<div class="PMColor_save" style="background-color: ${event.target.style.backgroundColor}"></div>`
            let rgb = (r, g, b) => '#' + (1<<24|r<<16|g<<8|b).toString(16).slice(1)
            this.savedColors.push(eval(event.target.style.backgroundColor))
            localStorage.setItem('savedColors', this.savedColors)
        }
        event.preventDefault
    }

    applyColor(event){
        if (event.target.classList.contains("PMColor_save")){
        switch (event.which) {
            case 1:
                document.querySelectorAll(".PMFast__color")[0].style.backgroundColor = event.target.style.backgroundColor
                this.drawingModule.foregroundColor = event.target.style.backgroundColor
                this.drawingModule.drawColor = event.target.style.backgroundColor
                this.refreshPalette()
                break;
        
            case 2:
                let index = this.savedColors.indexOf(event.target) + 5
                if (index > -1){
                    this.savedColors.splice(index, 1)
                    localStorage.setItem('savedColors', this.savedColors)
                    event.target.remove()
                }
                break;
        }
        event.preventDefault()
        }
    }

    renderPaletteCursor(event){
        this.getModuleContext().strokeStyle = "#000000";
        this.getModuleContext().beginPath();
        this.getModuleContext().arc(
          this.getMouseCursor(event, this.paletteElement).x,
          this.getMouseCursor(event, this.paletteElement).y,
          10/2, 0, Math.PI * 2
        );
        this.getModuleContext().stroke();

        this.getModuleContext().strokeStyle = "#FFFFFF";
        this.getModuleContext().beginPath();
        this.getModuleContext().arc(
          this.getMouseCursor(event, this.paletteElement).x,
          this.getMouseCursor(event, this.paletteElement).y,
          10/2+1, 0, Math.PI * 2
        );
        this.getModuleContext().stroke();
    }

    getPaletteColor(event){
        let pixel = this.getModuleContext().getImageData(
            (event.clientX - this.paletteElement.getBoundingClientRect().left), 
            (event.clientY - this.paletteElement.getBoundingClientRect().top),
            1,
            1
        )['data']

        return `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`
    }

    startPaletteColor(event){
        if(!this.colorSelecting){
            this.colorSelecting = true
            this.setColor(event)
        }
    }

    setColor(event){
        if (this.colorSelecting) {
            document.querySelectorAll(".PMFast__color")[0].style.backgroundColor = this.getPaletteColor(event)
            this.drawingModule.foregroundColor = this.getPaletteColor(event)
            this.drawingModule.setDrawColor(this.drawingModule.foregroundColor)
            this.drawingModule.setDrawStyle()
            this.renderPalette(this.color)
            this.renderPaletteCursor(event)
        }
    }

    stopPaletteColor(event){
        if (this.colorSelecting) {
            this.colorSelecting = false
        }
    }
}

class HueModule extends PaletteModule{
    colorSelecting = false

    constructor(hueElement, paletteElement){
        super(paletteElement)
        this.hueElement = hueElement
    }

    init(){
        let paletteHue = this.hueElement
        this.hueContext = paletteHue.getContext("2d")
        this.hueContext.canvas.height = 250
        let hue = this.hueContext.createLinearGradient(0,0,0,this.hueContext.canvas.height)
        hue.addColorStop(0,"#ff0000")
        hue.addColorStop(0.16,"#ff00ff")
        hue.addColorStop(0.32,"#0000ff")
        hue.addColorStop(0.48,"#00ffff")
        hue.addColorStop(0.64,"#00ff00")
        hue.addColorStop(0.80,"#ffff00")
        hue.addColorStop(1,"#ff0000")
        this.hueContext.fillStyle = hue
        this.hueContext.fillRect(0,0, this.hueContext.canvas.width, this.hueContext.canvas.height)
        this.setMouseEventsPalette()
        this.setMouseEvents()
        this.PaletteInit()
        this.renderPalette(this.color)
    }

    getHue(event){
        let pixel = this.hueContext.getImageData(
            15, 
            (event.clientY - this.hueElement.getBoundingClientRect().top),
            1,
            1
        )['data']
        let rgb = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`
        super.color = rgb
        super.renderPalette(this.color)
    }

    setMouseEvents(){
        this.hueElement.addEventListener("touchstart", event => this.startColor(event))
        this.hueElement.addEventListener("touchmove", event => this.getColor(event))
        this.hueElement.addEventListener("mousedown", event => this.startColor(event))
        this.hueElement.addEventListener("mousemove", event => this.getColor(event))
        this.hueElement.addEventListener("touchend", event => this.stopColor(event))
        this.hueElement.addEventListener("mouseup", event => this.stopColor(event))
        this.hueElement.addEventListener("mouseout", event => this.stopColor(event))
    }

    startColor(event){
        if(!this.colorSelecting){
            this.colorSelecting = true
            this.getColor(event)
        }
    }

    getColor(event){
        if(this.colorSelecting){
            this.getHue(event)
        }
    }

    stopColor(event){
        if (this.colorSelecting) {
            this.colorSelecting = false
        }
    }
}

class ProxyModule{
    constructor(){
        this.webSocket = window.sockets
    }

    componentToHex(c) {
        let hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
      
    rgbToHex(r, g, b) {
        return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
    }

    getPixel(x, y, canvasContext){
        let pixel = canvasContext.getImageData(
            x,
            y,
            1,
            1
        )['data']

        return this.rgbToHex(pixel[0], pixel[1], pixel[2])
    }

    strokeCombine(options){
        return `42[2,7,{"t":${CURRENT_ROUND}, "d": ${options.press}, "v":[1,${options.pressNumber},["${options.color}",${options.width/2},${options.transparency}],${options.posArray}]}]`
    }

    async sendCanvas(canvasList) {
        if (SETTINGS.GLOBAL_LAYERS.state) {
            for (const layer of canvasList) {
                let counter = 0
                for (const options of layer) {
                    this.exportButton.textContent = Math.round(counter/(layer.length) * 100)
                    counter++
                    if (counter % 15 == 0) {
                        await this.delay(1500);
                        this.webSocket[window.sockets.length - 1].send(this.strokeCombine(options)); 
                    }else{
                        this.webSocket[window.sockets.length - 1].send(this.strokeCombine(options)); 
                    }
                }
            }
            this.finishRound();
        }
        else{
            this.finishRound()
        }
    }

    sendStroke(stroke){
        this.webSocket[window.sockets.length - 1].send(this.strokeCombine(stroke));
    }
    
    undo(options){
        this.webSocket[window.sockets.length - 1].send(`42[2, 7, {"t": ${CURRENT_ROUND}, "d": 2, "v": ${options.strokeAmount}}]`)
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    finishRound(){
        this.webSocket[window.sockets.length - 1].send("42[2,15,true]")
    }
}

class ModificationModule {
    constructor(bindsContainer) {
        this.bindsContainer = bindsContainer;
        this.keysPressed = {};
        this.currentTool = TOOLS.BRUSH;
        this.keypress = this.keypress.bind(this)
        this.keyup = this.keyup.bind(this)
    }

    init() {
        this.addEventListeners()
    }

    addEventListeners() {
        document.onkeydown = this.keypress
        document.onkeyup = this.keyup
    }

    keypress(event){
        this.keysPressed[event.code] = true;
        GLOBAL_KEYS = this.keysPressed;
        this.undoHandler(event);
        this.handleKeydown(event);
    }

    keyup(event){
        delete this.keysPressed[event.code];
        GLOBAL_KEYS = this.keysPressed;
    }

    handleKeydown(event) {
        if (event.repeat) return;

        switch (event.code) {
            case this.bindsContainer.BRUSH_KEY:
                this.drawingModule.drawColor = this.drawingModule.foregroundColor;
                this.drawingModule.currentTool = TOOLS.BRUSH;
                CLASS_INSTANCES[5].setTool(TOOLS.BRUSH);
                break;

            case this.bindsContainer.ERASER_KEY:
                this.drawingModule.currentTool = TOOLS.ERASER;
                CLASS_INSTANCES[5].setTool(TOOLS.ERASER);
                break;

            case this.bindsContainer.CHANGE_KEY:
                this.swapColors();
                break;

            case this.bindsContainer.COLOR_PICKER_KEY:
                this.drawingModule.drawColor = this.drawingModule.getColor()
                this.drawingModule.foregroundColor = this.drawingModule.getColor()
                document.querySelectorAll(".PMFast__color")[0].style.backgroundColor = this.drawingModule.foregroundColor
                CLASS_INSTANCES[3].refreshPalette()
                event.preventDefault();
                break

            case this.bindsContainer.MIRROR_KEY:
                this.drawingModule.mirrorCanvas()
                break

            default:
                return; // Если клавиша не соответствует ни одному из случаев, выходим из функции
        }

        //event.preventDefault();
        event.stopImmediatePropagation();
    }

    swapColors() {
        const { drawingModule } = this;
        const [foregroundColor, backgroundColor] = [drawingModule.foregroundColor, drawingModule.backgroundColor];

        console.log("swap color", this);

        drawingModule.foregroundColor = backgroundColor;
        drawingModule.backgroundColor = foregroundColor;
        drawingModule.drawColor = drawingModule.foregroundColor;

        const colorElements = document.querySelectorAll(".PMFast__color");
        if (colorElements.length >= 2) {
            const [firstColor, secondColor] = [colorElements[0].style.backgroundColor, colorElements[1].style.backgroundColor];
            colorElements[0].style.backgroundColor = secondColor;
            colorElements[1].style.backgroundColor = firstColor;
        }
    }

    undoHandler(event) {
        if (this.drawingModule.isDrawing == false && this.drawingModule.isScaling == false) {
            if (SETTINGS.GLOBAL_LAYERS.state) {
                if (this.keysPressed["ControlLeft"] && event.code === 'KeyZ') {
                    const { drawingModule } = this;
                    const { strokeAmount, canvasList} = drawingModule;
                    console.log("undo", this);
                    if (strokeAmount > 0) {
                        canvasList[0].pop();
                        canvasList[0].pop();
                        drawingModule.strokeAmount--;
        
                        this.drawingModule.refresh(canvasList[0]);
        
                        event.preventDefault();
                        event.stopImmediatePropagation();
                    }
                }
            }else{
                if (this.keysPressed["ControlLeft"] && event.code === 'KeyZ') {
                    const { drawingModule } = this;
                    const { strokeAmount, canvasList} = drawingModule;
                    console.log("undo", this);
                    if (drawingModule.undoAmount > 0) {
                        canvasList[0].pop();
                        canvasList[0].pop();
                        drawingModule.undoAmount--
                        this.drawingModule.refresh(canvasList[0]);
                        drawingModule.undoHandler()
                        event.preventDefault();
                        event.stopImmediatePropagation();
                    }
                }
            }
        }
    }
}

class BrushModule{
    constructor(brushSettingsElement){
        this.brushSettingsElement = brushSettingsElement
    }

    init(){
        this.setEvents()
    }

    setEvents(){
        this.brushSettingsElement.querySelector("#brushRadiusValue").addEventListener("input", event => this.brushSizeModifier(event))
        this.brushSettingsElement.querySelector("#brushRadiusInput").addEventListener("change", event => this.brushSizeModifier(event))
        this.brushSettingsElement.querySelector("#brushTransparencyValue").addEventListener("input", event => this.brushTransparencyModifier(event))
        this.brushSettingsElement.querySelector("#brushTransparencyInput").addEventListener("change", event => this.brushTransparencyModifier(event))
    }

    brushSizeModifier(event){
        this.drawingModule.drawWidth = event.srcElement.value.toString()
        this.drawingModule.setDrawStyle()
        let value = event.srcElement.value
        this.brushSettingsElement.querySelector("#brushRadiusValue").value = value
        this.brushSettingsElement.querySelector("#brushRadiusInput").value = value + " пикс."
    }

    brushTransparencyModifier(event){
        this.drawingModule.drawTransparency = (event.srcElement.value/100).toString()
        this.drawingModule.setDrawStyle()
        let value = event.srcElement.value
        this.brushSettingsElement.querySelector("#brushTransparencyValue").value = value
        this.brushSettingsElement.querySelector("#brushTransparencyInput").value = value + "%"
    }
}

// Подгрузка модулей
const MODULES_ONLOAD = [
    {
        name : HudModule,
        key : "hudModule",
        constructor : [".screen"],
        stateRequired : DEFAULT_GAME_STATE.DRAWING
    },
    {
        name : DrawingModule,
        key : "drawingModule",
        constructor : [".drawingContainer", CANVAS_SIZE.width, CANVAS_SIZE.height],
        stateRequired : DEFAULT_GAME_STATE.DRAWING
    }
]

function modificationInit(MODULES_ONLOAD) {
    emptyObject(CLASS_INSTANCES)
    for (const classModule of MODULES_ONLOAD) {
        if (classModule.stateRequired == CURRENT_GAME_STATE) {
            console.log(CURRENT_GAME_STATE);
            
            let instance
            instance = new classModule.name(...classModule.constructor)
            CLASS_INSTANCES.classModule.key = instance
        }
    }
}