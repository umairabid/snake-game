/**
* Notes to reviewer
* - ES5 is used mainly because of browser compatibilty
* - Any use of library was essentially ignore to show understaning of low level javascript constructs
* - The lag while reversing and initializing game can possibly be removed by not using actual DOM grid but virtual grid
    will come back to this if get some time left from second challenge
**/

window.onload = function() {
  var game = new SnakeGame('snake-board');
  var scoreElem = document.getElementById('current-score');
  var previousScore = 0;
  var overlay = document.getElementById('gameover-overlay');
  var playAgainBtn = document.getElementById('play-again-btn');

  game.on('onScoreUpdate', function(score) {
    scoreElem.innerHTML = score;
    if(score > previousScore) {
      scoreElem.style.color = "green";
    }
  })

  game.on('onGameEnded', function(score) {
    previousScore = score;
    overlay.style.display = "flex";
  })

  playAgainBtn.addEventListener('click', function() {
    scoreElem.innerHTML = 0;
    scoreElem.style.color = "black";
    overlay.style.display = "none";
    game.restart();
  })
}

function SnakeGame(id) {
  var board = document.getElementById(id);
  board.setAttribute("style", "");
  board.style.width = "800px";
  board.style.height = "800px";
  var cellSize = 16;
  var path = [];
  var currentFoodPos = {row: -1, col: -1};
  var events = {
    'onScoreUpdate': [],
    'onGameEnded': [],
  };

  this.board = function() { return board }
  this.cellSize = function() { return cellSize }
  this.rowsNum = function() { return Math.floor(this.board().clientHeight / this.cellSize()) }
  this.colsNum = function() { return Math.floor(this.board().clientWidth / this.cellSize()) }
  this.path = function() { return path }
  this.foodPos = function() { return currentFoodPos }
  this.events = function() { return events };
  this.initialize();
}

