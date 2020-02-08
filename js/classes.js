function SnakeGame(id) {
  var board = document.getElementById(id);
  var cellSize = 16;
  var path = [];
  var currentFoodPos = {row: -1, col: -1};

  this.board = function() { return board }
  this.cellSize = function() { return cellSize }
  this.rowsNum = function() { return Math.floor(this.board().clientHeight / this.cellSize()) }
  this.colsNum = function() { return Math.floor(this.board().clientWidth / this.cellSize()) }
  this.path = function() { return path }
  this.foodPos = function() { return currentFoodPos }
  this.initialize();
}

SnakeGame.prototype = {
  initialize: function() {
    this.direction = 'ArrowRight';
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
    clearInterval(this.moveInterval);
    if(!this.isValidDirection(e.code)) return;
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
    this.path().unshift(newPoint);
    var hasEaten = newPoint.row === this.foodPos().row && newPoint.col === this.foodPos().col;
    if(hasEaten) {
      clearTimeout(this.foodTimeout);
      this.produceFood();
    } else this.removeLastPoint();
    this.paintPath();
  },

  endGame: function() {
    clearInterval(this.moveInterval);
    clearTimeout(this.foodTimeout);
    window.removeEventListener('keydown', this.onKeyPress);
    console.log('game ended');
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

  getRandomFreeRowCol() {
    var occupiedCells = this.path().concat([this.foodPos()]);
    var randRow = this.generateRandom(0, this.rowsNum() - 1);
    var randCol = this.generateRandom(0, this.colsNum() - 1);
    if(occupiedCells.find(p => p.row === randRow && p.col === randCol))
      return this.getRandomFreeRowCol();
    else return {row: randRow, col: randCol};
  },

  generateRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}