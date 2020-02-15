var todos = [];
var renderEvent = new Event('render');

window.addEventListener('render', function () {
  var container = document.getElementById('list-container');
  todos.forEach(todo => {
    var el = todo.render();
    if(!el) return;
    var existing = document.getElementById(todo.id);
    if(existing) {
      container.replaceChild(el, existing)
    } else {
      container.appendChild(el);
    }
  });
}, false);

window.onload = function() {
  var addContainer = document.getElementById('add-container');
  bindEventsToBtnGroup(addContainer);
  var saveBtn = addContainer.querySelector('.save');
  saveBtn.addEventListener('click', saveTodo.bind(null, addContainer))
}

function Todo(text, priority, completeAt) {
  this.id = new Date().getTime();
  this.text = text;
  this.priority = priority;
  this.completeAt = completeAt;
  this.lastTemplate = '';
  this.el;
  this.complete = this.complete.bind(this);
  this.edit = this.edit.bind(this);
  this.delete = this.delete.bind(this);
  this.save = this.save.bind(this);
  this.isCompleted = false;
  if(this.completeAt)
    this.completeTimeout = setTimeout(this.complete, this.completeAt * 1000);
}

Todo.prototype = {
  render() {
    var template = this.template();
    if(template == this.lastTemplate) return null;
    this.lastTemplate = template;
    var div = document.createElement('div');
    div.innerHTML = template;
    this.el = div.firstChild;
    this.bindEvents(this.el);
    return this.el
  },

  bindEvents() {
    bindEventsToBtnGroup(this.el);
    this.el.querySelector('.markComplete').addEventListener('click', this.complete);
    this.el.querySelector('.edit').addEventListener('click', this.edit);
    this.el.querySelector('.delete').addEventListener('click', this.delete);
    this.el.querySelector('.save').addEventListener('click', this.save);
  },

  complete(e) {
    if(e) this.isCompleted = e.target.checked;
    else this.isCompleted = true;
    clearTimeout(this.completeTimeout);
    window.dispatchEvent(renderEvent);
  },

  edit() {
    this.el.querySelector('.todo-item-content').style.display = 'none';
    this.el.querySelector('.todo-item-form').style.display = 'block';
  },

  delete() {
    this.el.parentNode.removeChild(this.el);
    removeTodo(this.id);
  },

  save() {
    var [text, priority, completeAt] = getTodoFromElement(this.el.querySelector('.todo-item-form'));
    this.text = text;
    this.priority = priority;
    if(this.completeAt !== completeAt && !this.isCompleted) {
      clearTimeout(this.completeTimeout);
      this.completeTimeout = setTimeout(this.complete, completeAt * 1000)
    }
    this.completeAt = completeAt;
    window.dispatchEvent(renderEvent);
  },

  template() {
    console.log(this.isCompleted)
    return `<div id="${this.id}" class="todo-item ${this.priority}${this.isCompleted ? ' completed': ''}">
      <div style="display: block" class="todo-item-content">
        <div class="note">
          <input class="markComplete" type="checkbox"${this.isCompleted ? ' checked': ''} /> ${this.text}
        </div>
        <div class="actions">
          <button class="edit">Edit</button>
          <button class="delete">Delete</button>
        </div>
      </div>
      <div style="display: none" class="todo-item-form form-container">
        <textarea name="name">${this.text}</textarea>
        <div class="todo-form-controls">
          <div class="remind-container">
            Complete in <input value="${this.completeAt}" min="1" type="number" placeholder="sec(s)" />
          </div>
          <div class="btn-group">
            <button value="low" class="low${this.priority === 'low' ? ' selected' : ''}">Low</button>
            <button value="medium" class="medium${this.priority === 'medium' ? ' selected' : ''}">Medium</button>
            <button value="high" class="high${this.priority === 'high' ? ' selected' : ''}">High</button>
          </div>
        </div>
        <button class="save">Save Todo</button>
      </div>
    </div>`;
  }
}

function bindEventsToBtnGroup(elem) {
  var buttonGroup = elem.querySelector('.btn-group');
  for(var i = 0; i < buttonGroup.children.length; i++) {
    buttonGroup.children[i].addEventListener('click', selectPriority);
  }
}

function saveTodo(elem) {
  var [text, priority, completeAt] = getTodoFromElement(elem);
  todos.push(new Todo(text, priority, completeAt));
  window.dispatchEvent(renderEvent);
  resetForm(elem);
}

function resetForm(elem) {
  elem.querySelector('textarea').value = '';
  elem.querySelector('input').value = '';
  var buttonGroup = elem.querySelector('.btn-group');
  for(var i = 0; i < buttonGroup.children.length; i++) {
    buttonGroup.children[i].classList.remove('selected');
  }
  buttonGroup.querySelector('.low').classList.add('selected');
}

function getTodoFromElement(elem) {
  var text = elem.querySelector('textarea').value;
  var priority = '';
  var completeAt = elem.querySelector('input').value;
  var buttonGroup = elem.querySelector('.btn-group');
  for(var i = 0; i < buttonGroup.children.length; i++) {
    if(buttonGroup.children[i].classList.contains('selected')) {
      priority = buttonGroup.children[i].value;
      break;
    }
  }
  return [text, priority, completeAt];
}

function removeTodo(id) {
  todos = todos.filter(todo => todo.id !== id);
  window.dispatchEvent(renderEvent);
}

function selectPriority(event) {
  var siblings = event.target.parentNode.children;
  for(var i = 0; i < siblings.length; i++) {
    siblings[i].classList.remove('selected');
  }
  event.target.classList.add('selected');
}