SnakeGame.prototype = {
  initialize: function() {
    this.direction = 'ArrowRight';
    this.score = 0;
    this.bindCallbacks();
    this.generateGrid();
    this.initializePath();
    this.paintPath();
    this.bindEvents();
    this.produceFood();
  },

  bindCallbacks: function() {
    this.onKeyPress = this.onKeyPress.bind(this);
    this.onMove = this.onMove.bind(this);
    this.produceFood = this.produceFood.bind(this);
  },

  bindEvents: function() {
    window.addEventListener('keydown', this.onKeyPress);
    this.moveInterval = setInterval(this.onMove, 100);
  },

  restart: function() {
    this.board().innerHTML = "";
    this.board().style.width = "800px";
    this.board().style.height = "800px";
    this.initialize();
  },

  produceFood: function() {
    var timeout = this.generateRandom(4, 10);
    var freeRowCol = this.getRandomFreeRowCol();
    var prevFoodCell = this.getCell(this.foodPos());
    if(prevFoodCell) {
      prevFoodCell.className = prevFoodCell.className.split(' ').filter(c => c !== 'food').join(' ');
    }
    this.foodPos().row = freeRowCol.row;
    this.foodPos().col = freeRowCol.col;
    var nextFoodCell = this.getCell(this.foodPos());
    var classNames = nextFoodCell.className.split(' ');
    classNames.push('food');
    nextFoodCell.className = classNames.join(' ');
    this.foodTimeout = setTimeout(this.produceFood, timeout * 1000);
  },

  onKeyPress: function(e) {
    if(!this.isValidDirection(e.code)) return;
    clearInterval(this.moveInterval);
    this.direction = e.code;
    this.onMove();
    this.moveInterval = setInterval(this.onMove, 100);
  },

  onMove: function() {
    var newPoint = this.getNextPathPoint();
    var selfCollided = this.path().find(p => p.row === newPoint.row && p.col === newPoint.col)
    if(selfCollided) {
      this.endGame();
      return;
    }
    if(this.collidedWithBoundry(newPoint)) {
      this.resizeBoard(newPoint);
      return;
    }
    this.path().unshift(newPoint);
    var hasEaten = newPoint.row === this.foodPos().row && newPoint.col === this.foodPos().col;
    if(hasEaten) {
      this.score += 1;
      this.events().onScoreUpdate.forEach(cb => cb(this.score));
      clearTimeout(this.foodTimeout);
      this.produceFood();
    } else this.removeLastPoint();
    this.paintPath();
  },

  resizeBoard: function(newPoint) {
    clearInterval(this.moveInterval);
    window.removeEventListener('keydown', this.onKeyPress);
    clearTimeout(this.foodTimeout);
    var newRowsNum = Math.floor((this.board().clientWidth - 133) / this.cellSize());
    var newColsNum = Math.floor((this.board().clientHeight - 133) / this.cellSize());
    var rowDifference = this.rowsNum() - newRowsNum;
    var colDifference = this.colsNum() - newColsNum;
    var shouldNormalizeCols = false;
    var shouldNormalizeRows = false;
    var shouldEndGame = false;

    this.reverseDirection(newPoint);

    for(var i = 0; i < this.path().length; i++) {
      var point = this.path()[i];
      var isRowInBound = (point.row >= 0 && point.row < newRowsNum) || (point.row - rowDifference) > 0 && (point.row - rowDifference) < newRowsNum;
      var isColInBound = (point.col >= 0 && point.col < newColsNum) || (point.col - colDifference) > 0 && (point.col - colDifference) < newColsNum;
      if(isRowInBound && isColInBound) {
        shouldNormalizeRows = shouldNormalizeRows || !(point.row < newRowsNum);
        shouldNormalizeCols = shouldNormalizeCols || !(point.col < newColsNum);
      } else {
        shouldEndGame = true;
        break;
      }
    }

    if(shouldEndGame) return this.endGame();
    for(var i = 0; i < this.path().length; i++) {
      var point = this.path()[i];
      if(shouldNormalizeCols || shouldNormalizeCols) {
        var cell = this.getCell(point);
        cell.className = cell.className.split(' ').filter(c => c !== 'active').join(' ');
      }
      if(shouldNormalizeRows) point.row = point.row - rowDifference;
      if(shouldNormalizeCols) point.col = point.col - colDifference;
    }

    for(var i = 0; i < this.rowsNum(); i++) {
      if(i < newRowsNum) {
        for(var j = newColsNum; j < this.colsNum(); j++) {
          var cell = this.getCell({row: i, col: j});
          cell.parentNode.removeChild(cell)
        }
      } else {
        for(var j = 0; j < this.colsNum(); j++) {
          var cell = this.getCell({row: i, col: j});
          cell.parentNode.removeChild(cell)
        }
      }
    }
    //this.board().innerHTML = "";
    this.board().style.width = this.board().offsetWidth - 133 + 'px';
    this.board().style.height = this.board().offsetHeight - 133 + 'px';
    // this.generateGrid();

    window.addEventListener('keydown', this.onKeyPress);
    this.produceFood();
    this.paintPath();
    this.onMove();
    this.moveInterval = setInterval(this.onMove, 100);

  },

  reverseDirection: function(fromPoint) {
    var toPoint = { row: null, col: null};
    if(fromPoint.col < 0 || fromPoint.col > (this.colsNum() - 1)) {
      var ifLeft = fromPoint.col < 0;
      toPoint.col = ifLeft ? fromPoint.col + 1 : fromPoint.col - 1;
      toPoint.row = fromPoint.row + 1;
      if(toPoint.row > (this.rowsNum() - 1)) toPoint.row = fromPoint.row - 1;
      this.direction = ifLeft ? 'ArrowRight' : 'ArrowLeft';
    } else {
      var isTop = fromPoint.row < 0;
      toPoint.row = isTop ? fromPoint.row + 1 : fromPoint.row - 1;
      toPoint.col = fromPoint.col + 1;
      if(toPoint.col > (this.colsNum() - 1)) toPoint.col = fromPoint.col - 1;
      this.direction = isTop ? 'ArrowDown' : 'ArrowUp';
    }
    this.path().unshift(toPoint);
    this.removeLastPoint();
  },

  collidedWithBoundry: function(newPoint) {
    return !(newPoint.row >= 0 && newPoint.row < this.rowsNum()) ||
      !(newPoint.col >= 0 && newPoint.col < this.colsNum());
  },

  endGame: function() {
    clearInterval(this.moveInterval);
    clearTimeout(this.foodTimeout);
    window.removeEventListener('keydown', this.onKeyPress);
    this.events().onGameEnded.forEach(cb => cb(this.score));
  },

  removeLastPoint: function() {
    var lastPoint = this.path().pop();
    var lastCell = this.getCell(lastPoint);
    var classNames = lastCell.className.split(' ').filter(c => c !== 'active');
    lastCell.className = classNames.join(' ');
  },

  getNextPathPoint: function() {
    var row = this.path()[0].row;
    var col = this.path()[0].col;
    if(this.direction === 'ArrowLeft') col -= 1;
    else if(this.direction === 'ArrowRight') col += 1;
    else if(this.direction === 'ArrowUp') row -= 1;
    else row += 1;
    return {row, col};
  },

  isValidDirection: function(dir) {
    var isCurrentDirHor = this.direction === 'ArrowLeft' || this.direction === 'ArrowRight';
    var isNewDirHor = dir === 'ArrowLeft' || dir === 'ArrowRight';
    return isCurrentDirHor !== isNewDirHor;
  },

  paintPath: function() {
    this.path().forEach( p => {
      var cell = this.getCell(p);
      var classNames = cell.className.split(' ');
      if(classNames.indexOf('active') < 0) classNames.push('active');
      cell.className = classNames.join(' ');
    })
  },

  initializePath: function() {
    this.path().length = 0;
    var initialLength = 5;
    var midRow = Math.floor(this.rowsNum() / 2);
    var midCol = Math.floor(this.colsNum() / 2);

    while(initialLength > 0 && midCol >= 0) {
      this.path().push({row: midRow, col: midCol});
      initialLength -= 1;
      midCol -= 1;
    }
  },

  generateGrid: function() {
    for(var i = 0; i < this.rowsNum(); i++) {
      for(var j = 0; j < this.colsNum(); j++) {
        var cell = this.generateCell(i, j);
        this.board().appendChild(cell);
      }
    }
  },

  getCell: function(pos) {
    var cell = document.getElementById('cell-' + pos.row + '-' + pos.col);
    return cell;
  },

  generateCell: function(row, col) {
    var div = document.createElement('div');
    div.setAttribute('id', 'cell-' + row + '-' + col);
    div.setAttribute('class', 'grid-cell');
    div.style.width = this.cellSize() + 'px';
    div.style.height = this.cellSize() + 'px';
    div.style.display = 'inline-block';
    return div;
  },

  getRandomFreeRowCol: function() {
    var occupiedCells = this.path().concat([this.foodPos()]);
    var randRow = this.generateRandom(0, this.rowsNum() - 1);
    var randCol = this.generateRandom(0, this.colsNum() - 1);
    if(occupiedCells.find(p => p.row === randRow && p.col === randCol))
      return this.getRandomFreeRowCol();
    else return {row: randRow, col: randCol};
  },

  generateRandom: function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  on: function(name, cb) {
    if(this.events()[name]) {
      this.events()[name].push(cb);
    }
  }
}
