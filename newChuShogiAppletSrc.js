var timer = setTimeout("Init();", 100);
var scriptURL = document.currentScript.src;

function Init() {
    clearTimeout(timer);
    chuEmbeds = document.getElementsByClassName("chuShogiApplet");
    chuApplets = [];

    for (let i = 0; i < chuEmbeds.length; i++) {
        chuApplets.push(new ChuShogiApplet(i, chuEmbeds[i]));
    }
}

class ChuShogiApplet {
    static #localImages = true;
    static #images = ['', 'p', 'i', 'c', 's', 'g', 'f', 't', 'e', 'x', 'o', 'l', 'a', 'm', 'v', 'b', 'r', 'h', 'd', 'q', 'n', 'k', 'p2', 'i2', 'c2', 's2', 'g2', 'f2', 't2', 'e2', 'x2', 'o2', 'l2', 'a2', 'm2', 'v2', 'b2', 'r2', 'h2', 'd2'];
    static #imageDir = (ChuShogiApplet.#localImages ? (scriptURL.substring(0, (scriptURL.lastIndexOf('/'))) + '/images/') : 'https://www.chessvariants.com/graphics.dir/svg/DeWittChuShogi/');
    static #blackPrefix = 'b';
    static #whitePrefix = 'w';
    static #flipPrefix = '1';
    static #imgSuffix = '.svg?nocache=true';

    static #cellSizeMin = 35;
    static #cellSizeMax = 100;
    static #rimSizeMin = 15;
    static #imageSetMin = 0;
    static #imageSetMax = 5;
    static #playbackSpeedMin = 0.1;
    static #playbackSpeedMax = 100;

    static #decodeHtmlEntities(htmlString) {
        var element = document.createElement('div'); // Create a temporary element
        element.innerHTML = htmlString; // Set the innerHTML to the encoded string
        return element.textContent; // Get the decoded text
    }


    // Vital Variables
    #id;
    #embedTarget;
    #settingsString;
    #board;
    #recapping = false;
    #recapTimer;

    // Settings
    // Board Settings
    #imageSet = 0;
    #flip = false;
    #startSFEN = '';
    #startGame = '';
    #showGraphicsOptions = true;
    #goToStartAfterLoading = false;
    #moveOnCurrentPositionOnly = false;
    #viewOnly = false;
    #playbackSpeed = 1;

    // Rule Enforcement
    #enforceRules = true;
    #allowPositionSetup = false;

    // Rule Variations
    #renmeiBridgeCaptureRule = false;
    #okazakiRule = false;
    #trappedLancesMayPromote = false;
    #forbidAllRepeats = false;

    // Board Display Settings
    #cellSize = 40;
    #cellColor = '#f3e2ab';
    #cellBorder = 'thin solid black';
    #rimSize = 20;
    #rimColor = '#c7885d';
    #rimTextColor = 'black';
    #rimTextSizeRatio = 0.7;
    #showLastMove = true;
    #showLegalMoveHighlights = true;
    #showInfluenceHighlights = false;
    #showHighlightButtons = true;
    #showSetupBoxAfterLoading = true;
    #showDashboardOption = true;

    // Highlights
    #selectionHighlightColor = '#8080ff';
    #midpointHighlightColor = '#ff8080';
    #lastMoveHighlightColor = '#80ff80';
    #jumpOptionHighlightColor = '#ffc000';
    #slideOptionHighlightColor = '#ffff00';
    #midpointOptionHighlightColor = '#00ffff';
    #highlightBorderColor = 'black';
    #blackInfluenceHighlightColor = '#606070';
    #whiteInfluenceHighlightColor = '#efefff';
    #conflictingInfluenceHighlightColor = '#bfbfcf';
    #arrowColor0 = '#00b700';
    #arrowColor1 = '#c60000';
    #arrowColor2 = '#0000ff';
    #arrowColor3 = '#ffa500';

    // Styling Variables
    #buttonColor = 'whitesmoke';
    #buttonHoverColor = '#e0e0e0';
    #buttonActiveColor = 'silver';
    #buttonTextColor = 'black';
    #buttonBorder = 'thin solid black';
    #dropDownMenuColor = 'whitesmoke';
    #dropDownMenuTextColor = 'black';
    #dropDownMenuBorder = 'thin solid black';
    #textFieldColor = 'none';
    #textFieldTextColor = 'none';
    #textFieldPlaceholderColor = 'none';
    #textFieldBorder = 'thin solid';
    #gameLogColor = 'white';
    #gameLogTextColor = 'black';
    #gameLogBorder = 'thin solid black';

    // Interaction variables
    #arrowX = -1;
    #arrowY = -1;

    // Constructor
    constructor(id, embedTarget) {
        this.#id = id;
        this.#embedTarget = embedTarget;
        this.#settingsString = this.#embedTarget.innerHTML;
        this.#parseSettings();
        this.#createInternalBoard();
        this.#embedHTML();
        this.updateDisplays();
        if (this.#goToStartAfterLoading) {
            this.goToMove(0);
        }
        this.updateDisplays();
    }

    #parseSettings() {
        let parts = this.#settingsString.split("\n");
        for (let i = 0; i < parts.length; ++i) {
            let line = parts[i].trim().replace(/\s+/g, " ");
            if (line === '' || line.startsWith('//')) continue;

            let keyValue = line.split("=");
            if (keyValue.length !== 2) continue;

            let key = keyValue[0].trim();
            let value = keyValue[1].trim();

            if (key === '' || value === '') continue;
            // Board Settings
            if (key === 'imageSet') this.#imageSet = parseInt(value);
            else if (key === 'flip') this.#flip = (value === 'true');
            else if (key === 'startSFEN') this.#startSFEN = value;
            else if (key === 'startGame') this.#startGame = value;
            else if (key === 'showGraphicsOptions') this.#showGraphicsOptions = (value === 'true');
            else if (key === 'goToStartAfterLoading') this.#goToStartAfterLoading = (value === 'true');
            else if (key === 'moveOnCurrentPositionOnly') this.#moveOnCurrentPositionOnly = (value === 'true');
            else if (key === 'viewOnly') this.#viewOnly = (value === 'true');
            else if (key === 'playbackSpeed') this.#playbackSpeed = parseFloat(value);
            // Rule Enforcement
            else if (key === 'enforceRules') this.#enforceRules = (value === 'true');
            else if (key === 'allowPositionSetup') this.#allowPositionSetup = (value === 'true');
            // Rule Variations
            else if (key === 'renmeiBridgeCaptureRule') this.#renmeiBridgeCaptureRule = (value === 'true');
            else if (key === 'okazakiRule') this.#okazakiRule = (value === 'true');
            else if (key === 'trappedLancesMayPromote') this.#trappedLancesMayPromote = (value === 'true');
            else if (key === 'forbidAllRepeats') this.#forbidAllRepeats = (value === 'true');
            // Board Display Settings
            else if (key === 'cellSize') this.#cellSize = parseInt(value);
            else if (key === 'cellColor') this.#cellColor = value;
            else if (key === 'cellBorder') this.#cellBorder = value;
            else if (key === 'rimSize') this.#rimSize = parseInt(value);
            else if (key === 'rimColor') this.#rimColor = value;
            else if (key === 'rimTextColor') this.#rimTextColor = value;
            else if (key === 'rimTextSizeRatio') this.#rimTextSizeRatio = parseFloat(value);
            else if (key === 'showLastMove') this.#showLastMove = (value === 'true');
            else if (key === 'showLegalMoveHighlights') this.#showLegalMoveHighlights = (value === 'true');
            else if (key === 'showInfluenceHighlights') this.#showInfluenceHighlights = (value === 'true');
            else if (key === 'showHighlightButtons') this.#showHighlightButtons = (value === 'true');
            else if (key === 'showSetupBoxAfterLoading') this.#showSetupBoxAfterLoading = (value === 'true');
            else if (key === 'showDashboardOption') this.#showDashboardOption = (value === 'true');
            // Highlights
            else if (key === 'selectionHighlightColor') this.#selectionHighlightColor = value;
            else if (key === 'midpointHighlightColor') this.#midpointHighlightColor = value;
            else if (key === 'lastMoveHighlightColor') this.#lastMoveHighlightColor = value;
            else if (key === 'jumpOptionHighlightColor') this.#jumpOptionHighlightColor = value;
            else if (key === 'slideOptionHighlightColor') this.#slideOptionHighlightColor = value;
            else if (key === 'midpointOptionHighlightColor') this.#midpointOptionHighlightColor = value;
            else if (key === 'highlightBorderColor') this.#highlightBorderColor = value;
            else if (key === 'blackInfluenceHighlightColor') this.#blackInfluenceHighlightColor = value;
            else if (key === 'whiteInfluenceHighlightColor') this.#whiteInfluenceHighlightColor = value;
            else if (key === 'conflictingInfluenceHighlightColor') this.#conflictingInfluenceHighlightColor = value;
            // Styling Variables
            else if (key === 'buttonColor') this.#buttonColor = value;
            else if (key === 'buttonHoverColor') this.#buttonHoverColor = value;
            else if (key === 'buttonActiveColor') this.#buttonActiveColor = value;
            else if (key === 'buttonTextColor') this.#buttonTextColor = value;
            else if (key === 'buttonBorder') this.#buttonBorder = value;
            else if (key === 'dropDownMenuColor') this.#dropDownMenuColor = value;
            else if (key === 'dropDownMenuTextColor') this.#dropDownMenuTextColor = value;
            else if (key === 'dropDownMenuBorder') this.#dropDownMenuBorder = value;
            else if (key === 'textFieldColor') this.#textFieldColor = value;
            else if (key === 'textFieldTextColor') this.#textFieldTextColor = value;
            else if (key === 'textFieldPlaceholderColor') this.#textFieldPlaceholderColor = value;
            else if (key === 'textFieldBorder') this.#textFieldBorder = value;
            else if (key === 'gameLogColor') this.#gameLogColor = value;
            else if (key === 'gameLogTextColor') this.#gameLogTextColor = value;
            else if (key === 'gameLogBorder') this.#gameLogBorder = value;
            // Invalid Key
            else continue;
        }
        this.#setSizeBoundaries();
    }

    #setSizeBoundaries() {
        // Board Cell Size
        if (this.#cellSize < ChuShogiApplet.#cellSizeMin) this.#cellSize = ChuShogiApplet.#cellSizeMin;
        if (this.#cellSize > ChuShogiApplet.#cellSizeMax) this.#cellSize = ChuShogiApplet.#cellSizeMax;

        // Board Rim Size
        if (this.#rimSize < ChuShogiApplet.#rimSizeMin) this.#rimSize = ChuShogiApplet.#rimSizeMin;
        if (this.#rimSize > this.#cellSize) this.#rimSize = this.#cellSize;

        // Board Rim Text Size Ratio
        if (this.#rimTextSizeRatio < ((ChuShogiApplet.#rimSizeMin * 0.8) / this.#rimSize)) this.#rimTextSizeRatio = ((ChuShogiApplet.#rimSizeMin * 0.8) / this.#rimSize);
        if (this.#rimTextSizeRatio > (5 / 6)) this.#rimTextSizeRatio = (5 / 6);

        this.#setImageSetBoundaries();
        this.#setPlaybackSpeedBoundaries();
    }

    #setImageSetBoundaries() {
        if (this.#imageSet < ChuShogiApplet.#imageSetMin) this.#imageSet = ChuShogiApplet.#imageSetMin;
        if (this.#imageSet > ChuShogiApplet.#imageSetMax) this.#imageSet = ChuShogiApplet.#imageSetMax;
    }

    #setPlaybackSpeedBoundaries() {
        if (this.#playbackSpeed < ChuShogiApplet.#playbackSpeedMin) this.#playbackSpeed = ChuShogiApplet.#playbackSpeedMin;
        if (this.#playbackSpeed > ChuShogiApplet.#playbackSpeedMax) this.#playbackSpeed = ChuShogiApplet.#playbackSpeedMax;
    }

    #getCSS() {
        let cssTab = '<style>';
        // Board Container
        cssTab += '#chuShogiApplet' + this.#id + ' { float:none;clear:both; }\n';
        cssTab += '#chuShogiApplet' + this.#id + ' .chuShogiBoard { float:left;margin:0 10px 10px 0; }\n';
        cssTab += '#chuShogiApplet' + this.#id + ' #chuShogiHand' + this.#id + ' { text-align:center;height:' + (4 * this.#cellSize) + 'px;overflow-y:scroll; }\n';
        cssTab += '#chuShogiApplet' + this.#id + ' .chuShogiGameLog { float:left;clear:right;margin:0 0 10px 0; }\n';
        // Board and Hand
        cssTab += '#chuShogiApplet' + this.#id + ' .chuBoard,.chuHand { border-collapse: collapse;user-select: none;table-layout: fixed; }\n';
        cssTab += '#chuShogiApplet' + this.#id + ' .rowSpanningRimCell { text-align:center;vertical-align:middle;background-color:' + this.#rimColor + '; }\n';
        cssTab += '#chuShogiApplet' + this.#id + ' .setupBoxHeaderCell { height:' + this.#cellSize + 'px;background-color:' + this.#rimColor + ';border:' + this.#cellBorder + '; }\n';
        cssTab += '#chuShogiApplet' + this.#id + ' .rimCorner { min-width:' + this.#rimSize + 'px;max-width:' + this.#rimSize + 'px;width:' + this.#rimSize + 'px;min-height:' + this.#rimSize + 'px;max-height:' + this.#rimSize + 'px;height:' + this.#rimSize + 'px;border:none;background-color:' + this.#rimColor + ';color:' + this.#rimColor + ';font-size:' + (this.#rimSize * this.#rimTextSizeRatio) + 'px;vertical-align:top; }\n';
        cssTab += '#chuShogiApplet' + this.#id + ' .rimColCell { min-width:' + this.#cellSize + 'px;max-width:' + this.#cellSize + 'px;width:' + this.#cellSize + 'px;min-height:' + this.#rimSize + 'px;max-height:' + this.#rimSize + 'px;height:' + this.#rimSize + 'px;border:none;background-color:' + this.#rimColor + ';color:' + this.#rimTextColor + ';font-size:' + (this.#rimSize * this.#rimTextSizeRatio) + 'px;font-family: Helvetica, Arial, Verdana, sans-serif;vertical-align:middle;align:middle;text-align:center; }\n';
        cssTab += '#chuShogiApplet' + this.#id + ' .rimRowCell { min-width:' + this.#rimSize + 'px;max-width:' + this.#rimSize + 'px;width:' + this.#rimSize + 'px;min-height:' + this.#cellSize + 'px;max-height:' + this.#cellSize + 'px;height:' + this.#cellSize + 'px;border:none;background-color:' + this.#rimColor + ';color:' + this.#rimTextColor + ';font-size:' + (this.#rimSize * this.#rimTextSizeRatio) + 'px;font-family: Helvetica, Arial, Verdana, sans-serif;vertical-align:middle;align:middle;text-align:center; }\n';
        cssTab += '#chuShogiApplet' + this.#id + ' .boardCell,.handCell { min-width:' + this.#cellSize + 'px;width:' + this.#cellSize + 'px;max-width:' + this.#cellSize + 'px;min-height:' + this.#cellSize + 'px;height:' + this.#cellSize + 'px;max-height:' + this.#cellSize + 'px;border:' + this.#cellBorder + ';background-color:' + this.#cellColor + ';background-repeat:no-repeat;background-position:center center;background-size:contain;vertical-align:middle;align:middle;text-align:center;font-size:' + (this.#cellSize * 0.6) + 'px; }\n';
        // Cell Canvases
        cssTab += '#chuShogiApplet' + this.#id + ' .boardCellCanvas { margin:0px 0px 0px 0px;padding:0px 0px 0px 0px;display:block;pointer-events:none; }\n';
        // Game Log
        cssTab += '#chuShogiApplet' + this.#id + ' .gameLogTopButtons' + this.#id + ', .recapPanel' + this.#id + ' { width:420px;border:' + this.#gameLogBorder + ';padding: 5px 0px 5px 0px;background-color:' + this.#gameLogColor + ';vertical-align:middle;align:middle;text-align:center; }\n';
        cssTab += '#chuShogiApplet' + this.#id + ' .chuGameLog { width:420px;height:400px;border:' + this.#gameLogBorder + ';padding:0px 0px 0px 0px;overflow-y:scroll;background-color:' + this.#gameLogColor + ';color:' + this.#gameLogTextColor + ';vertical-align:top; }\n';
        cssTab += '#chuShogiApplet' + this.#id + ' .gameLogTopButtons' + this.#id + ' hr,.chuGameLog hr { border:thin solid;border-color:' + this.#gameLogTextColor + ' }\n';
        // Additional CSS Styling
        cssTab += '#chuShogiApplet' + this.#id + ' .u { text-decoration:underline; }\n';
        cssTab += '#chuShogiApplet' + this.#id + ' .wordWrapBreakWord { word-wrap:break-word; }\n';
        cssTab += '#chuShogiApplet' + this.#id + ' input[type="button"] { background-color:' + this.#buttonColor + ';color:' + this.#buttonTextColor + ';border:' + this.#buttonBorder + '; }\n';
        cssTab += '#chuShogiApplet' + this.#id + ' input[type="button"]:hover { background-color:' + this.#buttonHoverColor + '; }\n';
        cssTab += '#chuShogiApplet' + this.#id + ' input[type="button"]:active { background-color:' + this.#buttonActiveColor + '; }\n';
        cssTab += '#chuShogiApplet' + this.#id + ' input[type="button"]:disabled { background-color:' + this.#buttonActiveColor + ';border-color:' + this.#buttonActiveColor + '; }\n';
        cssTab += '#chuShogiApplet' + this.#id + ' #chuGameLogDropButton' + this.#id + ' { user-select:none;width:150px;text-align:center;background-color:' + this.#dropDownMenuColor + '; color:' + this.#dropDownMenuTextColor + ';border:' + this.#dropDownMenuBorder + '; }\n';
        cssTab += '#chuShogiApplet' + this.#id + ' #chuGameLogDropDown' + this.#id + ' { display:inline-block; }\n';
        cssTab += '#chuShogiApplet' + this.#id + ' #chuGameLogDropContent' + this.#id + ' { display:none;position:absolute;background-color:' + this.#dropDownMenuColor + ';border:' + this.#dropDownMenuBorder + ';box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);z-index: 1;width:150px;text-align:center }\n';
        cssTab += '#chuShogiApplet' + this.#id + ' #chuGameLogDropContent' + this.#id + ' p { user-select:none;display:block;padding: 0px 10px;text-decoration: none;color:' + this.#dropDownMenuTextColor + ' !important; }\n';
        cssTab += '#chuShogiApplet' + this.#id + ' #chuGameLogDropContent' + this.#id + ' p:hover { text-decoration:underline !important; }\n';
        cssTab += '#chuShogiApplet' + this.#id + ' #chuGameLogDropDown' + this.#id + ':hover #chuGameLogDropContent' + this.#id + ' { display:block; }\n';
        cssTab += '#chuShogiApplet' + this.#id + ' input[type="text"],textarea { background-color:' + this.#textFieldColor + ' !important; color:' + this.#textFieldTextColor + ' !important; border:' + this.#textFieldBorder + ' !important; }\n';
        cssTab += '#chuShogiApplet' + this.#id + ' input[type="number"] { background-color:' + this.#textFieldColor + ' !important; color:' + this.#textFieldTextColor + ' !important; border:' + this.#textFieldBorder + ' !important; }\n';
        cssTab += '#chuShogiApplet' + this.#id + ' .boardControlWithPlaceholder::placeholder { color:' + this.#textFieldPlaceholderColor + ' !important; }\n';
        cssTab += '</style>';
        return cssTab;
    }

    #createBoardDisplay() {
        let boardTab = this.#getCSS();
        boardTab += '<table class="chuBoard">';

        // Graphics Options
        if (this.#showGraphicsOptions) {
            boardTab += '<tr><td class="rowSpanningRimCell" colspan="14">' + this.#graphicsButtons() + '</td></tr>';
        }

        boardTab += '<tr><td class="rimCorner"></td>';
        for (let i = 0; i <= 11; ++i) {
            boardTab += '<td class="' + i + '|a' + '|' + this.#id + ' rimColCell"><b>' + (this.#flip ? this.#board.fileID(11 - i) : this.#board.fileID(i)) + '</b></td>';
        }
        boardTab += '<td class="rimCorner"></td></tr>';

        for (let i = 11; i >= 0; --i) {
            boardTab += '<tr>';
            boardTab += '<td class="a|' + i + '|' + this.#id + ' rimRowCell"><b>' + (this.#flip ? this.#board.rankID(11 - i) : this.#board.rankID(i)) + '</b></td>';
            for (let j = 0; j < 12; ++j) {
                boardTab += '<td id="' + j + '|' + i + '|' + this.#id + '" class="boardCell" onmousedown="chuApplets[' + this.#id + '].mouseDown(' + j + ',' + i + ', event);" onmouseup="chuApplets[' + this.#id + '].mouseUp(' + j + ',' + i + ', event);" ontouchstart="chuApplets[' + this.#id + '].touchDown(' + j + ',' + i + ', event)" ontouchend="chuApplets[' + this.#id + '].touchUp(' + j + ',' + i + ', event)" oncontextmenu="event.preventDefault();">' + this.#getCellCanvas(j, i) + '</td>';
            }
            boardTab += '<td class="a|' + i + '|' + this.#id + ' rimRowCell"><b>' + (this.#flip ? this.#board.rankID(11 - i) : this.#board.rankID(i)) + '</b></td>';
            boardTab += '</tr>';
        }

        boardTab += '<tr><td class="rimCorner"></td>';
        for (let i = 0; i <= 11; ++i) {
            boardTab += '<td class="' + i + '|a' + '|' + this.#id + ' rimColCell"><b>' + (this.#flip ? this.#board.fileID(11 - i) : this.#board.fileID(i)) + '</b></td>';
        }
        boardTab += '<td class="rimCorner"></td></tr>';
        boardTab += '<tr><td class="rowSpanningRimCell" colspan="14">' + this.#navigationPanel() + '</td></tr>';

        if (this.#allowPositionSetup && !this.#viewOnly) {
            boardTab += '<tr><td class="rowSpanningRimCell" colspan="14"></td></tr>';
            boardTab += '<tr><td class="rowSpanningRimCell" colspan="14">' + this.#setupBoxButton(); + '</td></tr>';
            boardTab += '<tr><td class="rowSpanningRimCell" colspan="14">' + this.#createHandDisplay() + '</td></tr>';
        }

        boardTab += '</table>';
        return boardTab;
    }

    #createHandDisplay() {
        let handTab = '<div id="chuShogiHand' + this.#id + '" style="display:' + (this.#showSetupBoxAfterLoading ? 'block' : 'none') + ';">';

        handTab += '<table class="chuHand" style="display: inline-table">';

        handTab += '<tr><th colspan="10" class="setupBoxHeaderCell"><input type="button" class="disabledDuringRecap' + this.#id + '" value="Clear Board" onclick="chuApplets[' + this.#id + '].clearBoard();">&nbsp;<input type="button" class="disabledDuringRecap' + this.#id + '" value="Set Start Position (b)" onclick="chuApplets[' + this.#id + '].setStartPosition(false);"><input type="button" class="disabledDuringRecap' + this.#id + '" value="Set Start Position (w)" onclick="chuApplets[' + this.#id + '].setStartPosition(true);"></th></tr>';

        handTab += this.#handRow(0);
        handTab += this.#handRow(5);
        handTab += this.#handRow(10);
        handTab += this.#handRow(15);
        handTab += this.#handRow(20);
        handTab += this.#handRow(25);
        handTab += this.#handRow(30);
        handTab += this.#handRow(35);

        handTab += '</tr>';

        handTab += '</table>';

        handTab += '</div>';
        return handTab;
    }

    #handRow(start) {
        let color = 0;

        let handRowTab = '<tr>';
        for (let i = start; i <= (start + 4); ++i) {
            handRowTab += this.#handCell(i, color);
        }

        color = 1;
        for (let i = start; i <= (start + 4); ++i) {
            handRowTab += this.#handCell(i, color);
        }
        handRowTab += '</tr>';
        return handRowTab;
    }

    #handCell(type, color) {
        return '<td id="' + (100 + type) + '|' + color + '|' + this.#id + '" class="handCell"onmousedown="chuApplets[' + this.#id + '].mouseDown(' + (100 + type) + ',' + (color ? 1 : 0) + ', event);" onmouseup="chuApplets[' + this.#id + '].mouseUp(' + (100 + type) + ',' + (color ? 1 : 0) + ', event);" ontouchstart="chuApplets[' + this.#id + '].touchDown(' + (100 + type) + ',' + (color ? 1 : 0) + ', event)" ontouchend="chuApplets[' + this.#id + '].touchUp(' + (100 + type) + ',' + (color ? 1 : 0) + ', event)" oncontextmenu="event.preventDefault();"></td>';
    }


    #graphicsButtons() {
        return '<input type="button" class="graphicsOption' + this.#id + '" value="Mnemonic" onclick="chuApplets[' + this.#id + '].setImageSet(0);">&nbsp;' +
            '<input type="button" class="graphicsOption' + this.#id + '" value="1 Kanji" onclick="chuApplets[' + this.#id + '].setImageSet(1);">&nbsp;' +
            '<input type="button" class="graphicsOption' + this.#id + '" value="2 Kanji" onclick="chuApplets[' + this.#id + '].setImageSet(2);">&nbsp;' +
            '<input type="button" class="graphicsOption' + this.#id + '" value="Alpha" onclick="chuApplets[' + this.#id + '].setImageSet(3);">&nbsp;' +
            '<input type="button" class="graphicsOption' + this.#id + '" value="Greenwade" onclick="chuApplets[' + this.#id + '].setImageSet(4);">&nbsp;' +
            '<input type="button" class="graphicsOption' + this.#id + '" value="Jocly" onclick="chuApplets[' + this.#id + '].setImageSet(5);">&nbsp;';
    }

    #navigationPanel() {
        return '<input type="button" value="Flip View" onclick="chuApplets[' + this.#id + '].flipView();">&nbsp;&nbsp;<input type="button" value=" |< " onclick="chuApplets[' + this.#id + '].goToMove(0);">&nbsp;<input type="button" value=" < " onclick="chuApplets[' + this.#id + '].goToMove(chuApplets[' + this.#id + '].getBoard().getDisplayedPosition() - 1);">&nbsp;<input type="button" value=">|<" onclick="chuApplets[' + this.#id + '].jumpToMove();">&nbsp;<input type="button" value=" > " onclick="chuApplets[' + this.#id + '].goToMove(chuApplets[' + this.#id + '].getBoard().getDisplayedPosition() + 1);">&nbsp;<input type="button" value=" >| " onclick="chuApplets[' + this.#id + '].goToMove(chuApplets[' + this.#id + '].getBoard().getGameLength());">&nbsp;' + this.#trimGameButton() + this.#newGameButton() + this.#resetButton();
    }

    #trimGameButton() {
        return (!this.#viewOnly ? '&nbsp;<input type="button" class="disabledDuringRecap' + this.#id + '" value="8<" onclick="chuApplets[' + this.#id + '].trimGame();">&nbsp;' : '');
    }

    #newGameButton() {
        return (((this.#showDashboardOption || this.#startGameHasMoves()) && !this.#viewOnly) ? '&nbsp;<input type="button" class="disabledDuringRecap' + this.#id + '" value="New Game" onclick="chuApplets[' + this.#id + '].newGame();">' : '');
    }

    #startGameHasMoves() {
        return Board.getAllowedMoveFormats().test(this.#startGame.split(' ')[0]);
    }

    #resetButton() {
        return '&nbsp;<input type="button" class="disabledDuringRecap' + this.#id + '" value="Reset" onclick="chuApplets[' + this.#id + '].reset();">';
    }

    #topButtons() {
        let tab = '<input type="button" value="Refresh" onclick="chuApplets[' + this.#id + '].updateDisplays();">&nbsp;';
        if (this.#showHighlightButtons) {
            tab += '<input type="button" style="min-width:115px;" value="' + (this.#showInfluenceHighlights ? ' Hide Influence ' : 'Show Influence') + '" onclick="chuApplets[' + this.#id + '].toggleInfluenceHighlights(); this.value = (chuApplets[' + this.#id + '].isShowingInfluenceHighlights() ? \' Hide Influence \' : \'Show Influence\')" />';
            tab += '<input type="button" style="min-width:115px;" value="' + (this.#showLastMove ? ' Hide Last Move ' : 'Show Last Move') + '" onclick="chuApplets[' + this.#id + '].toggleLastMove(); this.value = (chuApplets[' + this.#id + '].isShowingLastMove() ? \' Hide Last Move \' : \'Show Last Move\')" />';
        }

        return tab;
    }

    #recapPanel() {
        return '<input type="button" id="recapBackward' + this.#id + '" class="disabledDuringRecap' + this.#id + '" value="<|<|" onclick="chuApplets[' + this.#id + '].recapGame(true);">&nbsp;<input type="button" id="recapStop' + this.#id + '" value="[O]" onclick="chuApplets[' + this.#id + '].stopPlayback();" disabled>&nbsp;<input type="button" id="recapForward' + this.#id + '" class="disabledDuringRecap' + this.#id + '" value="|>|>" onclick="chuApplets[' + this.#id + '].recapGame(false);">&nbsp;&nbsp;<input type="button" value="Set Recap Speed (Hz)" onclick="chuApplets[' + this.#id + '].setRecapSpeed();" /><input id="playbackSpeedSetter' + this.#id + '" class="boardControlWithPlaceholder" type="number" style="width:60px;" placeholder="' + this.#playbackSpeed + '" />';
    }

    #setupBoxButton() {
        return '<input type="button" style="min-width:115px;" value="' + (this.isShowingSetupBox() ? ' Hide Setup Box ' : 'Show Setup Box') + '" onclick="chuApplets[' + this.#id + '].toggleSetupBpx(); this.value = (chuApplets[' + this.#id + '].isShowingSetupBox() ? \' Hide Setup Box \' : \'Show Setup Box\')" />';
    }

    #dropDownMenu() {
        let dropDownTab = '<div id="chuGameLogDropDown' + this.#id + '"><div id="chuGameLogDropButton' + this.#id + '">Game Log &#9660;</div><div id="chuGameLogDropContent' + this.#id + '">';
        dropDownTab += '<p onclick="chuApplets[' + this.#id + '].openGameLogWindow(0);document.getElementById(\'chuGameLogDropButton' + this.#id + '\').innerHTML = \'Game Log &#9660;\'">Game Log</p>';
        if ((this.#showDashboardOption || this.#allowPositionSetup) && !this.#viewOnly) {
            dropDownTab += '<p onclick="chuApplets[' + this.#id + '].openGameLogWindow(1);document.getElementById(\'chuGameLogDropButton' + this.#id + '\').innerHTML = \'Dashboard &#9660;\'">Dashboard</p>';
        }
        dropDownTab += '<p onclick="chuApplets[' + this.#id + '].openGameLogWindow(2);document.getElementById(\'chuGameLogDropButton' + this.#id + '\').innerHTML = \'Rules &#9660;\'">Rules</p>';
        dropDownTab += '<p onclick="chuApplets[' + this.#id + '].openGameLogWindow(3);document.getElementById(\'chuGameLogDropButton' + this.#id + '\').innerHTML = \'Help &#9660;\'">Help</p>';
        dropDownTab += '<p onclick="chuApplets[' + this.#id + '].openGameLogWindow(4);document.getElementById(\'chuGameLogDropButton' + this.#id + '\').innerHTML = \'Advanced Help &#9660;\'">Advanced Help</p>';
        dropDownTab += '</div></div>';
        return dropDownTab;
    }

    #moveField() {
        return (!this.#viewOnly ? '&nbsp;<input type="text" id="textMoveInput' + this.#id + '" class="boardControlWithPlaceholder" style="width:110px;" placeholder="Type in move here"><input type="button" id="textMoveInputButton' + this.#id + '" class="disabledDuringRecap' + this.#id + '" value="Input Move" onclick="chuApplets[' + this.#id + '].inputMoveFromText();">' : '');
    }

    openGameLogWindow(n) {
        let gameLogWindows = document.getElementsByClassName('chuGameLogDisplayOption' + this.#id);
        if (n < 0 || n >= gameLogWindows.length) return;
        for (let i = 0; i < gameLogWindows.length; ++i) {
            gameLogWindows[i].style.display = 'none';
        }
        gameLogWindows[n].style.display = 'block';
    }

    #gameLogWindow() {
        return '<div id="displayedPosition' + this.#id + '"></div><hr><div id="fenCode' + this.#id + '"></div><hr><div id="gameRecord' + this.#id + '"></div>';
    }

    #dashboardWindow() {
        if ((!this.#showDashboardOption && !this.#allowPositionSetup) || this.#viewOnly) return '<p>Dashboard is not available.</p>';

        let dbTab = '';
        if ((this.#allowPositionSetup) && !this.#viewOnly) {
            dbTab += '<p>';
            dbTab += '<input type="button" class="disabledDuringRecap" value="Input SFEN" onclick="chuApplets[' + this.#id + '].inputSFEN();" />&nbsp;';
            dbTab += '<textarea style="resize:none;" id="newSFEN' + this.#id + '" rows="4" cols="49" class="boardControlWithPlaceholder" placeholder="Paste SFEN here\n' + this.#board.getSFEN() + '"></textarea>';
            dbTab += '</p>';
        }

        dbTab += '<p>';
        dbTab += '<input type="button" class="disabledDuringRecap" value="Input Game" onclick="chuApplets[' + this.#id + '].inputGame();" />&nbsp;';
        dbTab += '<input type="button" class="disabledDuringRecap" value="Append to Game" onclick="chuApplets[' + this.#id + '].appendGame();" />&nbsp;';
        dbTab += '<input type="button" value="Append to Current Position" class="disabledDuringRecap" onclick="chuApplets[' + this.#id + '].trimGame();chuApplets[' + this.#id + '].appendGame();" /><br>';
        dbTab += '<textarea style="resize:none;" id="newGame' + this.#id + '" rows="7" cols="49" class="boardControlWithPlaceholder" placeholder="Paste Game here\n' + this.#board.getGame() + '"></textarea>';
        dbTab += '</p>';
        return dbTab;
    }

    inputSFEN() {
        let sfenInput = document.getElementById('newSFEN' + this.#id).value;
        if (sfenInput.trim() === '') return;
        this.#board.setSFEN(sfenInput);
        this.#updateDashoardDisplays();
        this.updateDisplays();
    }

    inputGame() {
        let gameInput = document.getElementById('newGame' + this.#id).value;
        if (gameInput.trim() === '') return;
        this.#board.setGame(gameInput);
        this.#updateDashoardDisplays();
        this.updateDisplays();
    }

    appendGame() {
        let gameInput = document.getElementById('newGame' + this.#id).value;
        if (gameInput.trim() === '') return;
        this.#board.setGame(this.#board.getGame() + ' ' + gameInput);
        document.getElementById('newGame' + this.#id).value = '';
        document.getElementById('newGame' + this.#id).placeholder = 'Paste Game here\n' + this.#board.getGame();
        this.updateDisplays();
    }

    #createGameLog() {
        let gameLogTab = '<div class="gameLogTopButtons' + this.#id + '">' + this.#topButtons() + '</div>';
        gameLogTab += '<div class="recapPanel' + this.#id + '">' + this.#recapPanel() + '</div>';
        gameLogTab += '<div class="recapPanel' + this.#id + '">' + this.#dropDownMenu() + this.#moveField() + '</div>';
        gameLogTab += '<div class="chuGameLog wordWrapBreakWord">';
        gameLogTab += '<div id="gameInfo' + this.#id + '" class="chuGameLogDisplayOption' + this.#id + '" style="display:block">' + this.#gameLogWindow() + '</div>';
        gameLogTab += '<div id="dashboard' + this.#id + '" class="chuGameLogDisplayOption' + this.#id + '" style="display:none">' + this.#dashboardWindow() + '</div>';
        gameLogTab += '<div id="rules' + this.#id + '" class="chuGameLogDisplayOption' + this.#id + '" style="display:none"><p>INSERT RULES HERE</p></div>';
        gameLogTab += '<div id="rules' + this.#id + '" class="chuGameLogDisplayOption' + this.#id + '" style="display:none"><p>INSERT HELP HERE</p></div>';
        gameLogTab += '<div id="rules' + this.#id + '" class="chuGameLogDisplayOption' + this.#id + '" style="display:none"><p>INSERT ADVANCED HELP HERE</p></div>';
        gameLogTab += '</div>';
        return gameLogTab;
    }

    #getHTML() {
        return '<div id="chuShogiApplet' + this.#id + '"><div class="chuShogiBoard">' + this.#createBoardDisplay() + '</div><div class="chuShogiGameLog">' + this.#createGameLog() + '</div></div>';
    }

    #getCellCanvas(x, y) {
        return '<canvas id="' + x + '|' + y + '|' + this.#id + 'c" class="boardCellCanvas" width="' + this.#cellSize + '"  height="' + this.#cellSize + '"></canvas>';
    }

    #embedHTML() {
        this.#embedTarget.innerHTML = this.#getHTML();
        if (this.#showGraphicsOptions) {
            this.setImageSet(this.#imageSet);
        }
    }

    #createInternalBoard() {
        this.#board = new Board(this.#startSFEN, this.#startGame, this.#enforceRules, this.#allowPositionSetup, this.#renmeiBridgeCaptureRule, this.#okazakiRule, this.#trappedLancesMayPromote, this.#forbidAllRepeats);
    }

    getBoard() {
        return this.#board;
    }

    // Display Methods
    setImageSet(value) {
        this.#imageSet = value;
        let graphicsButtons = document.getElementsByClassName('graphicsOption' + this.#id);
        for (let i = 0; i < graphicsButtons.length; i++) {
            graphicsButtons[i].disabled = false;
        }
        graphicsButtons[value].disabled = true;
        this.updateDisplays();
    }

    flipView() {
        this.#flip = !this.#flip;
        this.updateDisplays();
    }

    toggleInfluenceHighlights() {
        this.#showInfluenceHighlights = !this.#showInfluenceHighlights;
        this.updateDisplays();
    }


    toggleLastMove() {
        this.#showLastMove = !this.#showLastMove;
        this.updateDisplays();
    }

    toggleSetupBpx() {
        let setupBox = document.getElementById('chuShogiHand' + this.#id);
        if (setupBox.style.display === 'none' || setupBox.style.display === '') {
            setupBox.style.display = 'block';
        } else {
            setupBox.style.display = 'none';
        }
    }

    isShowingInfluenceHighlights() {
        return this.#showInfluenceHighlights;
    }

    isShowingLastMove() {
        return this.#showLastMove;
    }

    isShowingSetupBox() {
        const el = document.getElementById('chuShogiHand' + this.#id);
        return el ? (el.style.display === 'block') : this.#showSetupBoxAfterLoading;
    }

    updateDisplays() {
        // Ensure that the image set is within the allowed range
        this.#setImageSetBoundaries();
        this.#setPlaybackSpeedBoundaries();
        // Update legal move list

        // Update the board display
        for (let i = 0; i < 12; ++i) {
            for (let j = 0; j < 12; ++j) {
                let x = (this.#flip ? (11 - j) : j);
                let y = (this.#flip ? (11 - i) : i);
                document.getElementById(x + '|' + y + '|' + this.#id).style.backgroundImage = "none";
                document.getElementById(x + '|' + y + '|' + this.#id).style.backgroundColor = this.#cellColor;
                this.#clearHighlight(x, y)
                if (this.#board.isValidPieceValue(this.#board.getCellAt(j, i))) {
                    let type = this.#board.getPieceTypeAt(j, i);
                    let color = this.#board.getPieceColorAt(j, i);
                    this.#makeImage(x, y, type, color);
                }
            }
        }

        if (document.getElementById(('chuShogiHand' + this.#id)) != null) {
            for (let i = 0; i <= 39; ++i) {
                if (i > 0) this.#makeImage((100 + i), 0, i, false);
                document.getElementById(((100 + i) + '|0|' + this.#id)).style.backgroundColor = this.#cellColor;
                if (i > 0) this.#makeImage((100 + i), 1, i, true);
                document.getElementById(((100 + i) + '|1|' + this.#id)).style.backgroundColor = this.#cellColor;
            }
            document.getElementById('100|1|' + this.#id).innerHTML = '&#x26CA;';
        }


        this.#board.generateLegalMoveList();
        this.#board.generateInfluenceMap();
        if (this.#showInfluenceHighlights) {
            for (let i = 0; i < 12; ++i) {
                for (let j = 0; j < 12; ++j) {
                    let ix = (this.#flip ? (11 - j) : j);
                    let iy = (this.#flip ? (11 - i) : i);
                    if (this.#board.getInfluenceAt(ix, iy) == 1) document.getElementById(j + '|' + i + '|' + this.#id).style.backgroundColor = this.#blackInfluenceHighlightColor;
                    else if (this.#board.getInfluenceAt(ix, iy) == 2) document.getElementById(j + '|' + i + '|' + this.#id).style.backgroundColor = this.#whiteInfluenceHighlightColor;
                    else if (this.#board.getInfluenceAt(ix, iy) == 3) document.getElementById(j + '|' + i + '|' + this.#id).style.backgroundColor = this.#conflictingInfluenceHighlightColor;
                }
            }
        }

        // Update rim coordinates
        for (let i = 0; i < 12; ++i) {
            document.getElementsByClassName((i + '|a|' + this.#id))[0].innerHTML = '<b>' + this.#board.fileID(this.#flip ? (11 - i) : i) + '</b>';
            document.getElementsByClassName((i + '|a|' + this.#id))[1].innerHTML = '<b>' + this.#board.fileID(this.#flip ? (11 - i) : i) + '</b>';
            document.getElementsByClassName(('a|' + i + '|' + this.#id))[0].innerHTML = '<b>' + this.#board.rankID(this.#flip ? (11 - i) : i) + '</b>';
            document.getElementsByClassName(('a|' + i + '|' + this.#id))[1].innerHTML = '<b>' + this.#board.rankID(this.#flip ? (11 - i) : i) + '</b>';
        }

        // Shadow the last move
        this.#displayLastMove();
        this.#updateGameLog();
        this.#updateDashoardDisplays();

        if (this.#board.hasMidpoint()) {
            let mx = (this.#flip ? (11 - this.#board.getMidpointX()) : this.#board.getMidpointX());
            let my = (this.#flip ? (11 - this.#board.getMidpointY()) : this.#board.getMidpointY());
            document.getElementById(mx + '|' + my + '|' + this.#id).style.backgroundColor = this.#midpointHighlightColor;
        }
        if (this.#board.hasSetupBoxSelection()) {
            let sx = this.#board.getSelectedX();
            let sy = this.#board.getSelectedY();
            document.getElementById(sx + '|' + sy + '|' + this.#id).style.backgroundColor = this.#selectionHighlightColor;
            this.#clearHighlight(sx, sy);

            if (sx == 100 && sy == 1) {
                if (this.#board.isInBoardRange(this.#board.getSetupCounterStrikeX()) && this.#board.isInBoardRange(this.#board.getSetupCounterStrikeX())) {
                    let csx = (this.#flip ? (11 - this.#board.getSetupCounterStrikeX()) : this.#board.getSetupCounterStrikeX());
                    let csy = (this.#flip ? (11 - this.#board.getSetupCounterStrikeY()) : this.#board.getSetupCounterStrikeY());
                    document.getElementById(csx + '|' + csy + '|' + this.#id).style.backgroundColor = this.#midpointHighlightColor;
                    this.#clearHighlight(csx, csy);
                } else {
                    document.getElementById('100|0|' + this.#id).style.backgroundColor = this.#midpointHighlightColor;
                }
            }
        }
        if (this.#board.hasSelection()) {
            let sx = (this.#flip ? (11 - this.#board.getSelectedX()) : this.#board.getSelectedX());
            let sy = (this.#flip ? (11 - this.#board.getSelectedY()) : this.#board.getSelectedY());
            document.getElementById(sx + '|' + sy + '|' + this.#id).style.backgroundColor = this.#selectionHighlightColor;
            this.#clearHighlight(sx, sy);

            if (this.#board.hasPrompt()) {
                let scx = (this.#flip ? (11 - this.#board.getSelectedX()) : this.#board.getSelectedX());
                let scy = (this.#flip ? (11 - this.#board.getSelectedY()) : this.#board.getSelectedY());
                let pcx = (this.#flip ? (11 - this.#board.getPromptX()) : this.#board.getPromptX());
                let pcy = (this.#flip ? (11 - this.#board.getPromptY()) : this.#board.getPromptY());
                let dcy = pcy + (pcy >= 6 ? -1 : 1);
                let ady = pcy + (pcy >= 6 ? -2 : 2);

                let promotionClickID = pcx + '|' + pcy + '|' + this.#id;
                let deferralClickID = pcx + '|' + dcy + '|' + this.#id;
                let altDeselectClickID = pcx + '|' + ady + '|' + this.#id;

                let deferralImageType = this.#board.getPieceTypeAt(this.#board.getSelectedX(), this.#board.getSelectedY());
                let promotionImageOffset = ((deferralImageType >= 1 && deferralImageType <= 18 ? 1 : -1) * this.#board.getPromotionOffset());
                let promotionImageType = this.#board.getPieceTypeAt(this.#board.getSelectedX(), this.#board.getSelectedY()) + promotionImageOffset;
                let promptImageColor = this.#board.getPieceColorAt(this.#board.getSelectedX(), this.#board.getSelectedY());


                if (this.#board.hasMidpoint() && !this.#board.isPromotionEligible(this.#board.getSelectedX(), this.#board.getSelectedY(), this.#board.getMidpointX(), this.#board.getMidpointY(), this.#board.getPromptX(), this.#board.getPromptY())) {
                    document.getElementById(promotionClickID).style.backgroundColor = this.#midpointOptionHighlightColor;
                    this.#clearHighlight(pcx, pcy);
                    document.getElementById(deferralClickID).style.backgroundColor = this.#selectionHighlightColor;
                    document.getElementById(deferralClickID).style.backgroundImage = 'none';
                    this.#clearHighlight(pcx, dcy);
                } else {
                    document.getElementById(promotionClickID).style.backgroundColor = this.#midpointOptionHighlightColor;
                    this.#makeImage(pcx, pcy, promotionImageType, promptImageColor);
                    this.#clearHighlight(pcx, pcy);
                    document.getElementById(deferralClickID).style.backgroundColor = this.#midpointOptionHighlightColor;
                    this.#makeImage(pcx, dcy, deferralImageType, promptImageColor);
                    this.#clearHighlight(pcx, dcy);

                    if (pcx == scx && (pcy == scy || dcy == scy)) {
                        document.getElementById(altDeselectClickID).style.backgroundColor = this.#selectionHighlightColor;
                        document.getElementById(altDeselectClickID).style.backgroundImage = 'none';
                        this.#clearHighlight(pcx, ady);
                    }
                }
            } else {
                if (this.#board.hasSelection() && this.#showLegalMoveHighlights) {
                    this.#highlightLegalMoves();
                }
            }
        }
    }

    // Makes an image on the board at the given coordinates with the given type and color.
    #makeImage(x, y, type, color) {
        return document.getElementById(x + '|' + y + '|' + this.#id).style.backgroundImage = color ? "url(" + this.#imageURL((this.#useOppositePrefix() ? ChuShogiApplet.#blackPrefix : ChuShogiApplet.#whitePrefix), ChuShogiApplet.#images[type].toLowerCase()) + ')' : 'url(' + this.#imageURL((this.#useOppositePrefix() ? ChuShogiApplet.#whitePrefix : ChuShogiApplet.#blackPrefix), ChuShogiApplet.#images[type].toLowerCase()) + ')';
    }

    // Gets the URL for the image with the given prefix and name.
    #imageURL(prefix, imageName) {
        return ChuShogiApplet.#imageDir + (this.#imageSet == 0 ? '' : String(this.#imageSet)) + prefix + (this.#useFlipPrefix(imageName) ? ChuShogiApplet.#flipPrefix : '') + imageName + ChuShogiApplet.#imgSuffix;
    }

    // Returns true if the opposite prefix should be used for the given image name.
    #useOppositePrefix() {
        if (this.#imageSet != 1 && this.#imageSet != 2) {
            return false;
        } else {
            return this.#flip;
        }
    }

    #useFlipPrefix(imageName) {
        let mnemonicFlipIDs = ['a2', 'c', 'd2', 'e', 'g', 'h2', 'i2', 'l', 'l2', 'p', 'p2', 's', 't'];
        if (this.#imageSet == 0 && this.#flip && this.#board.binarySearch(mnemonicFlipIDs, imageName) != -1) return true;
        if (this.#useOppositePrefix() && imageName === 'k') return true;
    }

    #displayLastMove() {
        if (!this.#showLastMove) return;
        if (this.#board.getDisplayedPosition() > 0) {
            let move = this.#board.getGameMove(this.#board.getDisplayedPosition() - 1);
            if (!move) return; // Add null check
            let lx1 = (this.#flip ? (11 - move.getX1()) : move.getX1());
            let ly1 = (this.#flip ? (11 - move.getY1()) : move.getY1());
            let lex = (this.#flip ? (11 - move.getEX()) : move.getEX());
            let ley = (this.#flip ? (11 - move.getEY()) : move.getEY());
            let lx2 = (this.#flip ? (11 - move.getX2()) : move.getX2());
            let ly2 = (this.#flip ? (11 - move.getY2()) : move.getY2());

            if ((lex != lx2 || ley != ly2) && (lex != lx1 || ley != ly1)) {
                if (this.#showInfluenceHighlights) {
                    this.#drawLastMoveHighlight(lx1, ly1, this.#lastMoveHighlightColor);
                    if (this.#board.isInBoardRange(lex) && this.#board.isInBoardRange(ley)) {
                        this.#drawLastMoveHighlight(lex, ley, this.#lastMoveHighlightColor);
                    }
                    this.#drawLastMoveHighlight(lx2, ly2, this.#lastMoveHighlightColor);
                } else {
                    document.getElementById(lx1 + '|' + ly1 + '|' + this.#id).style.backgroundColor = this.#lastMoveHighlightColor;
                    if (this.#board.isInBoardRange(lex) && this.#board.isInBoardRange(ley)) {
                        document.getElementById(lex + '|' + ley + '|' + this.#id).style.backgroundColor = this.#lastMoveHighlightColor;
                    }
                    if (lx1 != lx2 || ly1 != ly2) {
                        document.getElementById(lx2 + '|' + ly2 + '|' + this.#id).style.backgroundColor = this.#lastMoveHighlightColor;
                    }
                }
            }
        }
    }

    #updateGameLog() {
        document.getElementById('displayedPosition' + this.#id).innerHTML = '<p><b><span class="u">Displayed Position</span></b><br>' + this.#board.getDisplayedPosition() + ' / ' + this.#board.getGameLength() + (this.#showLastMove ? this.#getLastMoveStaticText() : '') + '</p>';
        document.getElementById('fenCode' + this.#id).innerHTML = '<p><b><span class="u">SFEN</span></b><br>' + this.#board.getSFEN() + '</p>';
        document.getElementById('gameRecord' + this.#id).innerHTML = '<p><b><span class="u">Game Record</span></b><br>' + this.#board.getGame() + '</p>';
    }

    #getLastMoveStaticText() {
        if (!this.#showLastMove) return '';
        if (this.#board.getDisplayedPosition() == 0) return ' (Start Position)'
        else {
            let move = this.#board.getGameMove(this.#board.getDisplayedPosition() - 1);
            if (!move) return '';
            return ' (Last Move: ' + move.toString() + ')';
        }
    }

    #updateDashoardDisplays() {
        if (document.getElementById('newSFEN' + this.#id) != null) {
            document.getElementById('newSFEN' + this.#id).value = '';
            document.getElementById('newSFEN' + this.#id).placeholder = 'Paste SFEN here\n' + this.#board.getSFEN();
        }
        if (document.getElementById('newGame' + this.#id) != null) {
            document.getElementById('newGame' + this.#id).value = '';
            document.getElementById('newGame' + this.#id).placeholder = 'Paste Game here\n' + this.#board.getGame();
        }
    }

    // BOARD MANIPULATION METHODS

    inputMoveFromText() {
        if (document.getElementById('textMoveInput' + this.#id) == null) return;
        if (document.getElementById('textMoveInputButton' + this.#id) == null) return;
        if (this.#recapping) return;
        let moveInput = document.getElementById('textMoveInput' + this.#id).value;
        if (moveInput == null) return;
        if (moveInput == '') return;
        if (!this.#board.isValidMoveInput(moveInput)) return;
        let parts = moveInput.trim();
        let files = parts.replaceAll('+', '').replace(/[^0-9]/g, '|').replace(/\|+/g, '|').slice(0, -1).split('|');
        let ranks = parts.replaceAll('+', '').replace(/[^a-l]/g, '0').replace(/0+/g, '0').substring(1).split('0');

        let x1, y1, ex, ey, x2, y2, promotion = false;
        if (files.length == 3 && ranks.length == 3) {
            // Move with midpoint
            x1 = this.#board.fileNumber(files[0]);
            y1 = this.#board.rankNumber(ranks[0]);
            ex = this.#board.fileNumber(files[1]);
            ey = this.#board.rankNumber(ranks[1]);
            x2 = this.#board.fileNumber(files[2]);
            y2 = this.#board.rankNumber(ranks[2]);
        } else if (files.length == 2 && ranks.length == 2) {
            // Move without midpoint
            x1 = this.#board.fileNumber(files[0]);
            y1 = this.#board.rankNumber(ranks[0]);
            ex = -1;
            ey = -1;
            x2 = this.#board.fileNumber(files[1]);
            y2 = this.#board.rankNumber(ranks[1]);
        } else {
            return;
        }

        if (parts.endsWith('+')) {
            promotion = true;
        }
        if (this.#moveAndDisplay(x1, y1, ex, ey, x2, y2, promotion, true)) {
            document.getElementById('textMoveInput' + this.#id).value = '';
        }
    }

    clearBoard() {
        this.#board.setSFEN('12/12/12/12/12/12/12/12/12/12/12/12 b -');
        this.updateDisplays();
    }

    setStartPosition(color) {
        let sfenPositionData = this.#board.getSFEN().split(' ')[0];
        let sfenCounterStrikeSquare = this.#board.getSFEN().split(' ')[2];
        let newSFEN = sfenPositionData + ' ' + (color ? 'w' : 'b') + ' ' + sfenCounterStrikeSquare;
        this.#board.setSFEN(newSFEN);
        this.updateDisplays();
    }

    #moveAndDisplay(x1, y1, ex, ey, x2, y2, promotion, addToMoveList) {
        if (this.#board.makeMove(x1, y1, ex, ey, x2, y2, promotion, addToMoveList)) {
            this.#board.clearSelection();
            this.updateDisplays();
            return true;
        } else {
            this.updateDisplays();
            return false;
        }
    }

    // Jumps to the given move.
    goToMove(n) {
        this.#board.clearSelection();
        if (n < 0) n = 0;
        if (n > this.#board.getGameLength()) n = this.#board.getGameLength();
        if (n > 0) {
            this.#board.setSFENWithoutClearingGame(this.#board.getGameMove((n - 1)).getSFEN());
        } else {
            this.#board.setSFENWithoutClearingGame(this.#board.getCurrentStartSFEN());
            this.updateDisplays();
        }
        this.#board.setDisplayedPositionNumber(n);
        this.updateDisplays();
    }

    jumpToMove() {
        let promptInput = window.prompt("Enter position number (0-" + this.#board.getGameLength() + ")", "");
        if (promptInput == null) return; // User cancelled the prompt
        let moveJump;
        if (promptInput == '') moveJump = parseInt(this.#board.getDisplayedPosition());
        else moveJump = parseInt(promptInput);
        if (moveJump < 0) moveJump = 0;
        if (moveJump > this.#board.getGameLength()) moveJump = this.#board.getGameLength();
        this.goToMove(moveJump);
    }

    trimGame() {
        if (this.#recapping) return false;
        if (this.#board.getDisplayedPosition() < (this.#board.getGameLength() - 10)) {
            if (confirm("This will delete " + (this.#board.getGameLength() - this.#board.getDisplayedPosition()) + " moves.\nAre you sure (this cannot be undone)?")) {
                this.#board.truncateCurrentGame();
                this.updateDisplays();
                return true;
            } else {
                this.updateDisplays();
                return false;
            }
        } else {
            this.#board.truncateCurrentGame();
            this.updateDisplays();
            return true;
        }
    }

    newGame() {
        if (this.#recapping) return;
        if (confirm("This will start a new game.\nAre you sure (this cannot be undone)?")) {
            this.#board.clearSelection();
            this.#board.setupNewGame();
            this.updateDisplays();
        }
    }

    reset() {
        if (this.#recapping) return;
        if (confirm("This will reset the board to its original state.\nAre you sure (this cannot be undone)?")) {
            this.#board.clearSelection();
            this.#board.setupInitialBoard();
            if (this.#goToStartAfterLoading) {
                this.goToMove(0);
            }
            this.updateDisplays();
        }
    }

    // GAME PLAYBACK METHODS

    setRecapSpeed(n) {
        this.#playbackSpeed = parseFloat(document.getElementById('playbackSpeedSetter' + this.#id).value);
        if (isNaN(this.#playbackSpeed)) return;
        this.#setPlaybackSpeedBoundaries();
        document.getElementById('playbackSpeedSetter' + this.#id).value = '';
        document.getElementById('playbackSpeedSetter' + this.#id).placeholder = this.#playbackSpeed;
    }

    recapGame(reversePlayback) {
        if (this.#recapping == true) return;
        this.#board.clearSelection();
        this.#activateRecapButtons();
        this.#recapping = true;
        clearTimeout(this.#recapTimer);
        if (reversePlayback) {
            this.#reversePlaybackGame();
        } else {
            this.#playbackGame();
        }
    }

    #convertPlaybackSpeedToTimerDelay() {
        return 1000 / this.#playbackSpeed;
    }

    #reversePlaybackGame() {
        this.#board.clearSelection();
        if (this.#recapping && this.#board.getDisplayedPosition() > 0) {
            this.#setPlaybackSpeedBoundaries();
            document.getElementById('recapBackward' + this.#id).value = ChuShogiApplet.#decodeHtmlEntities('&#9668;&#9668;');
            this.#recapTimer = setTimeout(this.#reversePlaybackGame.bind(this), this.#convertPlaybackSpeedToTimerDelay()); this.goToMove(this.#board.getDisplayedPosition() - 1);
        } else {
            this.stopPlayback();
            return;
        }
    }

    #playbackGame() {
        this.#board.clearSelection();
        if (this.#recapping && this.#board.getDisplayedPosition() < (this.#board.getGameLength())) {
            this.#setPlaybackSpeedBoundaries();
            document.getElementById('recapForward' + this.#id).value = ChuShogiApplet.#decodeHtmlEntities('&#9658;&#9658;');
            this.#recapTimer = setTimeout(this.#playbackGame.bind(this), this.#convertPlaybackSpeedToTimerDelay()); this.goToMove(this.#board.getDisplayedPosition() + 1);
        } else {
            this.stopPlayback();
            return;
        }
    }

    stopPlayback() {
        this.#board.clearSelection();
        this.#recapping = false;
        clearTimeout(this.#recapTimer);
        this.#resetRecapButtons();
    }

    #activateRecapButtons() {
        let controlsDisabledDuringRecap = document.getElementsByClassName(('disabledDuringRecap' + this.#id));
        for (let i = 0; i < controlsDisabledDuringRecap.length; ++i) {
            controlsDisabledDuringRecap[i].disabled = true;
        }
        document.getElementById('recapStop' + this.#id).disabled = false;
    }

    #resetRecapButtons() {
        let controlsDisabledDuringRecap = document.getElementsByClassName(('disabledDuringRecap' + this.#id));
        for (let i = 0; i < controlsDisabledDuringRecap.length; ++i) {
            controlsDisabledDuringRecap[i].disabled = false;
        }
        document.getElementById('recapStop' + this.#id).disabled = true;
        document.getElementById('recapBackward' + this.#id).value = ChuShogiApplet.#decodeHtmlEntities('<|<|');
        document.getElementById('recapForward' + this.#id).value = ChuShogiApplet.#decodeHtmlEntities('|>|>');
    }

    // INTERACTION METHODS

    // Mouse Down Event
    mouseDown(x, y, event) {
        this.#arrowX = x;
        this.#arrowY = y;

        if (event.button == 0) {
            this.#click(x, y);
        }
    }

    // Mouse Up Event
    mouseUp(x, y, event) {
        if (event.button == 0) {
            if (x != this.#arrowX || y != this.#arrowY) {
                this.#click(x, y);
            }
        }
        this.#arrowX = -1;
        this.#arrowY = -1;
    }

    touchDown(x, y, event) {
        event.preventDefault();
        this.#arrowX = x;
        this.#arrowY = y;
        this.#click(x, y);
    }

    touchUp(x, y, event) {
        event.preventDefault();
        if (x != this.#arrowX || y != this.#arrowY) {
            this.#click(x, y);
        }
        this.#arrowX = -1;
        this.#arrowY = -1;
    }

    #click(x, y) {
        if (this.#viewOnly) {
            this.#board.clearSelection();
            return;
        }
        if (this.#recapping) {
            this.stopPlayback();
            return;
        }
        if (this.#moveOnCurrentPositionOnly) {
            if (displayed != moveList.length) { this.#board.clearSelection(); window.alert('Position not current: press >| or 8< first'); return; }
        }
        if (!this.#board.isInBoardRange(x) && !this.#board.isInBoardRange(y)) return;
        let cx = x;
        let cy = y;
        if (this.#flip && this.#board.isInBoardRange(x) && this.#board.isInBoardRange(y)) {
            x = 12 - 1 - x;
            y = 12 - 1 - y;
        }

        // Setting positions with the mouse
        if (this.#allowPositionSetup && !this.#viewOnly) {
            if (x >= 100 && !this.#board.hasSetupBoxSelection()) {
                this.#board.clearSelection();
                this.#board.selectSetupBoxPiece(x, y);
                this.updateDisplays();
                return;
            } else if (x >= 100 && (x == this.#board.getSelectedX() && y == this.#board.getSelectedY())) {
                this.#board.clearSelection();
                this.updateDisplays();
                return;
            } else if (this.#board.getSelectedX() >= 100 && (this.#board.isInBoardRange(x) && this.#board.isInBoardRange(y))) {
                let newPiece = (this.#board.getSelectedX() - 100);
                if (this.#board.getSelectedX() == 100 && this.#board.getSelectedY() == 1) {
                    if (this.#board.getCellAt(x, y) > 0) {
                        this.#board.setSetupCounterStrike(x, y);
                    } else {
                        this.#board.setSetupCounterStrike(-1, -1);
                    }
                } else {
                    if (this.#board.getSelectedX() != 100 && this.#board.getSelectedY() == 1 && newPiece > 0) {
                        newPiece += 1024;
                    }
                    this.#board.setCell(x, y, newPiece);
                }
                this.updateDisplays();
                return;
            } else if (this.#board.getSelectedX() >= 100 && (x >= 100 && x <= 139)) {
                this.#board.clearSelection();
                this.#click(x, y);
            }
        } else if (x >= 100 && x <= 139) return;

        // Normal piece selection and movement
        if (this.#enforceRules && !this.#board.hasSelection() && (this.#board.getPlayerToMove() ? !this.#board.getPieceColorAt(x, y) : this.#board.getPieceColorAt(x, y))) return;
        let clickedPieceType = this.#board.getPieceTypeAt(x, y);

        if (!this.#board.hasSelection() && this.#board.hasMidpoint()) {
            this.#board.clearSelection();
            this.updateDisplays();
            return;
        }
        if (this.#board.isValidMidpoint(this.#board.getSelectedX(), this.#board.getSelectedY(), x, y)) {
            if (this.#board.hasMidpoint()) {
                this.#inputClick(this.#board.getSelectedX(), this.#board.getSelectedY(), this.#board.getMidpointX(), this.#board.getMidpointY(), x, y);
            } else {
                this.#board.selectMidpoint(x, y);
            }
        } else if (clickedPieceType > 0) {
            if (!this.#board.hasSelection()) {
                this.#board.selectPiece(x, y);
            } else {
                if (x == this.#board.getSelectedX() && y == this.#board.getSelectedY()) {
                    if (this.#board.hasMidpoint() && !(x == this.#board.getPromptX() && y == this.#board.getPromptY())) {
                        this.#inputClick(this.#board.getSelectedX(), this.#board.getSelectedY(), this.#board.getMidpointX(), this.#board.getMidpointY(), x, y);
                    } else {
                        if (x == this.#board.getPromptX() && y == this.#board.getPromptY()) {
                            this.#inputClick(this.#board.getSelectedX(), this.#board.getSelectedY(), this.#board.getMidpointX(), this.#board.getMidpointY(), x, y);
                        } else if (x == this.#board.getPromptX() && y == (this.#board.getPromptY() + (this.#board.getPromptY() >= 6 ? -1 : 1))) {
                            this.#inputClick(this.#board.getSelectedX(), this.#board.getSelectedY(), this.#board.getMidpointX(), this.#board.getMidpointY(), x, y);
                        } else {
                            this.#board.clearSelection();
                        }
                    }
                } else if (x == this.#board.getMidpointX() && y == this.#board.getMidpointY()) {
                    this.#inputClick(this.#board.getSelectedX(), this.#board.getSelectedY(), -1, -1, x, y);
                } else if (this.#board.getCellAt(x, y) > 0 && !this.#board.isPiecesOfDifferentColors(this.#board.getSelectedX(), this.#board.getSelectedY(), x, y)) {
                    if (!(!this.#allowPositionSetup || this.#enforceRules)) {
                        this.#inputClick(this.#board.getSelectedX(), this.#board.getSelectedY(), this.#board.getMidpointX(), this.#board.getMidpointY(), x, y);
                    } else {
                        this.#board.clearSelection();
                        this.#click(cx, cy);
                    }
                } else if (this.#board.isPiecesOfDifferentColors(this.#board.getSelectedX(), this.#board.getSelectedY(), x, y)) {
                    this.#inputClick(this.#board.getSelectedX(), this.#board.getSelectedY(), this.#board.getMidpointX(), this.#board.getMidpointY(), x, y);
                } else {
                    this.#board.clearSelection();
                }
            }
        } else {
            if (this.#board.hasSelection() && (x != this.#board.getSelectedX() || y != this.#board.getSelectedY())) {
                this.#inputClick(this.#board.getSelectedX(), this.#board.getSelectedY(), this.#board.getMidpointX(), this.#board.getMidpointY(), x, y);
            }
        }

        this.updateDisplays();
    }

    #inputClick(x1, y1, ex, ey, x2, y2) {
        let deferralOffset = (this.#board.getPromptY() >= 6) ? -1 : 1;
        let deselectOptionCovered = (x1 == this.#board.getPromptX() && (y1 == this.#board.getPromptY() || y1 == (this.#board.getPromptY() + deferralOffset)));
        if (this.#board.hasMidpoint() && !this.#board.isPromotionEligible(x1, y1, ex, ey, this.#board.getPromptX(), this.#board.getPromptY())) {
            if (x2 == x1 && y2 == y1) {
                if (!this.#board.hasPrompt() && this.#board.vetMove(x1, y1, ex, ey, x2, y2, false)) {
                    this.#board.setPrompt(x2, y2);
                } else if (!this.#board.vetMove(x1, y1, ex, ey, x2, y2, false)) {
                    this.#board.clearSelection();
                } else {
                    this.#inputMoveFromClicks(x1, y1, ex, ey, x2, y2, false);
                }
            } else if (x2 == x1 && y2 == (y1 + deferralOffset) && this.#board.hasPrompt()) {
                this.#board.clearSelection();
            } else {
                if (this.#board.isPromotionEligible(x1, y1, ex, ey, x2, y2) && this.#board.vetMove(x1, y1, ex, ey, x2, y2, true)) {
                    this.#board.setPrompt(x2, y2);
                } else {
                    this.#inputMoveFromClicks(x1, y1, ex, ey, x2, y2, false);
                }
            }
        } else if (!this.#board.hasPrompt() && this.#board.isPromotionEligible(x1, y1, ex, ey, x2, y2) && this.#board.vetMove(x1, y1, ex, ey, x2, y2, true)) {
            this.#board.setPrompt(x2, y2);
        } else if (this.#board.isPromotionEligible(x1, y1, ex, ey, this.#board.getPromptX(), this.#board.getPromptY())) {
            if (deselectOptionCovered && x2 == this.#board.getPromptX() && y2 == (this.#board.getPromptY() + (2 * deferralOffset))) {
                this.#board.clearSelection();
            } else if (x2 == x1 && y2 == y1) {
                if (deselectOptionCovered) {
                    if (y2 == this.#board.getPromptY()) {
                        this.#inputMoveFromClicks(x1, y1, ex, ey, x2, y2, (y2 == y1));
                    } else if (y2 == this.#board.getPromptY() + deferralOffset) {
                        this.#inputMoveFromClicks(x1, y1, ex, ey, x2, (y2 - deferralOffset), false);
                    }
                } else {
                    this.#board.clearSelection();
                }
            } else if (x2 == this.#board.getPromptX() && y2 == this.#board.getPromptY()) {
                this.#inputMoveFromClicks(x1, y1, ex, ey, x2, y2, true);
            } else if (x2 == this.#board.getPromptX() && y2 == this.#board.getPromptY() + deferralOffset) {
                this.#inputMoveFromClicks(x1, y1, ex, ey, x2, (y2 - deferralOffset), false);
            }
        } else {
            this.#inputMoveFromClicks(x1, y1, ex, ey, x2, y2, false);
        }
    }

    #inputMoveFromClicks(x1, y1, ex, ey, x2, y2, promotion) {
        if (this.#enforceRules && !this.#board.vetPotentialMove(x1, y1, ex, ey, x2, y2, promotion)) return;
        if (this.#board.getDisplayedPosition() != this.#board.getGameLength()) {
            if (!this.trimGame()) {
                this.#board.clearSelection();
                return;
            }
        }
        if (this.#moveAndDisplay(x1, y1, ex, ey, x2, y2, promotion, true)) {
            this.#board.clearSelection();
        }
    }

    // HIGHLIGHT METHODS

    #highlightLegalMoves() {
        if (!this.#showLegalMoveHighlights) return;
        if (!this.#board.hasSelection()) return;
        let x = this.#board.getSelectedX();
        let y = this.#board.getSelectedY();
        let mpx = this.#board.getMidpointX();
        let mpy = this.#board.getMidpointY();

        let type = this.#board.getPieceTypeAt(x, y);
        let color = this.#board.getPieceColorAt(x, y);

        if ((type == 20 || type == 31) && !(mpx == -1 || mpy == -1) && Math.abs(mpx - x) <= 1 && Math.abs(mpy - y) <= 1) {
            this.#showLegalMoves(mpx, mpy, 40);
            this.#highlightSelections();
        }
        if (type == 38 && !(mpx == -1 || mpy == -1) && (mpx - x) == 0 && (mpy - y) == (color ? -1 : 1)) {
            this.#showLegalMoves(mpx, mpy, 41);
            this.#highlightSelections();
        }
        if (type == 39 && !(mpx == -1 || mpy == -1) && (mpx - x) == (color ? 1 : -1) && (mpy - y) == (color ? -1 : 1)) {
            this.#showLegalMoves(mpx, mpy, 42);
            this.#highlightSelections();
        }
        if (type == 39 && !(mpx == -1 || mpy == -1) && (mpx - x) == (color ? -1 : 1) && (mpy - y) == (color ? -1 : 1)) {
            this.#showLegalMoves(mpx, mpy, 43);
            this.#highlightSelections();
        }
        else if (!this.#board.hasMidpoint()) this.#showLegalMoves(x, y, type);

    }

    #showLegalMoves(x, y, type) {
        let legal = Board.getLegalMoves(type);
        let h = [legal[0], legal[1], legal[2], legal[3], legal[4], legal[5], legal[6], legal[7]];
        let dx = [-1, 0, 1, -1, 1, -1, 0, 1];
        let dy = [1, 1, 1, 0, 0, -1, -1, -1];
        let hx;
        let hy;
        if (this.#board.getPieceColorAt(this.#board.getSelectedX(), this.#board.getSelectedY())) { for (let i = 0; i < 8; ++i) { dx[i] *= -1; dy[i] *= -1; } }
        for (let i = 7; i >= 0; --i) {
            if (h[i] == 1) { // Step
                hx = x + dx[i];
                hy = y + dy[i];
                // Highlight with Jump Color
                this.#highlightCell(hx, hy, this.#jumpOptionHighlightColor);
            }
            else if (h[i] == 2) { // Linear Jump
                hx = x + (dx[i] * 2);
                hy = y + (dy[i] * 2);
                // Highlight with Jump Color
                this.#highlightCell(hx, hy, this.#jumpOptionHighlightColor);
            }
            else if (h[i] == 3) { // Slide
                // Highlight recursively with Slide Color
                this.#highlightSlide(x, y, x, y, dx[i], dy[i], this.#slideOptionHighlightColor);
            }
            else if (h[i] == 4) { // Linear Lion Move
                hx = x + (dx[i] * 2);
                hy = y + (dy[i] * 2);
                // Highlight with Jump Color
                this.#highlightCell(hx, hy, this.#jumpOptionHighlightColor);
                hx = x + dx[i];
                hy = y + dy[i];
                // Highlight with Midpoint Color
                this.#highlightCell(hx, hy, this.#midpointOptionHighlightColor);
            }
            else if (h[i] == 5) { // Full Lion Move
                hx = x + (dx[i] * 2);
                hy = y + (dy[i] * 2);
                // Highlight with Jump Color
                this.#highlightCell(hx, hy, this.#jumpOptionHighlightColor);
                hx = x + dx[i];
                hy = y + dy[i];
                // Highlight with Midpoint Color
                this.#highlightCell(hx, hy, this.#midpointOptionHighlightColor);
                // Vertical Knight Jumps
                if (dx[i] == 0) {
                    hx = x + 1;
                    hy = y + (dy[i] * 2);
                    // Highlight with Jump Color
                    this.#highlightCell(hx, hy, this.#jumpOptionHighlightColor);
                    hx = x - 1;
                    // Highlight with Jump Color
                    this.#highlightCell(hx, hy, this.#jumpOptionHighlightColor);
                }
                // Horizontal Knight Jumps
                if (dy[i] == 0) {
                    hx = x + (dx[i] * 2);
                    hy = y + 1;
                    // Highlight with Jump Color
                    this.#highlightCell(hx, hy, this.#jumpOptionHighlightColor);
                    hy = y - 1;
                    // Highlight with Jump Color
                    this.#highlightCell(hx, hy, this.#jumpOptionHighlightColor);
                }
            }
        }
    }

    #highlightSelections() {
        this.#highlightCell(this.#board.getMidpointX(), this.#board.getMidpointY(), this.#jumpOptionHighlightColor);
        this.#highlightCell(this.#board.getSelectedX(), this.#board.getSelectedY(), this.#slideOptionHighlightColor);
    }

    #highlightSlide(x, y, ox, oy, dx, dy, color) {
        let hx = x + dx;
        let hy = y + dy;
        if (!(this.#board.isInBoardRange(x) && this.#board.isInBoardRange(y) && this.#board.isInBoardRange(ox) && this.#board.isInBoardRange(oy) && this.#board.isInBoardRange(hx) && this.#board.isInBoardRange(hy))) return;
        if (hx == ox && hy == oy) return;

        this.#highlightCell(hx, hy, color);
        if (this.#board.getCellAt(hx, hy) == 0) {
            this.#highlightSlide(hx, hy, ox, oy, dx, dy, color);
        }
    }

    #highlightCell(hx, hy, color) {
        if (!this.#board.vetPotentialMove(this.#board.getSelectedX(), this.#board.getSelectedY(), this.#board.getMidpointX(), this.#board.getMidpointY(), hx, hy, false, true) && !this.#board.vetPotentialMove(this.#board.getSelectedX(), this.#board.getSelectedY(), this.#board.getMidpointX(), this.#board.getMidpointY(), hx, hy, true, true)) {
            return;
        }

        let hcx = this.#flip ? (11 - hx) : hx;
        let hcy = this.#flip ? (11 - hy) : hy;
        this.#drawLegalMoveHighlight(hcx, hcy, color);
    }

    // CELL CANVAS HIGHLIGHT METHODS
    #clearHighlight(x, y) {
        if (!this.#board.isInBoardRange(x) || !this.#board.isInBoardRange(y)) return;
        let canvas = document.getElementById(x + '|' + y + '|' + this.#id + 'c');
        let ctx = canvas.getContext('2d');
        ctx.reset();
    }

    #drawLegalMoveHighlight(x, y, color) {
        if (!this.#board.isInBoardRange(x) || !this.#board.isInBoardRange(y)) return;
        let canvas = document.getElementById(x + '|' + y + '|' + this.#id + 'c');
        let ctx = canvas.getContext('2d');

        let centerX = canvas.width / 2;
        let centerY = canvas.height / 2;
        let radiusRatio = 0.18;
        let radius = Math.min(canvas.width, canvas.height) * radiusRatio;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();

        let radius2 = Math.min(canvas.width, canvas.height) * (radiusRatio + 0.01);

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius2, 0, 2 * Math.PI);
        ctx.lineWidth = 1.25;
        ctx.strokeStyle = this.#highlightBorderColor;
        ctx.stroke();
    }

    #drawLastMoveHighlight(x, y, color) {
        if (!this.#board.isInBoardRange(x) || !this.#board.isInBoardRange(y)) return;
        let canvas = document.getElementById(x + '|' + y + '|' + this.#id + 'c');
        let ctx = canvas.getContext('2d');

        let centerX = canvas.width / 2;
        let centerY = canvas.height / 2;
        let radiusRatio = 0.42;
        let radius = Math.min(canvas.width, canvas.height) * radiusRatio;
        let circleThickness = (Math.min(canvas.width, canvas.height) / 30) + 1.5;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.lineWidth = circleThickness + 2.5;
        ctx.strokeStyle = this.#highlightBorderColor;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.lineWidth = circleThickness;
        ctx.strokeStyle = color;
        ctx.stroke();
    }
}


class Board {
    // Constants
    static #defaultSFEN = 'lfcsgekgscfl/a1b1txot1b1a/mvrhdqndhrvm/pppppppppppp/3i4i3/12/12/3I4I3/PPPPPPPPPPPP/MVRHDNQDHRVM/A1B1TOXT1B1A/LFCSGKEGSCFL b -';

    static #ids = ['', 'p', 'i', 'c', 's', 'g', 'f', 't', 'e', 'x', 'o', 'l', 'a', 'm', 'v', 'b', 'r', 'h', 'd', 'q', 'n', 'k', '+p', '+i', '+c', '+s', '+g', '+f', '+t', '+e', '+x', '+o', '+l', '+a', '+m', '+v', '+b', '+r', '+h', '+d'];

    static #idsSorted = ['', '+a', '+b', '+c', '+d', '+e', '+f', '+g', '+h', '+i', '+l', '+m', '+o', '+p', '+r', '+s', '+t', '+v', '+x', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'v', 'x'];
    static #idsSortedIndexes = [0, 33, 36, 24, 39, 29, 27, 26, 38, 23, 32, 34, 31, 22, 37, 25, 28, 35, 30, 12, 15, 3, 18, 8, 6, 5, 17, 2, 21, 11, 13, 20, 10, 1, 19, 16, 4, 7, 14, 9];
    static #allowedMoveFormats = /(^([1-9]|1[012])[a-l]([1-9]|1[012])[a-l]$)|(^([1-9]|1[012])[a-l]([1-9]|1[012])[a-l]\+$)|(^([1-9]|1[012])[a-l]([1-9]|1[012])[a-l]([1-9]|1[012])[a-l]$)|(^([1-9]|1[012])[a-l]([1-9]|1[012])[a-l]([1-9]|1[012])[a-l]\+$)/;

    static #allowedCoordinateFormat = /^([1-9]|1[012])[a-l]$/;

    static #promotionOffset = 21;

    static legal = [
        //  [fl, f, fr, l, r, bl, b, br] f = forward, b = backward, l = left, r = right
        [0, 0, 0, 0, 0, 0, 0, 0], // Empty Square
        [0, 1, 0, 0, 0, 0, 0, 0], // Pawn
        [0, 1, 0, 0, 0, 0, 1, 0], // Go-Between
        [1, 1, 1, 0, 0, 0, 1, 0], // Copper General
        [1, 1, 1, 0, 0, 1, 0, 1], // Silver General
        [1, 1, 1, 1, 1, 0, 1, 0], // Gold General
        [1, 1, 1, 0, 0, 1, 1, 1], // Ferocious Leopard
        [1, 0, 1, 1, 1, 1, 1, 1], // Blind Tiger
        [1, 1, 1, 1, 1, 1, 0, 1], // Drunk Elephant
        [2, 1, 2, 1, 1, 2, 1, 2], // Phoenix
        [1, 2, 1, 2, 2, 1, 2, 1], // Kirin
        [0, 3, 0, 0, 0, 0, 0, 0], // Lance
        [0, 3, 0, 0, 0, 0, 3, 0], // Reverse Chariot
        [0, 1, 0, 3, 3, 0, 1, 0], // Side Mover
        [0, 3, 0, 1, 1, 0, 3, 0], // Vertical Mover
        [3, 0, 3, 0, 0, 3, 0, 3], // Bishop
        [0, 3, 0, 3, 3, 0, 3, 0], // Rook
        [3, 1, 3, 1, 1, 3, 1, 3], // Dragon Horse
        [1, 3, 1, 3, 3, 1, 3, 1], // Dragon King
        [3, 3, 3, 3, 3, 3, 3, 3], // Queen
        [5, 5, 5, 5, 5, 5, 5, 5], // Lion
        [1, 1, 1, 1, 1, 1, 1, 1], // King
        [1, 1, 1, 1, 1, 0, 1, 0], // Tokin (Gold General, Promoted)
        [1, 1, 1, 1, 1, 1, 0, 1], // Drunk Elephant (Promoted)
        [0, 1, 0, 3, 3, 0, 1, 0], // Side Mover (Promoted)
        [0, 3, 0, 1, 1, 0, 3, 0], // Vertical Mover (Promoted)
        [0, 3, 0, 3, 3, 0, 3, 0], // Rook (Promoted)
        [3, 0, 3, 0, 0, 3, 0, 3], // Bishop (Promoted)
        [1, 3, 1, 1, 1, 1, 3, 1], // Flying Stag
        [1, 1, 1, 1, 1, 1, 1, 1], // Prince (King, Promoted)
        [3, 3, 3, 3, 3, 3, 3, 3], // Queen (Promoted)
        [5, 5, 5, 5, 5, 5, 5, 5], // Lion (Promoted)
        [3, 3, 3, 0, 0, 0, 3, 0], // White Horse
        [0, 3, 0, 0, 0, 3, 3, 3], // Whale
        [3, 0, 3, 3, 3, 3, 0, 3], // Free Boar
        [3, 3, 3, 0, 0, 3, 3, 3], // Flying Ox
        [3, 1, 3, 1, 1, 3, 1, 3], // Dragon Horse (Promoted)
        [1, 3, 1, 3, 3, 1, 3, 1], // Dragon King (Promoted)
        [3, 4, 3, 3, 3, 3, 3, 3], // Horned Falcon
        [4, 3, 4, 3, 3, 3, 3, 3], // Soaring Eagle
        [1, 1, 1, 1, 1, 1, 1, 1], // Lion with Midpoint
        [0, 1, 0, 0, 0, 0, 1, 0], // Horned Falcon with Midpoint
        [1, 0, 0, 0, 0, 0, 0, 1], // Soaring Eagle with Midpoint
        [0, 0, 1, 0, 0, 1, 0, 0]  // Soaring Eagle with Midpoint
    ];

    static getLegalMoves(pieceType) {
        if (pieceType < 0 && pieceType > Board.legal.length) return Board.legal[0];
        return Board.legal[pieceType];
    }

    static getAllowedMoveFormats() {
        return Board.#allowedMoveFormats;
    }

    binarySearch(array, target) {
        let start = 0;
        let end = array.length - 1;
        while (start <= end) {
            let mid = Math.floor((start + end) / 2);
            if (array[mid] === target) {
                return mid;
            } else if (array[mid] < target) {
                start = mid + 1;
            } else {
                end = mid - 1;
            }
        }
        return -1;
    }

    // Board
    #board;
    #displayed = 0;
    #moveList = [];
    #legalMoveList = [];
    #influence = [];

    // Board Settings
    #startSFEN;
    #startGame;
    #enforceRules;
    #allowPositionSetup;
    #renmeiBridgeCaptureRule;
    #okazakiRule;
    #trappedLancesMayPromote;
    #forbidAllRepeats;

    #startCounterStrikeX = -1;
    #startCounterStrikeY = -1;

    #setupCounterStrikeX = -2;
    #setupCounterStrikeY = -2;

    #selectedX = -1;
    #selectedY = -1;
    #midpointX = -1;
    #midpointY = -1;
    #promptX = -1;
    #promptY = -1;

    #currentStartSFEN = '';

    getLegalMoveList() {
        return this.#legalMoveList;
    }

    constructor(startSFEN, gameString, enforceRules, allowPositionSetup, renmeiBridgeCaptureRule, okazakiRule, trappedLancesMayPromote, forbidAllRepeats) {
        this.#startSFEN = startSFEN;
        this.#startGame = gameString;
        this.#enforceRules = enforceRules;
        this.#allowPositionSetup = allowPositionSetup;
        this.#renmeiBridgeCaptureRule = renmeiBridgeCaptureRule;
        this.#okazakiRule = okazakiRule;
        this.#trappedLancesMayPromote = trappedLancesMayPromote;
        this.#forbidAllRepeats = forbidAllRepeats;
        this.#board = new Array(12);
        this.#createBoard();
        this.setupInitialBoard();
    }

    #createBoard() {
        for (let i = 0; i < 12; ++i) {
            this.#board[i] = new Array(12);
        }

        for (let i = 0; i < 12; ++i) {
            for (let j = 0; j < 12; ++j) {
                this.#board[i][j] = 0;
            }
        }

        for (let i = 0; i < 12; ++i) {
            this.#influence[i] = new Array(12);
        }

        for (let i = 0; i < 12; ++i) {
            for (let j = 0; j < 12; ++j) {
                this.#influence[i][j] = 0;
            }
        }
    }

    setupInitialBoard() {
        if (this.setSFEN(this.#startSFEN) != 0) this.setSFEN(Board.#defaultSFEN)
        this.setGame(this.#startGame);
    }

    setupNewGame() {
        if (this.setSFEN(this.#currentStartSFEN) != 0) this.setSFEN(Board.#defaultSFEN);
    }

    truncateCurrentGame() {
        this.clearSelection();
        this.#moveList.splice(this.#displayed, this.#moveList.length - this.#displayed);
    }

    // BOARD POSITION METHODS

    setSFEN(sfenCode) {
        return this.#parseSFEN(sfenCode, true, true);
    }

    setSFENWithoutClearingGame(sfenCode) {
        return this.#parseSFEN(sfenCode, true, false);
    }

    #parseSFEN(sfenCode, overrideBoard, clearCurrentGame) {
        let board2 = new Array(12);
        for (let i = 0; i < 12; ++i) {
            board2[i] = new Array(12);
        }

        for (let i = 0; i < 12; ++i) {
            for (let j = 0; j < 12; ++j) {
                board2[i][j] = 0;
            }
        }
        if (sfenCode === '') return 1;
        let parts = sfenCode.trim().replace(/\s+/g, " ").split(' ');
        if (parts.length != 3) return 2;
        let positionData = parts[0];
        let playerToMove = parts[1];
        let counterStrikeSquare = parts[2];
        if (playerToMove !== 'b' && playerToMove !== 'w') return 3;

        let newCounterStrikeX = -1;
        let newCounterStrikeY = -1;
        if (counterStrikeSquare !== '-') {
            if (!Board.#allowedCoordinateFormat.test(counterStrikeSquare)) {
                return 4;
            } else {
                // Set Counter Strike Coordinates
                newCounterStrikeX = this.fileNumber(counterStrikeSquare.replace(/[^0-9]/g, ''));
                newCounterStrikeY = this.rankNumber(counterStrikeSquare.replace(/[^a-z]/g, ''));
            }
        }

        let rows = positionData.split("/");
        if (rows.length > 12) return 5;

        // Target Cell Coordinates
        let fenCellY = 11;
        let fenCellX = 0;

        // Allowed Patterns
        let allowedCellCharPatterns = /^([a-i]|[k-t]|v|x|[A-I]|[K-T]|V|X|\+|[1-9])$/;
        let promotedPieceCharPattern = /^(\+([a-i]|l|m|o|p|[r-t]|v|x|[A-I]|L|M|O|P|[R-T]|V|X))$/;
        let numberCharPattern = /^([0-9])$/;
        let twoDigitNumberCharPattern = /^(1[0-2])$/;

        for (let fenRow = 0; fenRow < rows.length; ++fenRow) {
            let emptySquareRowLength = 0;
            fenCellX = 0;
            for (let fenChar = 0; fenChar < rows[fenRow].length; ++fenChar) {
                let currentChar = rows[fenRow].charAt(fenChar); // current character
                let prevChar = rows[fenRow].charAt((fenChar - 1)); // previous character
                let nextChar = rows[fenRow].charAt((fenChar + 1)); // next character
                // Catch-all for characters invalid under any circumstances
                if (!allowedCellCharPatterns.test(currentChar) && !(currentChar == '0' && prevChar == '1')) {
                    // allow 0 if and only if it immediately follows a 1
                    return 6;
                }
                // Promoted Pieces
                if (currentChar == '+') {
                    if (nextChar == '') {
                        return 7;
                    } else {
                        let promotedFENPiece = currentChar + nextChar; // Join current character and next character
                        if (!promotedPieceCharPattern.test(promotedFENPiece)) { // if invalid character follows plus, exit early
                            return 8;
                        } else { // otherwise valid
                            // add piece to board clipboard
                            let pieceIndex = this.binarySearch(Board.#idsSorted, promotedFENPiece.toLowerCase());
                            if (pieceIndex == -1) // Ensure piece is valid
                            {
                                return 9;
                            }
                            let piece = Board.#idsSortedIndexes[pieceIndex];
                            if (promotedFENPiece === promotedFENPiece.toLowerCase()) {
                                piece += 1024;
                            }
                            board2[fenCellY][fenCellX] = piece;
                            // Add 1 to fenCellX if valid
                            fenCellX += 1;
                            // Advance past two-char piece
                            ++fenChar;
                        }
                    }
                }
                else if (numberCharPattern.test(currentChar)) { // current character is 0-9
                    if (!numberCharPattern.test(prevChar) && !numberCharPattern.test(nextChar) && currentChar != '0') {
                        // single non-zero digit, add to fenCellX
                        emptySquareRowLength += Number(currentChar);
                    } else if (!numberCharPattern.test(prevChar) && numberCharPattern.test(nextChar)) {
                        // beginning of two-digit number
                        if (currentChar != '1') { // check for invalid tens place
                            return 10;
                        } else { // add tens place to 
                            emptySquareRowLength += Number(currentChar);
                        }
                    } else if (numberCharPattern.test(prevChar)) {
                        if (prevChar != '1') { // check for invalid non-zero digit (just in case previous check fails to do so)
                            return 11;
                        }
                        if (!numberCharPattern.test(nextChar)) {
                            let twoDigitNumber = prevChar + currentChar;
                            if (!twoDigitNumberCharPattern.test(twoDigitNumber)) {
                                return 12;
                            } else {
                                emptySquareRowLength += 9; // add 9 to make up difference between string number and actual number
                                emptySquareRowLength += Number(currentChar);
                            }
                        } else {
                            return 13;
                        }
                    }
                    fenCellX += emptySquareRowLength; // add number
                    emptySquareRowLength = 0;
                }
                else // All other possible cases must be letters (slashes and parts separated by spaces cut out in initial splits, all other possibilities caught in initial catch-all), so add 1 to fenCellX
                {
                    // add piece to board clipboard
                    let pieceIndex = this.binarySearch(Board.#idsSorted, currentChar.toLowerCase());
                    if (pieceIndex == -1) // Ensure piece is valid
                    {
                        return 14;
                    }
                    let piece = Board.#idsSortedIndexes[pieceIndex];
                    if (currentChar === currentChar.toLowerCase()) {
                        piece += 1024;
                    }
                    board2[fenCellY][fenCellX] = piece;
                    fenCellX += 1;
                }
            }
            if (fenCellX > 12) {
                return 15;
            }
            // Subtract 1 from fenCellY
            --fenCellY;
        }


        if (overrideBoard) {
            this.clearSelection();
            // Paste board clipboard to actual board
            for (let i = 0; i < 12; i++) {
                for (let j = 0; j < 12; ++j) {
                    this.#board[i][j] = board2[i][j];
                }
            }
            this.#startCounterStrikeX = newCounterStrikeX;
            this.#startCounterStrikeY = newCounterStrikeY;

            if (clearCurrentGame) {
                // Clear move list
                this.#clearMoveList();
                this.#displayed = 0;
                this.#currentStartSFEN = sfenCode;
            }
        }
        return 0;
    }

    getSFEN() {
        let fenCode = "";
        let emptySquareRowLength = 0;
        for (let i = 11; i >= 0; --i) {
            for (let j = 0; j <= 11; ++j) {
                let pieceType = (this.#board[i][j] & 511);
                let pieceColor = (this.#board[i][j] & 1024) ? 1 : 0;
                if (pieceType == 0) {
                    ++emptySquareRowLength;
                    if (j == 11) {
                        if (emptySquareRowLength > 0) { fenCode += emptySquareRowLength.toString(); }
                        emptySquareRowLength = 0;
                    }
                } else {
                    if (emptySquareRowLength > 0) { fenCode += emptySquareRowLength.toString(); }
                    emptySquareRowLength = 0;
                    let pieceID = (pieceColor) ? Board.#ids[pieceType].toLowerCase() : Board.#ids[pieceType].toUpperCase();
                    fenCode += pieceID;
                }
            }
            if (i > 0) { fenCode += '/'; }
        }

        fenCode += ' ' + (this.getPlayerToMove() ? 'w' : 'b');

        if (this.counterStrikeX() != -1 && this.counterStrikeY() != -1) fenCode += ' ' + this.fileID(this.counterStrikeX()) + this.rankID(this.counterStrikeY());
        else fenCode += ' -';

        return fenCode;
    }

    // BOARD ACCESS METHODS

    isValidMoveInput(moveInput) {
        if (!Board.#allowedMoveFormats.test(moveInput)) return false;
        else return true;
    }

    counterStrikeX() {
        if (this.#displayed < 0 || this.#displayed > this.#moveList.length) return -1;
        if (this.isInMidpointBoardRange(this.#setupCounterStrikeX)) return this.#setupCounterStrikeX;
        return (this.#displayed > 0 ? this.#moveList[(this.#displayed - 1)].getCounterStrikeX() : this.#startCounterStrikeX);
    }

    counterStrikeY() {
        if (this.#displayed < 0 || this.#displayed > this.#moveList.length) return -1;
        if (this.isInMidpointBoardRange(this.#setupCounterStrikeY)) return this.#setupCounterStrikeY;
        return (this.#displayed > 0 ? this.#moveList[(this.#displayed - 1)].getCounterStrikeY() : this.#startCounterStrikeY);
    }

    getSetupCounterStrikeX() {
        return this.#setupCounterStrikeX;
    }

    getSetupCounterStrikeY() {
        return this.#setupCounterStrikeY;
    }

    getPlayerToMove() {
        if (this.#displayed > 0 && this.#displayed <= this.#moveList.length) {
            const move = this.#moveList[this.#displayed - 1];
            if (move) {
                return !this.getPieceColorAt(move.getX2(), move.getY2());
            }
        }
        return this.#currentStartSFEN.split(' ')[1] === 'w';
    }

    setDisplayedPositionNumber(n) {
        let target;
        if (n < 0) target = 0;
        else if (n > this.#moveList.length) target = this.#moveList.length;
        else target = n;
        this.#displayed = target;
    }

    getDisplayedPosition() {
        return this.#displayed;
    }

    getGameLength() {
        return this.#moveList.length;
    }

    getCurrentStartSFEN() {
        return this.#currentStartSFEN;
    }

    getStartGame() {
        return this.#startGame;
    }

    getPromotionOffset() {
        return Board.#promotionOffset;
    }

    getCellAt(x, y) {
        if (!(this.isInBoardRange(x) && this.isInBoardRange(y))) return -1;
        return this.#board[y][x];
    }

    getPieceTypeAt(x, y) {
        if (!(this.isInBoardRange(x) && this.isInBoardRange(y))) return -1;
        return this.#board[y][x] & 511;
    }

    getPieceColorAt(x, y) {
        if (!(this.isInBoardRange(x) && this.isInBoardRange(y))) return -1;
        return this.#board[y][x] & 1024;
    }

    isValidPieceValue(value) {
        return (value >= 1 && value <= 39) || (value >= 1025 && value <= 1063);
    }

    isInBoardRange(n) {
        return n >= 0 && n <= 11;
    }

    isInSetupBoxRange(x, y) {
        return (x >= 100 && x <= 139) && (y >= 0 && y <= 1);
    }

    isPiecesOfDifferentColors(x1, y1, x2, y2) {
        if (!(this.isInBoardRange(x1) && this.isInBoardRange(y1) && this.isInBoardRange(x2) && this.isInBoardRange(y2))) return false;
        if (this.getCellAt(x1, y1) == 0 || this.getCellAt(x2, y2) == 0) return false;
        if (this.getPieceColorAt(x1, y1) == -1 || this.getPieceColorAt(x2, y2) == -1) return false;
        return this.getPieceColorAt(x1, y1) != this.getPieceColorAt(x2, y2);
    }

    isInMidpointBoardRange(n) {
        return n >= -1 && n <= 11;
    }

    getInfluenceAt(x, y) {
        if (!(this.isInBoardRange(x) && this.isInBoardRange(y))) return -1;
        return this.#influence[y][x];
    }

    // BOARD COORDINATE CONVERSION METHODS

    fileID(n) {
        return (12 - n);
    }

    rankID(n) {
        return String.fromCharCode((108 - n));
    }

    fileNumber(id) {
        return (12 - parseInt(id));
    }

    rankNumber(id) {
        return (108 - id.charCodeAt(0));
    }

    // GAME METHODS

    #clearMoveList() {
        this.#moveList.splice(0, this.#moveList.length);
    }

    setGame(gameString) {
        return this.#parseGame(gameString, true);
    }

    #parseGame(gameString, overrideGame) {
        // clear move list
        if (overrideGame) {
            this.#clearMoveList();
            this.#displayed = 0;
            this.setSFEN(this.#currentStartSFEN);
        }
        if (gameString === '') return 0;
        let parts = gameString.trim().replace(/\s+/g, " ").split(' ');

        let x1 = -1;
        let y1 = -1;
        let ex = -1;
        let ey = -1;
        let x2 = -1;
        let y2 = -1;
        let promotion = false;

        for (let i = 0; i < parts.length; ++i) {
            x1 = -1;
            y1 = -1;
            ex = -1;
            ey = -1;
            x2 = -1;
            y2 = -1;
            promotion = false;
            if (Board.#allowedMoveFormats.test(parts[i])) {
                // parse move
                let files = parts[i].replaceAll('+', '').replace(/[^0-9]/g, '|').replace(/\|+/g, '|').slice(0, -1).split('|');
                let ranks = parts[i].replaceAll('+', '').replace(/[^a-l]/g, '0').replace(/0+/g, '0').substring(1).split('0');
                if (files.length == 3 && ranks.length == 3) {
                    // Move with midpoint
                    x1 = this.fileNumber(files[0]);
                    y1 = this.rankNumber(ranks[0]);
                    ex = this.fileNumber(files[1]);
                    ey = this.rankNumber(ranks[1]);
                    x2 = this.fileNumber(files[2]);
                    y2 = this.rankNumber(ranks[2]);
                } else {
                    // Move without midpoint
                    x1 = this.fileNumber(files[0]);
                    y1 = this.rankNumber(ranks[0]);
                    ex = -1;
                    ey = -1;
                    x2 = this.fileNumber(files[1]);
                    y2 = this.rankNumber(ranks[1]);
                }

                if (parts[i].endsWith('+')) {
                    promotion = true;
                }

                // Ensure midpoint is not the same as the start or end coordinates
                if ((ex == x2 && ey == y2) || (ex == x1 && ey == y1)) {
                    ex = -1;
                    ey = -1;
                }
                // Ensure all coordinates are valid
                //ShowMessage();
                if (!(this.isInBoardRange(x1) && this.isInBoardRange(y1) && this.isInMidpointBoardRange(ex) && this.isInMidpointBoardRange(ey) && this.isInBoardRange(x2) && this.isInBoardRange(y2))) {
                    return 2;
                }
                // Ensure that a piece is on the start coordinates
                if (!this.isValidPieceValue(this.getCellAt(x1, y1))) {
                    return 3;
                }
                // Ensure start and end coordinates are not the same without a midpoint to move through
                if (x1 == x2 && y1 == y2 && ex == -1 && ey == -1) {
                    return 4;
                }
                // Ensure that the midpoint is vald
                if (ex != -1 && ey != -1 && !this.isValidMidpoint(x1, y1, ex, ey)) return 5;
                // Ensure that promotion is only used when appropriate
                if (promotion == true && !this.isPromotionEligible(x1, y1, ex, ey, x2, y2)) return 6;

                // Add move to move list
                if (overrideGame) {
                    if (!this.makeMove(x1, y1, ex, ey, x2, y2, promotion, true)) return 7;
                }
            } else {
                // Invalid move format
                return 1;
            }
        }
        return 0;
    }

    getGame() {
        let gameMoves = '';
        for (let i = 0; i < this.#moveList.length; ++i) {
            gameMoves += this.#moveList[i].toString();
            if (i < this.#moveList.length - 1) {
                gameMoves += ' ';
            }
        }
        return gameMoves;
    }

    getGameMoveListLength() {
        return this.#moveList.length;
    }

    getGameMove(n) {
        if (n < 0 || n >= this.#moveList.length) return null;
        return this.#moveList[n];
    }

    // PIECE MOVEMENT METHODS

    makeMove(x1, y1, ex, ey, x2, y2, promotion, addToMoveList) {
        if (!(this.isInBoardRange(x1) && this.isInBoardRange(y1) && this.isInMidpointBoardRange(ex) && this.isInMidpointBoardRange(ey) && this.isInBoardRange(x2) && this.isInBoardRange(y2)) && !(promotion === true || promotion === false)) {
            return false;
        }
        if (this.getCellAt(x1, y1) == 0) return false;
        if ((ex == x2 && ey == y2) || (ex == x1 && ey == y1)) {
            ex = -1;
            ey = -1;
        }
        this.generateLegalMoveList();
        if (!this.vetMove(x1, y1, ex, ey, x2, y2, promotion)) return false;

        let pieceType = this.getPieceTypeAt(x1, y1);
        let evicType = ((this.isInBoardRange(ex) && this.isInBoardRange(ey)) ? this.getPieceTypeAt(ex, ey) : 0);
        let victimType = this.getPieceTypeAt(x2, y2);

        if (this.isInBoardRange(ex) && this.isInBoardRange(ey)) {
            if (!this.isValidMidpoint(x1, y1, ex, ey)) return false;
        } else {
            if (x1 == x2 && y1 == y2) {
                return false;
            }
        }

        if (promotion === true && this.isPromotionEligible(x1, y1, ex, ey, x2, y2)) {
            if (pieceType >= 1 && pieceType <= 18) this.#board[y2][x2] = (this.#board[y1][x1] & 1024 | pieceType + Board.#promotionOffset);
            if (!(!this.#allowPositionSetup || this.#enforceRules) && pieceType >= 22 && pieceType <= 39) this.#board[y2][x2] = (this.#board[y1][x1] & 1024 | pieceType - Board.#promotionOffset);
        } else this.#board[y2][x2] = this.#board[y1][x1];
        if (x1 != x2 || y1 != y2) this.#board[y1][x1] = 0;
        if (this.isInBoardRange(ex) && this.isInBoardRange(ey) && (ex != x2 || ey != y2)) {
            this.#board[ey][ex] = 0;
        }

        let cStrikeX = -1;
        let cStrikeY = -1;
        if (pieceType != 20 && pieceType != 31) {
            if (evicType == 20 || evicType == 31) {
                cStrikeX = ex;
                cStrikeY = ey;
            }
            if (victimType == 20 || victimType == 31) {
                cStrikeX = x2;
                cStrikeY = y2;
            }
        }

        ++this.#displayed;
        if (addToMoveList) {
            this.#moveList.push(new GameMove(x1, y1, ex, ey, x2, y2, promotion, cStrikeX, cStrikeY, this.getSFEN().split(' ')[0], (this.#board[y2][x2] & 1024)));
        }
        return true;
    }

    // RULE ENFORCEMENT HELPER METHODS

    isValidMidpoint(x1, y1, ex, ey) {
        if (!(this.isInBoardRange(x1) && this.isInBoardRange(y1) && this.isInBoardRange(ex) && this.isInBoardRange(ey))) return false;
        if (this.getPieceTypeAt(x1, y1) != 0) {
            if ((!this.#allowPositionSetup || this.#enforceRules) && this.getCellAt(ex, ey) > 0 && !this.isPiecesOfDifferentColors(x1, y1, ex, ey)) return false;
            let pieceType = this.getPieceTypeAt(x1, y1);
            return (((pieceType == 20 || pieceType == 31) && (ex != x1 || ey != y1) && Math.abs(ex - x1) <= 1 && Math.abs(ey - y1) <= 1) || (pieceType == 38 && (ex - x1) == 0 && (ey - y1) == (this.getPieceColorAt(x1, y1) ? -1 : 1)) || (pieceType == 39 && Math.abs(ex - x1) == 1 && (ey - y1) == (this.getPieceColorAt(x1, y1) ? -1 : 1)));
        }
    }

    isPromotionEligible(x1, y1, epx, epy, x2, y2) {
        let ex = epx;
        let ey = epy;
        if ((epx == x2 && epy == y2) || (epx == x1 && epy == y1)) {
            ex = -1;
            ey = -1;
        }
        let pieceType = this.getPieceTypeAt(x1, y1);
        let pieceColor = this.getPieceColorAt(x1, y1);
        let evicType = ((this.isInBoardRange(ex) && this.isInBoardRange(ey)) ? this.getPieceTypeAt(ex, ey) : 0);
        let victimType = this.getPieceTypeAt(x2, y2);

        if (pieceType == 0 || (pieceType >= 19 && pieceType <= 21)) return false;
        if (pieceType >= 22 && pieceType <= 39 && (!this.#allowPositionSetup || this.#enforceRules)) return false;

        if ((pieceType == 1 || (pieceType == 11 && this.#trappedLancesMayPromote)) && this.#lastRankTest(y2, pieceColor)) return true;
        if (!this.#promotionZoneTest(y1, pieceColor) && this.#promotionZoneTest(y2, pieceColor)) return true;
        if (this.#promotionZoneTest(y1, pieceColor) && ((victimType > 0 && (x1 != x2 || y1 != y2)) || evicType > 0)) return true;
        return false;
    }

    #lastRankTest(y, pieceColor) {
        return (y == (pieceColor ? 0 : 11));
    }

    #promotionZoneTest(y, pieceColor) {
        return (y >= (pieceColor ? 0 : 8) && y <= (pieceColor ? 3 : 11));
    }

    // CLICK SELECTION METHODS

    // Selects a piece on the board at the given coordinates.
    selectPiece(x, y) {
        if (this.isInBoardRange(x) && this.isInBoardRange(y)) {
            this.#selectedX = x;
            this.#selectedY = y;
        } else {
            this.#selectedX = -1;
            this.#selectedY = -1;
        }
    }

    selectSetupBoxPiece(x, y) {
        if (this.isInSetupBoxRange(x, y)) {
            this.#selectedX = x;
            this.#selectedY = y;
        } else {
            this.#selectedX = -1;
            this.#selectedY = -1;
        }
    }

    setCell(x, y, value) {
        if (this.isInBoardRange(x) && this.isInBoardRange(y) && (value == 0 || this.isValidPieceValue(value))) {
            this.#board[y][x] = value;
        } else {
            this.#board[y][x] = 0;
        }
    }

    setSetupCounterStrike(x, y) {
        if (this.isInMidpointBoardRange(x) && this.isInMidpointBoardRange(y)) {
            this.#setupCounterStrikeX = x;
            this.#setupCounterStrikeY = y;
        } else {
            this.#setupCounterStrikeX = -2;
            this.#setupCounterStrikeY = -2;
        }
    }

    // Selects a midpoint on the board at the given coordinates. This square is paassed through when moving a piece via a double move.
    selectMidpoint(x, y) {
        if (this.isInBoardRange(x) && this.isInBoardRange(y) && this.isValidMidpoint(this.#selectedX, this.#selectedY, x, y)) {
            this.#midpointX = x;
            this.#midpointY = y;
        } else {
            this.#midpointX = -1;
            this.#midpointY = -1;
        }
    }

    // Sets the coordinates of the prompt square. Prompts are displayed whenever a move has multiple outcomes.
    setPrompt(x, y) {
        if (this.isInBoardRange(x) && this.isInBoardRange(y)) {
            this.#promptX = x;
            this.#promptY = y;
        } else {
            this.#promptX = -1;
            this.#promptY = -1;
        }
    }

    // Clears the current selection.
    clearSelection() {
        this.#selectedX = -1;
        this.#selectedY = -1;
        this.#midpointX = -1;
        this.#midpointY = -1;
        this.#promptX = -1;
        this.#promptY = -1;
        this.#setupCounterStrikeX = -2;
        this.#setupCounterStrikeY = -2;
    }

    clearMidpoint() {
        this.#midpointX = -1;
        this.#midpointY = -1;
    }

    hasSelection() {
        return this.isInBoardRange(this.#selectedX) && this.isInBoardRange(this.#selectedY);
    }

    hasSetupBoxSelection() {
        return this.isInSetupBoxRange(this.#selectedX, this.#selectedY);
    }

    hasMidpoint() {
        return this.isInBoardRange(this.#midpointX) && this.isInBoardRange(this.#midpointY);
    }

    hasPrompt() {
        return this.isInBoardRange(this.#promptX) && this.isInBoardRange(this.#promptY);
    }

    getSelectedX() {
        return this.#selectedX;
    }

    getSelectedY() {
        return this.#selectedY;
    }

    getMidpointX() {
        return this.#midpointX;
    }

    getMidpointY() {
        return this.#midpointY;
    }

    getPromptX() {
        return this.#promptX;
    }

    getPromptY() {
        return this.#promptY;
    }

    // RULE ENFORCEMENT METHODS

    #isLion(x, y) {
        return this.getPieceTypeAt(x, y) == 20 || this.getPieceTypeAt(x, y) == 31;
    }

    #isNonAdjacentCoordPair(x1, y1, x2, y2) {
        let dx = x2 - x1;
        let dy = y2 - y1;
        return Math.abs(dx) > 1 || Math.abs(dy) > 1;
    }

    generateLegalMoveList() {
        this.#legalMoveList.splice(0, this.#legalMoveList.length);
        for (let i = 0; i < 12; ++i) {
            for (let j = 0; j < 12; ++j) {
                if (this.getCellAt(j, i) == 0) continue;
                if (this.getPlayerToMove() ? !this.getPieceColorAt(j, i) : this.getPieceColorAt(j, i)) continue;
                this.#generateLegalMoves(j, i, -1, -1);
                if (this.#isLion(j, i)) {
                    let dx = [-1, 0, 1, -1, 1, -1, 0, 1];
                    let dy = [1, 1, 1, 0, 0, -1, -1, -1];
                    for (let k = 0; k < 8; ++k) {
                        let mx = j + dx[k];
                        let my = i + dy[k];
                        for (let l = 0; l < 8; ++l) {
                            let fx = mx + dx[l];
                            let fy = my + dy[l];
                            this.#addLegalMove(j, i, mx, my, fx, fy);
                        }
                    }
                } else if (this.getPieceTypeAt(j, i) == 38) {
                    let my = i + (this.getPieceColorAt(j, i) ? -1 : 1);
                    let dy = [1, -1];
                    for (let l = 0; l < 2; ++l) {
                        let fy = my + dy[l];
                        this.#addLegalMove(j, i, j, my, j, fy);
                    }
                } else if (this.getPieceTypeAt(j, i) == 39) {
                    let my0 = (this.getPieceColorAt(j, i) ? -1 : 1);
                    let my = i + my0;
                    let mx = j + 1;
                    let dx = [1, -1];
                    let dy = [my0, (-1 * my0)];
                    for (let l = 0; l < 2; ++l) {
                        let fx = mx + dx[l];
                        let fy = my + dy[l];
                        this.#addLegalMove(j, i, mx, my, fx, fy);
                    }
                    mx = j - 1;
                    dx = [-1, 1];
                    dy = [my0, (-1 * my0)];
                    for (let l = 0; l < 2; ++l) {
                        let fx = mx + dx[l];
                        let fy = my + dy[l];
                        this.#addLegalMove(j, i, mx, my, fx, fy);
                    }
                }
            }
        }
    }

    #generateLegalMoves(x, y, mx, my) {
        let legal = Board.getLegalMoves(this.getPieceTypeAt(x, y));
        let h = [legal[0], legal[1], legal[2], legal[3], legal[4], legal[5], legal[6], legal[7]];
        let dx = [-1, 0, 1, -1, 1, -1, 0, 1];
        let dy = [1, 1, 1, 0, 0, -1, -1, -1];
        let hx;
        let hy;
        if (this.getPieceColorAt(x, y)) { for (let i = 0; i < 8; ++i) { dx[i] *= -1; dy[i] *= -1; } }
        for (let i = 7; i >= 0; --i) {
            if (h[i] == 1) { // Step
                hx = x + dx[i];
                hy = y + dy[i];
                this.#addLegalMove(x, y, mx, my, hx, hy);
            }
            else if (h[i] == 2) { // Linear Jump
                hx = x + (dx[i] * 2);
                hy = y + (dy[i] * 2);
                this.#addLegalMove(x, y, mx, my, hx, hy);
            }
            else if (h[i] == 3) { // Slide
                this.#addLegalMoveSlide(x, y, x, y, dx[i], dy[i]);
            }
            else if (h[i] == 4) { // Linear Lion Move
                hx = x + (dx[i] * 2);
                hy = y + (dy[i] * 2);
                this.#addLegalMove(x, y, mx, my, hx, hy);
                hx = x + dx[i];
                hy = y + dy[i];
                this.#addLegalMove(x, y, mx, my, hx, hy);
            }
            else if (h[i] == 5) { // Full Lion Move
                hx = x + (dx[i] * 2);
                hy = y + (dy[i] * 2);
                this.#addLegalMove(x, y, mx, my, hx, hy);
                hx = x + dx[i];
                hy = y + dy[i];
                this.#addLegalMove(x, y, mx, my, hx, hy);
                // Vertical Knight Jumps
                if (dx[i] == 0) {
                    hx = x + 1;
                    hy = y + (dy[i] * 2);
                    this.#addLegalMove(x, y, mx, my, hx, hy);
                    hx = x - 1;
                    this.#addLegalMove(x, y, mx, my, hx, hy);
                }
                // Horizontal Knight Jumps
                if (dy[i] == 0) {
                    hx = x + (dx[i] * 2);
                    hy = y + 1;
                    this.#addLegalMove(x, y, mx, my, hx, hy);
                    hy = y - 1;
                    this.#addLegalMove(x, y, mx, my, hx, hy);
                }
            }
        }
    }

    #addLegalMoveSlide(x, y, ox, oy, dx, dy) {
        let hx = x + dx;
        let hy = y + dy;
        this.#addLegalMove(ox, oy, -1, -1, hx, hy)
        if (this.getCellAt(hx, hy) == 0) {
            this.#addLegalMoveSlide(hx, hy, ox, oy, dx, dy);
        }
    }

    #addLegalMove(ox, oy, mx, my, hx, hy) {
        if (this.vetPotentialMove(ox, oy, mx, my, hx, hy, false, false)) {
            this.#legalMoveList.push(new LegalMove(ox, oy, mx, my, hx, hy, false));
        }
        if (this.vetPotentialMove(ox, oy, mx, my, hx, hy, true, false)) {
            this.#legalMoveList.push(new LegalMove(ox, oy, mx, my, hx, hy, true));
        }
    }

    vetPotentialMove(ox, oy, mx, my, hx, hy, promotion, isHighlight) {
        if (!this.isInBoardRange(ox) || !this.isInBoardRange(oy) || !this.isInMidpointBoardRange(mx) || !this.isInMidpointBoardRange(my) || !this.isInBoardRange(hx) || !this.isInBoardRange(hy)) return;
        if (!this.isPiecesOfDifferentColors(ox, oy, hx, hy) && this.getCellAt(hx, hy) != 0 && !(hx == ox && hy == oy)) return false;

        if (promotion && !this.isPromotionEligible(ox, oy, mx, my, hx, hy)) {
            return false;
        }

        if (isHighlight && this.isValidMidpoint(ox, oy, hx, hy) && !this.isInBoardRange(mx) && !this.isInBoardRange(my)) {
            if (this.#isLion(ox, oy)) {
                let dx = [0, -1, 0, 1, -1, 1, -1, 0, 1];
                let dy = [0, 1, 1, 1, 0, 0, -1, -1, -1];
                if (this.getPieceColorAt(ox, oy)) { for (let i = 0; i < 9; ++i) { dx[i] *= -1; dy[i] *= -1; } }
                let invalidDoubleMoves = 0;
                for (let i = 0; i < 9; ++i) {
                    let dhx = hx + dx[i];
                    let dhy = hy + dy[i];
                    if (!this.vetPotentialMove(ox, oy, hx, hy, dhx, dhy, false, false)) ++invalidDoubleMoves;
                }
                if (invalidDoubleMoves == 9) {
                    return this.#isInCheck(this.getPieceColorAt(ox, oy));
                }
            } else if (this.getPieceTypeAt(ox, oy) == 38) {
                let dy = [0, 1, -1];
                if (this.getPieceColorAt(ox, oy)) { for (let i = 0; i < 3; ++i) { dy[i] *= -1; } }
                let invalidDoubleMoves = 0;
                for (let i = 0; i < 3; ++i) {
                    let dhx = hx;
                    let dhy = hy + dy[i];
                    if (!this.vetPotentialMove(ox, oy, hx, hy, dhx, dhy, false, false)) ++invalidDoubleMoves;
                }
                if (invalidDoubleMoves == 3) {
                    return this.#isInCheck(this.getPieceColorAt(ox, oy));
                }
            } else if (this.getPieceTypeAt(ox, oy) == 39 && (hx - ox) == (this.getPieceColorAt(ox, oy) ? -1 : 1) && (hy - oy) == (this.getPieceColorAt(ox, oy) ? -1 : 1)) {
                let dx = [0, 1, -1];
                let dy = [0, 1, -1];
                if (this.getPieceColorAt(ox, oy)) { for (let i = 0; i < 3; ++i) { dx[i] *= -1; dy[i] *= -1; } }
                let invalidDoubleMoves = 0;
                for (let i = 0; i < 3; ++i) {
                    let dhx = hx + dx[i];
                    let dhy = hy + dy[i];
                    if (!this.vetPotentialMove(ox, oy, hx, hy, dhx, dhy, false, false)) ++invalidDoubleMoves;
                }
                if (invalidDoubleMoves == 3) {
                    return this.#isInCheck(this.getPieceColorAt(ox, oy));
                }
            } else if (this.getPieceTypeAt(ox, oy) == 39 && (hx - ox) == (this.getPieceColorAt(ox, oy) ? 1 : -1) && (hy - oy) == (this.getPieceColorAt(ox, oy) ? -1 : 1)) {
                let dx = [0, -1, 1];
                let dy = [0, 1, -1];
                if (this.getPieceColorAt(ox, oy)) { for (let i = 0; i < 3; ++i) { dx[i] *= -1; dy[i] *= -1; } }
                let invalidDoubleMoves = 0;
                for (let i = 0; i < 3; ++i) {
                    let dhx = hx + dx[i];
                    let dhy = hy + dy[i];
                    if (!this.vetPotentialMove(ox, oy, hx, hy, dhx, dhy, false, false)) ++invalidDoubleMoves;
                }
                if (invalidDoubleMoves == 3) {
                    return this.#isInCheck(this.getPieceColorAt(ox, oy));
                }
            }
        } else {
            let resultingPosition = this.getPotentialMoveSFEN(ox, oy, mx, my, hx, hy, promotion);
            if (resultingPosition == this.getCurrentStartSFEN()) {
                return this.#isInCheck(this.getPieceColorAt(ox, oy));
            }
            for (let i = 1; i < this.getDisplayedPosition(); ++i) {
                if (resultingPosition == this.getGameMove(i - 1).getSFEN()) {
                    return this.#isInCheck(this.getPieceColorAt(ox, oy));
                }
            }
        }

        if (this.#isLion(hx, hy) && this.#isLion(ox, oy)) { // Bridge-capture
            let midpointType = this.getPieceTypeAt(mx, my);
            // Lion-trading Rules
            if (this.#isNonAdjacentCoordPair(ox, oy, hx, hy) && midpointType <= 2) {
                if (this.#protectionTest(ox, oy, hx, hy, mx, my)) return false;
                if (this.#renmeiBridgeCaptureRule) {
                    if (this.#protectedByLeaper(hx, hy, -1, -1, 0, 1, [1, 2])) return false;
                    else if (this.#protectedByLeaper(hx, hy, -1, -1, 0, -1, [2])) return false;
                }
            }
        } else if ((this.#isLion(hx, hy) || this.#isLion(mx, my)) && !this.#isLion(ox, oy)) {
            if (this.isInBoardRange(this.counterStrikeX()) && this.isInBoardRange(this.counterStrikeY())) {
                if (!((this.counterStrikeX() == hx && this.counterStrikeY() == hy) || (this.counterStrikeX() == mx && this.counterStrikeY() == my))) {
                    if (this.#okazakiRule) {
                        if (isHighlight && this.isValidMidpoint(ox, oy, hx, hy) && !this.isInBoardRange(mx) && !this.isInBoardRange(my)) {
                            let iguiDestProtected = this.#protectionTest(ox, oy, ox, oy, hx, hy);
                            let midpointDestProtected = this.#protectionTest(ox, oy, hx, hy, -1, -1);
                            let jx = ox + (2 * (hx - ox));
                            let jy = oy + (2 * (hy - oy));
                            let jumpDestProtected = this.#protectionTest(ox, oy, jx, jy, hx, hy);
                            if (iguiDestProtected && midpointDestProtected && jumpDestProtected) return;
                        } else if (this.#protectionTest(ox, oy, hx, hy, mx, my)) {
                            return false;
                        }
                    } else {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    // Protection Test

    #protectionTest(ox, oy, x, y, skipX, skipY) {
        // Step
        if (this.#protectedByLeaper(ox, oy, x, y, skipX, skipY, -1, 1, [3, 4, 5, 6, 7, 8, 10, 18, 20, 21, 22, 23, 28, 29, 31, 37, 39])) return true;
        else if (this.#protectedByLeaper(ox, oy, x, y, skipX, skipY, 0, 1, [1, 2, 3, 4, 5, 6, 8, 9, 13, 17, 20, 21, 22, 23, 24, 29, 31, 36, 38])) return true;
        else if (this.#protectedByLeaper(ox, oy, x, y, skipX, skipY, 1, 1, [3, 4, 5, 6, 7, 8, 10, 18, 20, 21, 22, 23, 28, 29, 31, 37, 39])) return true;
        else if (this.#protectedByLeaper(ox, oy, x, y, skipX, skipY, -1, 0, [5, 7, 8, 9, 14, 17, 20, 21, 22, 23, 25, 28, 29, 31, 36])) return true;
        else if (this.#protectedByLeaper(ox, oy, x, y, skipX, skipY, 1, 0, [5, 7, 8, 9, 14, 17, 20, 21, 22, 23, 25, 28, 29, 31, 36])) return true;
        else if (this.#protectedByLeaper(ox, oy, x, y, skipX, skipY, -1, -1, [4, 6, 7, 8, 10, 18, 20, 21, 23, 28, 29, 31, 37])) return true;
        else if (this.#protectedByLeaper(ox, oy, x, y, skipX, skipY, 0, -1, [2, 3, 5, 6, 7, 9, 13, 17, 20, 21, 22, 24, 29, 31, 36])) return true;
        else if (this.#protectedByLeaper(ox, oy, x, y, skipX, skipY, 1, -1, [4, 6, 7, 8, 10, 18, 20, 21, 23, 28, 29, 31, 37])) return true;

        // Linear Jump
        else if (this.#protectedByLeaper(ox, oy, x, y, skipX, skipY, -2, 2, [9, 20, 31, 39])) return true;
        else if (this.#protectedByLeaper(ox, oy, x, y, skipX, skipY, 0, 2, [10, 20, 31, 38])) return true;
        else if (this.#protectedByLeaper(ox, oy, x, y, skipX, skipY, 2, 2, [9, 20, 31, 39])) return true;
        else if (this.#protectedByLeaper(ox, oy, x, y, skipX, skipY, -2, 0, [10, 20, 31])) return true;
        else if (this.#protectedByLeaper(ox, oy, x, y, skipX, skipY, 2, 0, [10, 20, 31])) return true;
        else if (this.#protectedByLeaper(ox, oy, x, y, skipX, skipY, -2, -2, [9, 20, 31])) return true;
        else if (this.#protectedByLeaper(ox, oy, x, y, skipX, skipY, 0, -2, [10, 20, 31])) return true;
        else if (this.#protectedByLeaper(ox, oy, x, y, skipX, skipY, 2, -2, [9, 20, 31])) return true;

        // Knight Jump
        else if (this.#protectedByLeaper(ox, oy, x, y, skipX, skipY, -1, 2, [20, 31])) return true;
        else if (this.#protectedByLeaper(ox, oy, x, y, skipX, skipY, 1, 2, [20, 31])) return true;
        else if (this.#protectedByLeaper(ox, oy, x, y, skipX, skipY, -2, 1, [20, 31])) return true;
        else if (this.#protectedByLeaper(ox, oy, x, y, skipX, skipY, 2, 1, [20, 31])) return true;
        else if (this.#protectedByLeaper(ox, oy, x, y, skipX, skipY, -2, -1, [20, 31])) return true;
        else if (this.#protectedByLeaper(ox, oy, x, y, skipX, skipY, 2, -1, [20, 31])) return true;
        else if (this.#protectedByLeaper(ox, oy, x, y, skipX, skipY, -1, -2, [20, 31])) return true;
        else if (this.#protectedByLeaper(ox, oy, x, y, skipX, skipY, 1, -2, [20, 31])) return true;

        // Slide
        else if (this.#protectedBySlider(ox, oy, x, y, 1, skipX, skipY, -1, 1, [15, 17, 19, 27, 30, 32, 34, 35, 36, 38])) return true;
        else if (this.#protectedBySlider(ox, oy, x, y, 1, skipX, skipY, 0, 1, [11, 12, 14, 16, 18, 19, 25, 26, 28, 30, 32, 33, 35, 37, 39])) return true;
        else if (this.#protectedBySlider(ox, oy, x, y, 1, skipX, skipY, 1, 1, [15, 17, 19, 27, 30, 32, 34, 35, 36, 38])) return true;
        else if (this.#protectedBySlider(ox, oy, x, y, 1, skipX, skipY, -1, 0, [13, 16, 18, 19, 24, 26, 30, 34, 37, 38, 39])) return true;
        else if (this.#protectedBySlider(ox, oy, x, y, 1, skipX, skipY, 1, 0, [13, 16, 18, 19, 24, 26, 30, 34, 37, 38, 39])) return true;
        else if (this.#protectedBySlider(ox, oy, x, y, 1, skipX, skipY, -1, -1, [15, 17, 19, 27, 30, 33, 34, 35, 36, 38, 39])) return true;
        else if (this.#protectedBySlider(ox, oy, x, y, 1, skipX, skipY, 0, -1, [12, 14, 16, 18, 19, 25, 26, 28, 30, 32, 33, 35, 37, 38, 39])) return true;
        else if (this.#protectedBySlider(ox, oy, x, y, 1, skipX, skipY, 1, -1, [15, 17, 19, 27, 30, 33, 34, 35, 36, 38, 39])) return true;

        else return false;
    }

    #protectedByLeaper(ox, oy, x, y, skipX, skipY, dx, dy, protectors) {
        let c = ((this.getPieceColorAt(x, y)) ? 1 : -1);
        let ax = x + (c * dx);
        let ay = y + (c * dy);
        if (!this.isInBoardRange(ox) || !this.isInBoardRange(oy) || !this.isInBoardRange(x) || !this.isInBoardRange(y) || !this.isInMidpointBoardRange(skipX) || !this.isInMidpointBoardRange(skipY) || !this.isInBoardRange(ax) || !this.isInBoardRange(ay)) return false;

        let isProtected = (((ax != skipX || ay != skipY) && (ax != ox || ay != oy)) && (this.getCellAt(ax, ay) > 0) && (this.#isAlliedPiece(ox, oy, x, y, ax, ay) && (this.binarySearch(protectors, this.getPieceTypeAt(ax, ay))) != -1));
        return isProtected;
    }

    #protectedBySlider(ox, oy, x, y, distance, skipX, skipY, dx, dy, protectors) {
        let c = ((this.getPieceColorAt(x, y)) ? 1 : -1);
        let ax = x + (c * distance * dx);
        let ay = y + (c * distance * dy);
        if (!this.isInBoardRange(ox) || !this.isInBoardRange(oy) || !this.isInBoardRange(x) || !this.isInBoardRange(y) || !this.isInMidpointBoardRange(skipX) || !this.isInMidpointBoardRange(skipY) || !this.isInBoardRange(ax) || !this.isInBoardRange(ay)) return false;

        let isProtected = (((ax != skipX || ay != skipY) && (ax != ox || ay != oy)) && (this.getCellAt(ax, ay) > 0) && (this.#isAlliedPiece(ox, oy, x, y, ax, ay) && (this.binarySearch(protectors, this.getPieceTypeAt(ax, ay))) != -1));
        if (isProtected) return true;
        else if ((this.getCellAt(ax, ay) == 0) || (ax == skipX && ay == skipY) || (ax == ox && ay == oy)) return this.#protectedBySlider(ox, oy, x, y, (distance + 1), skipX, skipY, dx, dy, protectors);
    }

    #isAlliedPiece(ox, oy, x, y, ax, ay) {
        if (x == ox && y == oy && this.isPiecesOfDifferentColors(x, y, ax, ay)) {
            return this.isPiecesOfDifferentColors(x, y, ax, ay);
        } else {
            return !this.isPiecesOfDifferentColors(x, y, ax, ay);
        }
    }

    // Check Test (Used to enforce repetition rules)
    isInCheck(color) { return this.#isInCheck(color); }
    countKings(color) { return this.#countRoyals(color)}

    #isInCheck(color) {
        if (this.#forbidAllRepeats) return false; // No need to est for check if all repeats are forbidden
        let playerToMove = color ? 1 : 0;
        let royalCount = this.#countRoyals(playerToMove);
        if (royalCount == 0) return false; // No royals left, no check
        if (royalCount > 1) return false; // More than one royal left, no check
        // Find the royal
        let pieceType;
        let pieceColor;
        let royalX;
        let royalY;
        for (let i = 0; i < 12; ++i) {
            for (let j = 0; j < 12; ++j) {
                pieceType = this.getPieceTypeAt(j, i);
                pieceColor = this.getPieceColorAt(j, i) ? 1 : 0;
                if ((pieceType == 21 || pieceType == 29) && pieceColor == playerToMove) {
                    royalX = j;
                    royalY = i;
                }
            }
        }
        // Check if the royal is in check, return the result
        return this.#checkTest(royalX, royalY, color);
    }

    #countRoyals(color) {
        let count = 0;
        let pieceType;
        let pieceColor;
        for (let i = 0; i < 12; ++i) {
            for (let j = 0; j < 12; ++j) {
                pieceType = this.getPieceTypeAt(j, i);
                pieceColor = this.getPieceColorAt(j, i) ? 1 : 0;
                if ((pieceType == 21 || pieceType == 29) && pieceColor == color) {
                    ++count;
                }
            }
        }
        return count;
    }

    #checkTest(ox, oy, color) {
        if (color) {
            return this.#influence[oy][ox] == 1 || this.#influence[oy][ox] == 3;
        } else {
            return this.#influence[oy][ox] == 2 || this.#influence[oy][ox] == 3;
        }
    }


    // Get SFEN that would result from a move.

    getPotentialMoveSFEN(x1, y1, ex, ey, x2, y2, promotion) {
        let board2 = new Array(12);
        for (let i = 0; i < 12; ++i) {
            board2[i] = new Array(12);
        }

        for (let i = 0; i < 12; ++i) {
            for (let j = 0; j < 12; ++j) {
                board2[i][j] = this.#board[i][j];
            }
        }

        let pieceType = board2[y1][x1] & 511;
        let pieceColor = board2[y1][x1] & 1024;

        if (promotion === true && this.isPromotionEligible(x1, y1, ex, ey, x2, y2)) {
            if (pieceType >= 1 && pieceType <= 18) board2[y2][x2] = (board2[y1][x1] & 1024 | pieceType + Board.#promotionOffset);
        } else if (x1 != x2 || y1 != y2) { board2[y2][x2] = board2[y1][x1]; board2[y1][x1] = 0; }
        if (this.isInBoardRange(ex) && this.isInBoardRange(ey) && (ex != x2 || ey != y2)) {
            board2[ey][ex] = 0;
        }

        let fenCode = "";
        let emptySquareRowLength = 0;
        for (let i = 11; i >= 0; --i) {
            for (let j = 0; j <= 11; ++j) {
                let pType = (board2[i][j] & 511);
                let pColor = (board2[i][j] & 1024) ? 1 : 0;
                if (pType == 0) {
                    ++emptySquareRowLength;
                    if (j == 11) {
                        if (emptySquareRowLength > 0) { fenCode += emptySquareRowLength.toString(); }
                        emptySquareRowLength = 0;
                    }
                } else {
                    if (emptySquareRowLength > 0) { fenCode += emptySquareRowLength.toString(); }
                    emptySquareRowLength = 0;
                    let pieceID = (pColor) ? Board.#ids[pType].toLowerCase() : Board.#ids[pType].toUpperCase();
                    fenCode += pieceID;
                }
            }
            if (i > 0) { fenCode += '/'; }
        }

        fenCode += ' ' + (pieceColor ? 'b' : 'w');

        fenCode += ' -';

        return fenCode;
    }

    vetMove(x1, y1, ex, ey, x2, y2, promotion) {
        if ((ex == x2 && ey == y2) || (ex == x1 && ey == y1)) {
            ex = -1;
            ey = -1;
        }
        if (!this.#enforceRules) return true;
        for (let i = 0; i < this.#legalMoveList.length; ++i) {
            if (this.#legalMoveList[i].equals(x1, y1, ex, ey, x2, y2, promotion)) return true;
        }
        return false;
    }

    // INFLUENCE DISPLAY METHODS
    generateInfluenceMap() {
        for (let i = 0; i < 12; ++i) {
            for (let j = 0; j < 12; ++j) {
                this.#influence[i][j] = 0;
            }
        }
        for (let i = 0; i < 12; ++i) {
            for (let j = 0; j < 12; ++j) {
                if (this.getPieceTypeAt(j, i) == 0) continue;
                if (((j == this.getSelectedX() && i == this.getSelectedY()) || (j == this.getMidpointX() && i == this.getMidpointY()))) continue;
                this.#populateInfluence(j, i);
            }
        }
    }

    #populateInfluence(x, y) {
        let legal = Board.getLegalMoves(this.getPieceTypeAt(x, y));
        let hi = [legal[0], legal[1], legal[2], legal[3], legal[4], legal[5], legal[6], legal[7]];
        let dx = [-1, 0, 1, -1, 1, -1, 0, 1];
        let dy = [1, 1, 1, 0, 0, -1, -1, -1];
        let hix;
        let hiy;
        if (this.getPieceColorAt(x, y)) { for (let i = 0; i < 8; ++i) { dx[i] *= -1; dy[i] *= -1; } }
        for (let i = 7; i >= 0; --i) {
            if (hi[i] == 1) { // Step
                hix = x + dx[i];
                hiy = y + dy[i];
                this.#populateInfluenceCell(x, y, hix, hiy);
            }
            else if (hi[i] == 2) { // Linear Jump
                hix = x + (dx[i] * 2);
                hiy = y + (dy[i] * 2);
                this.#populateInfluenceCell(x, y, hix, hiy);
            }
            else if (hi[i] == 3) { // Slide
                this.#populateInfluenceSlide(x, y, x, y, dx[i], dy[i]);
            }
            else if (hi[i] == 4) { // Linear Lion Move
                hix = x + (dx[i] * 2);
                hiy = y + (dy[i] * 2);
                this.#populateInfluenceCell(x, y, hix, hiy);
                hix = x + dx[i];
                hiy = y + dy[i];
                this.#populateInfluenceCell(x, y, hix, hiy);
            }
            else if (hi[i] == 5) { // Full Lion Move
                hix = x + (dx[i] * 2);
                hiy = y + (dy[i] * 2);
                this.#populateInfluenceCell(x, y, hix, hiy);
                hix = x + dx[i];
                hiy = y + dy[i];
                this.#populateInfluenceCell(x, y, hix, hiy);
                // Vertical Knight Jumps
                if (dx[i] == 0) {
                    hix = x + 1;
                    hiy = y + (dy[i] * 2);
                    this.#populateInfluenceCell(x, y, hix, hiy);
                    hix = x - 1;
                    this.#populateInfluenceCell(x, y, hix, hiy);
                }
                // Horizontal Knight Jumps
                if (dy[i] == 0) {
                    hix = x + (dx[i] * 2);
                    hiy = y + 1;
                    this.#populateInfluenceCell(x, y, hix, hiy);
                    hiy = y - 1;
                    this.#populateInfluenceCell(x, y, hix, hiy);
                }
            }
        }
    }

    #populateInfluenceCell(x, y, hx, hy) {
        if (!(x < 0 || x > 11 || y < 0 || y > 11) && !(hx < 0 || hx > 11 || hy < 0 || hy > 11)) {
            if (!(this.getPieceColorAt(x, y)) && (this.#influence[hy][hx] == 0 || this.#influence[hy][hx] == 2)) this.#influence[hy][hx] += 1;
            else if ((this.getPieceColorAt(x, y)) && (this.#influence[hy][hx] == 0 || this.#influence[hy][hx] == 1)) this.#influence[hy][hx] += 2;
        }
    }

    #populateInfluenceSlide(x, y, ox, oy, dx, dy) {
        let hix = x + dx;
        if (!this.isInBoardRange(hix)) hix = -1;
        let hiy = y + dy;
        if (!this.isInBoardRange(hiy)) hiy = -1;
        if ((hix != -1 && hiy != -1)) {
            this.#populateInfluenceCell(ox, oy, hix, hiy);
            if (this.getCellAt(hix, hiy) == 0 || (((hix == this.getSelectedX() && hiy == this.getSelectedY()) || (hix == this.getMidpointX() && hiy == this.getMidpointY())))) this.#populateInfluenceSlide(hix, hiy, ox, oy, dx, dy);
        }
    }
}

// Stores a single legal move in the legal move list.
class LegalMove {
    #x1;
    #y1;
    #ex;
    #ey;
    #x2;
    #y2;
    #promotion;
    constructor(x1, y1, ex, ey, x2, y2, promotion) {
        this.#x1 = Math.max(0, Math.min(11, Math.floor(x1)));
        this.#y1 = Math.max(0, Math.min(11, Math.floor(y1)));
        this.#ex = Math.max(-1, Math.min(11, Math.floor(ex)));
        this.#ey = Math.max(-1, Math.min(11, Math.floor(ey)));
        this.#x2 = Math.max(0, Math.min(11, Math.floor(x2)));
        this.#y2 = Math.max(0, Math.min(11, Math.floor(y2)));
        this.#promotion = (promotion === true);
    }
    equals(x1, y1, ex, ey, x2, y2, promotion) {
        return this.#x1 == x1 && this.#y1 == y1 && this.#ex == ex && this.#ey == ey && this.#x2 == x2 && this.#y2 == y2 && this.#promotion == promotion;
    }
    toString() {
        let ox = (12 - this.#x1);
        let oy = String.fromCharCode((108 - this.#y1));
        let epx = (this.#ex != -1) ? (12 - this.#ex) : '';
        let epy = (this.#ey != -1) ? String.fromCharCode((108 - this.#ey)) : '';
        let dx = (12 - this.#x2);
        let dy = String.fromCharCode((108 - this.#y2));
        let promo = (this.#promotion) ? '+' : '';
        return ox + oy + epx + epy + dx + dy + promo;
    }
}

// Stores a single move in the game.
class GameMove {
    #x1;
    #y1;
    #ex;
    #ey;
    #x2;
    #y2;
    #promotion;
    #counterStrikeX;
    #counterStrikeY;
    #positionData;
    #playerWhoMoved;
    constructor(x1, y1, ex, ey, x2, y2, promotion, counterStrikeX, counterStrikeY, positionData, playerWhoMoved) {
        this.#x1 = Math.max(0, Math.min(11, Math.floor(x1)));
        this.#y1 = Math.max(0, Math.min(11, Math.floor(y1)));
        this.#ex = Math.max(-1, Math.min(11, Math.floor(ex)));
        this.#ey = Math.max(-1, Math.min(11, Math.floor(ey)));
        this.#x2 = Math.max(0, Math.min(11, Math.floor(x2)));
        this.#y2 = Math.max(0, Math.min(11, Math.floor(y2)));
        this.#promotion = (promotion === true);
        this.#counterStrikeX = Math.max(-1, Math.min(11, Math.floor(counterStrikeX)));
        this.#counterStrikeY = Math.max(-1, Math.min(11, Math.floor(counterStrikeY)));
        this.#positionData = positionData;
        this.#playerWhoMoved = playerWhoMoved;
    }

    getX1() {
        return this.#x1;
    }
    getY1() {
        return this.#y1;
    }
    getEX() {
        return this.#ex;
    }
    getEY() {
        return this.#ey;
    }
    getX2() {
        return this.#x2;
    }
    getY2() {
        return this.#y2;
    }
    getPromotion() {
        return this.#promotion;
    }
    getCounterStrikeX() {
        return this.#counterStrikeX;
    }
    getCounterStrikeY() {
        return this.#counterStrikeY;
    }
    getSFEN() {
        let csTab = ' -';
        let cx = (12 - this.#counterStrikeX);
        let cy = String.fromCharCode((108 - this.#counterStrikeY));
        if (this.#counterStrikeX != -1 && this.#counterStrikeY != -1) csTab = ' ' + cx + cy;
        return this.#positionData + ' ' + (this.#playerWhoMoved ? 'b' : 'w') + csTab;
    }
    toString() {
        let ox = (12 - this.#x1);
        let oy = String.fromCharCode((108 - this.#y1));
        let epx = (this.#ex != -1) ? (12 - this.#ex) : '';
        let epy = (this.#ey != -1) ? String.fromCharCode((108 - this.#ey)) : '';
        let dx = (12 - this.#x2);
        let dy = String.fromCharCode((108 - this.#y2));
        let promo = (this.#promotion) ? '+' : '';
        return ox + oy + epx + epy + dx + dy + promo;
    }
}
