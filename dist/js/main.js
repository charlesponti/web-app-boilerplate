(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var App = _interopRequire(require("./app"));

var React = _interopRequire(require("react"));

var Router = _interopRequire(require("react-router"));

Router.run(App.routes, function (Handler) {
  React.render(React.createElement(Handler, null), document.querySelector("#app"));
});

// Or, if you'd like to use the HTML5 history API for cleaner URLs:
// Router.run(routes, Router.HistoryLocation, function (Handler) {
//   React.render(<Handler/>, document.querySelector('app'));
// });

},{"./app":5,"react":"react","react-router":"react-router"}],2:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],3:[function(require,module,exports){
"use strict";

module.exports = {

  TASKS: {
    COMPLETE: "task-complete",
    CREATE: "task-create",
    DESTROY: "task-destroy",
    TOGGLE_COMPLETE_ALL: "tasks-complete-all",
    UPDATE: "task-update",
    UNDO_COMPLETE: "task-undo-complete"
  }

};

},{}],4:[function(require,module,exports){
"use strict";

var Dispatcher = require("flux").Dispatcher;

module.exports = new Dispatcher();

},{"flux":"flux"}],5:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var dispatcher = _interopRequire(require("./dispatcher"));

var constants = _interopRequire(require("./constants"));

var routes = _interopRequire(require("./routes"));

module.exports = {

  dispatcher: dispatcher,

  constants: constants,

  routes: routes

};

},{"./constants":3,"./dispatcher":4,"./routes":6}],6:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

// Components

var App = _interopRequire(require("../pages/app"));

var Home = _interopRequire(require("../pages/home"));

var NotFound = _interopRequire(require("../pages/not-found"));

var TaskPage = _interopRequire(require("../tasks"));

// Dependencies

var React = _interopRequire(require("react"));

var Router = _interopRequire(require("react-router"));

var Route = Router.Route;
var DefaultRoute = Router.DefaultRoute;
var NotFoundRoute = Router.NotFoundRoute;

var routes = React.createElement(
  Route,
  { path: "/", handler: App },
  React.createElement(DefaultRoute, { handler: Home }),
  React.createElement(NotFoundRoute, { handler: NotFound }),
  React.createElement(Route, { path: "tasks", handler: TaskPage })
);

module.exports = routes;

},{"../pages/app":7,"../pages/home":8,"../pages/not-found":9,"../tasks":10,"react":"react","react-router":"react-router"}],7:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var React = _interopRequire(require("react"));

var RouteHandler = require("react-router").RouteHandler;

var App = (function (_React$Component) {
  function App() {
    _classCallCheck(this, App);

    _get(Object.getPrototypeOf(App.prototype), "constructor", this).call(this);
  }

  _inherits(App, _React$Component);

  _createClass(App, {
    render: {
      value: function render() {
        return React.createElement(
          "div",
          null,
          React.createElement(RouteHandler, null)
        );
      }
    }
  });

  return App;
})(React.Component);

module.exports = App;
/* this is the important part */

},{"react":"react","react-router":"react-router"}],8:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var React = _interopRequire(require("react"));

var Home = (function (_React$Component) {
  function Home() {
    _classCallCheck(this, Home);

    _get(Object.getPrototypeOf(Home.prototype), "constructor", this).call(this);
  }

  _inherits(Home, _React$Component);

  _createClass(Home, {
    render: {
      value: function render() {
        return React.createElement(
          "div",
          null,
          React.createElement(
            "h2",
            { className: "text-center" },
            " React Life "
          )
        );
      }
    }
  });

  return Home;
})(React.Component);

module.exports = Home;

},{"react":"react"}],9:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var React = _interopRequire(require("react"));

var NotFound = (function (_React$Component) {
  function NotFound() {
    _classCallCheck(this, NotFound);

    if (_React$Component != null) {
      _React$Component.apply(this, arguments);
    }
  }

  _inherits(NotFound, _React$Component);

  _createClass(NotFound, {
    render: {
      value: function render() {
        return React.createElement(
          "div",
          null,
          React.createElement(
            "h1",
            null,
            " What You Talking About, Willis?"
          )
        );
      }
    }
  });

  return NotFound;
})(React.Component);

module.exports = NotFound;

},{"react":"react"}],10:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var React = _interopRequire(require("react"));

var TaskList = _interopRequire(require("./task-list"));

var Tasks = _interopRequire(require("./tasks"));

var TaskForm = _interopRequire(require("./task-form"));

var TaskPage = (function (_React$Component) {
  function TaskPage() {
    _classCallCheck(this, TaskPage);

    _get(Object.getPrototypeOf(TaskPage.prototype), "constructor", this).call(this);
    this.state = {
      tasks: Tasks.getAll()
    };
  }

  _inherits(TaskPage, _React$Component);

  _createClass(TaskPage, {
    componentDidMount: {
      value: function componentDidMount() {
        var component = this;
        Tasks.on("changed", function () {
          component.setState({ tasks: Tasks.getAll() });
        });
      }
    },
    render: {
      value: function render() {
        var tasks = Object.keys(this.state.tasks).map(function (key) {
          return this.state.tasks[key];
        });

        return React.createElement(
          "div",
          { className: "page" },
          React.createElement(
            "h2",
            { className: "text-center" },
            " Tasks "
          ),
          React.createElement(TaskForm, null),
          React.createElement(TaskList, { tasks: tasks })
        );
      }
    }
  });

  return TaskPage;
})(React.Component);

module.exports = TaskPage;

},{"./task-form":11,"./task-list":12,"./tasks":13,"react":"react"}],11:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var React = _interopRequire(require("react"));

var tasks = _interopRequire(require("./tasks"));

var TaskForm = (function (_React$Component) {
  function TaskForm() {
    _classCallCheck(this, TaskForm);

    _get(Object.getPrototypeOf(TaskForm.prototype), "constructor", this).call(this);
  }

  _inherits(TaskForm, _React$Component);

  _createClass(TaskForm, {
    onSubmit: {
      value: function onSubmit() {
        var value = this.refs.name.getDOMNode().value;
        tasks.add({ task: value });
      }
    },
    render: {
      value: function render() {
        return React.createElement(
          "section",
          { className: "card" },
          React.createElement(
            "form",
            { className: "task-form", onSubmit: this.onSubmit.bind(this) },
            React.createElement("input", { onKeyUp: this.onKeyUp,
              placeholder: "Search tasks or create new task",
              ref: "name",
              required: true,
              type: "text" })
          )
        );
      }
    }
  });

  return TaskForm;
})(React.Component);

module.exports = TaskForm;

},{"./tasks":13,"react":"react"}],12:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var React = _interopRequire(require("react"));

var TaskList = (function (_React$Component) {
  function TaskList() {
    for (var _len = arguments.length, props = Array(_len), _key = 0; _key < _len; _key++) {
      props[_key] = arguments[_key];
    }

    _classCallCheck(this, TaskList);

    _get(Object.getPrototypeOf(TaskList.prototype), "constructor", this).apply(this, props);
    this.state = {
      tasks: this.props.tasks || []
    };
  }

  _inherits(TaskList, _React$Component);

  _createClass(TaskList, {
    render: {
      value: function render() {
        return React.createElement(
          "ul",
          null,
          this.state.tasks.map(function (task) {
            return React.createElement(
              "li",
              null,
              " ",
              task.title,
              " "
            );
          })
        );
      }
    }
  });

  return TaskList;
})(React.Component);

module.exports = TaskList;

},{"react":"react"}],13:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var dispatcher = _interopRequire(require("../app/dispatcher"));

var constants = _interopRequire(require("../app/constants"));

var EventEmitter = require("events").EventEmitter;

var _ = _interopRequire(require("lodash"));

var TaskConstants = constants.TASKS;
var CHANGE_EVENT = "change";

var _tasks = {};

/**
 * Create a TODO item.
 * @param  {string} text The content of the TODO
 */
function create(text) {
  // Hand waving here -- not showing how this interacts with XHR or persistent
  // server-side storage.
  // Using the current timestamp + random number in place of a real id.
  var id = (+new Date() + Math.floor(Math.random() * 999999)).toString(36);
  _tasks[id] = {
    id: id,
    complete: false,
    text: text
  };
}

/**
 * Update a TODO item.
 * @param  {string} id
 * @param {object} updates An object literal containing only the data to be
 *     updated.
 */
function update(id, updates) {
  _tasks[id] = _.merge({}, _tasks[id], updates);
}

/**
 * Update all of the TODO items with the same object.
 *     the data to be updated.  Used to mark all TODOs as completed.
 * @param  {object} updates An object literal containing only the data to be
 *     updated.
 */
function updateAll(updates) {
  for (var id in _tasks) {
    update(id, updates);
  }
}

/**
 * Delete a TODO item.
 * @param  {string} id
 */
function destroy(id) {
  delete _tasks[id];
}

/**
 * Delete all the completed TODO items.
 */
function destroyCompleted() {
  for (var id in _tasks) {
    if (_tasks[id].complete) {
      destroy(id);
    }
  }
}

var TaskStore = _.merge({}, EventEmitter.prototype, {

  /**
   * Tests whether all the remaining TODO items are marked as completed.
   * @return {boolean}
   */
  areAllComplete: function areAllComplete() {
    for (var id in _tasks) {
      if (!_tasks[id].complete) {
        return false;
      }
    }
    return true;
  },

  /**
   * Get the entire collection of TODOs.
   * @return {object}
   */
  getAll: function getAll() {
    return _tasks;
  },

  emitChange: function emitChange() {
    this.emit(CHANGE_EVENT);
  },

  /**
   * @param {function} callback
   */
  addChangeListener: function addChangeListener(callback) {
    this.on(CHANGE_EVENT, callback);
  },

  /**
   * @param {function} callback
   */
  removeChangeListener: function removeChangeListener(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  }
});

// Register callback to handle all updates
dispatcher.register(function (action) {
  var text = undefined;

  switch (action.actionType) {
    case TaskConstants.CREATE:
      text = action.text.trim();
      if (text !== "") {
        create(text);
        TaskStore.emitChange();
      }
      break;

    case TaskConstants.TOGGLE_COMPLETE_ALL:
      if (TaskStore.areAllComplete()) {
        updateAll({ complete: false });
      } else {
        updateAll({ complete: true });
      }
      TaskStore.emitChange();
      break;

    case TaskConstants.UNDO_COMPLETE:
      update(action.id, { complete: false });
      TaskStore.emitChange();
      break;

    case TaskConstants.COMPLETE:
      update(action.id, { complete: true });
      TaskStore.emitChange();
      break;

    case TaskConstants.UPDATE:
      text = action.text.trim();
      if (text !== "") {
        update(action.id, { text: text });
        TaskStore.emitChange();
      }
      break;

    case TaskConstants.DESTROY:
      destroy(action.id);
      TaskStore.emitChange();
      break;

    default:
    // no op
  }
});

module.exports = TaskStore;

},{"../app/constants":3,"../app/dispatcher":4,"events":2,"lodash":"lodash"}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvY2hhcmxlc3BvbnRpL0RldmVsb3Blci9yZWFjdGpzLWxpZmUvc3JjL21haW4uanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsIi9Vc2Vycy9jaGFybGVzcG9udGkvRGV2ZWxvcGVyL3JlYWN0anMtbGlmZS9zcmMvYXBwL2NvbnN0YW50cy5qcyIsIi9Vc2Vycy9jaGFybGVzcG9udGkvRGV2ZWxvcGVyL3JlYWN0anMtbGlmZS9zcmMvYXBwL2Rpc3BhdGNoZXIuanMiLCIvVXNlcnMvY2hhcmxlc3BvbnRpL0RldmVsb3Blci9yZWFjdGpzLWxpZmUvc3JjL2FwcC9pbmRleC5qcyIsIi9Vc2Vycy9jaGFybGVzcG9udGkvRGV2ZWxvcGVyL3JlYWN0anMtbGlmZS9zcmMvYXBwL3JvdXRlcy5qcyIsIi9Vc2Vycy9jaGFybGVzcG9udGkvRGV2ZWxvcGVyL3JlYWN0anMtbGlmZS9zcmMvcGFnZXMvYXBwLmpzIiwiL1VzZXJzL2NoYXJsZXNwb250aS9EZXZlbG9wZXIvcmVhY3Rqcy1saWZlL3NyYy9wYWdlcy9ob21lLmpzIiwiL1VzZXJzL2NoYXJsZXNwb250aS9EZXZlbG9wZXIvcmVhY3Rqcy1saWZlL3NyYy9wYWdlcy9ub3QtZm91bmQuanMiLCIvVXNlcnMvY2hhcmxlc3BvbnRpL0RldmVsb3Blci9yZWFjdGpzLWxpZmUvc3JjL3Rhc2tzL2luZGV4LmpzIiwiL1VzZXJzL2NoYXJsZXNwb250aS9EZXZlbG9wZXIvcmVhY3Rqcy1saWZlL3NyYy90YXNrcy90YXNrLWZvcm0uanMiLCIvVXNlcnMvY2hhcmxlc3BvbnRpL0RldmVsb3Blci9yZWFjdGpzLWxpZmUvc3JjL3Rhc2tzL3Rhc2stbGlzdC5qcyIsIi9Vc2Vycy9jaGFybGVzcG9udGkvRGV2ZWxvcGVyL3JlYWN0anMtbGlmZS9zcmMvdGFza3MvdGFza3MuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSxZQUFZLENBQUM7Ozs7SUFFTixHQUFHLDJCQUFNLE9BQU87O0lBQ2hCLEtBQUssMkJBQU0sT0FBTzs7SUFDbEIsTUFBTSwyQkFBTSxjQUFjOztBQUVqQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsVUFBVSxPQUFPLEVBQUU7QUFDeEMsT0FBSyxDQUFDLE1BQU0sQ0FBQyxvQkFBQyxPQUFPLE9BQUUsRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Q0FDMUQsQ0FBQyxDQUFDOzs7Ozs7OztBQ1JIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1NBLFlBQVksQ0FBQzs7aUJBRUU7O0FBRWIsT0FBSyxFQUFFO0FBQ0wsWUFBUSxFQUFFLGVBQWU7QUFDekIsVUFBTSxFQUFFLGFBQWE7QUFDckIsV0FBTyxFQUFFLGNBQWM7QUFDdkIsdUJBQW1CLEVBQUUsb0JBQW9CO0FBQ3pDLFVBQU0sRUFBRSxhQUFhO0FBQ3JCLGlCQUFhLEVBQUUsb0JBQW9CO0dBQ3BDOztDQUVGOzs7QUNiRCxZQUFZLENBQUM7O0lBRUwsVUFBVSxXQUFPLE1BQU0sRUFBdkIsVUFBVTs7QUFFbEIsTUFBTSxDQUFDLE9BQU8sR0FBRyxJQUFJLFVBQVUsRUFBRSxDQUFDOzs7QUNKbEMsWUFBWSxDQUFDOzs7O0lBRU4sVUFBVSwyQkFBTSxjQUFjOztJQUM5QixTQUFTLDJCQUFNLGFBQWE7O0lBQzVCLE1BQU0sMkJBQU0sVUFBVTs7aUJBRWQ7O0FBRWIsWUFBVSxFQUFFLFVBQVU7O0FBRXRCLFdBQVMsRUFBRSxTQUFTOztBQUVwQixRQUFNLEVBQUUsTUFBTTs7Q0FFZjs7O0FDZEQsWUFBWSxDQUFDOzs7Ozs7SUFHTixHQUFHLDJCQUFNLGNBQWM7O0lBQ3ZCLElBQUksMkJBQU0sZUFBZTs7SUFDekIsUUFBUSwyQkFBTSxvQkFBb0I7O0lBQ2xDLFFBQVEsMkJBQU0sVUFBVTs7OztJQUd4QixLQUFLLDJCQUFNLE9BQU87O0lBQ2xCLE1BQU0sMkJBQU0sY0FBYzs7QUFFakMsSUFBSSxLQUFLLEdBQUksTUFBTSxDQUFDLEtBQUssQ0FBQztBQUMxQixJQUFJLFlBQVksR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDO0FBQ3ZDLElBQUksYUFBYSxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUM7O0FBRXpDLElBQUksTUFBTSxHQUNSO0FBQUMsT0FBSztJQUFDLElBQUksRUFBQyxHQUFHLEVBQUMsT0FBTyxFQUFFLEdBQUcsQUFBQztFQUMzQixvQkFBQyxZQUFZLElBQUMsT0FBTyxFQUFFLElBQUksQUFBQyxHQUFHO0VBQy9CLG9CQUFDLGFBQWEsSUFBQyxPQUFPLEVBQUUsUUFBUSxBQUFDLEdBQUU7RUFDbkMsb0JBQUMsS0FBSyxJQUFDLElBQUksRUFBQyxPQUFPLEVBQUMsT0FBTyxFQUFFLFFBQVEsQUFBQyxHQUFHO0NBQ25DLEFBQ1QsQ0FBQzs7aUJBRWEsTUFBTTs7O0FDeEJyQixZQUFZLENBQUM7Ozs7Ozs7Ozs7OztJQUVOLEtBQUssMkJBQU0sT0FBTzs7SUFDakIsWUFBWSxXQUFPLGNBQWMsRUFBakMsWUFBWTs7SUFFZCxHQUFHO0FBRUksV0FGUCxHQUFHLEdBRU87MEJBRlYsR0FBRzs7QUFHTCwrQkFIRSxHQUFHLDZDQUdHO0dBQ1Q7O1lBSkcsR0FBRzs7ZUFBSCxHQUFHO0FBTVAsVUFBTTthQUFBLGtCQUFHO0FBQ1AsZUFDRTs7O1VBRUUsb0JBQUMsWUFBWSxPQUFFO1NBQ1gsQ0FDUDtPQUNGOzs7O1NBYkcsR0FBRztHQUFTLEtBQUssQ0FBQyxTQUFTOztpQkFpQmxCLEdBQUc7Ozs7QUN0QmxCLFlBQVksQ0FBQzs7Ozs7Ozs7Ozs7O0lBRU4sS0FBSywyQkFBTSxPQUFPOztJQUVuQixJQUFJO0FBRUcsV0FGUCxJQUFJLEdBRU07MEJBRlYsSUFBSTs7QUFHTiwrQkFIRSxJQUFJLDZDQUdFO0dBQ1Q7O1lBSkcsSUFBSTs7ZUFBSixJQUFJO0FBTVIsVUFBTTthQUFBLGtCQUFHO0FBQ1AsZUFDRTs7O1VBQ0U7O2NBQUksU0FBUyxFQUFDLGFBQWE7O1dBQWtCO1NBQ3pDLENBQ1A7T0FDRjs7OztTQVpHLElBQUk7R0FBUyxLQUFLLENBQUMsU0FBUzs7aUJBZ0JuQixJQUFJOzs7QUNwQm5CLFlBQVksQ0FBQzs7Ozs7Ozs7OztJQUVOLEtBQUssMkJBQU0sT0FBTzs7SUFFbkIsUUFBUTtXQUFSLFFBQVE7MEJBQVIsUUFBUTs7Ozs7OztZQUFSLFFBQVE7O2VBQVIsUUFBUTtBQUVaLFVBQU07YUFBQSxrQkFBRztBQUNQLGVBQ0U7OztVQUNFOzs7O1dBQXlDO1NBQ3JDLENBQ047T0FDSDs7OztTQVJHLFFBQVE7R0FBUyxLQUFLLENBQUMsU0FBUzs7aUJBYXZCLFFBQVE7OztBQ2pCdkIsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7SUFFTixLQUFLLDJCQUFNLE9BQU87O0lBQ2xCLFFBQVEsMkJBQU0sYUFBYTs7SUFDM0IsS0FBSywyQkFBTSxTQUFTOztJQUNwQixRQUFRLDJCQUFNLGFBQWE7O0lBRTVCLFFBQVE7QUFFRCxXQUZQLFFBQVEsR0FFRTswQkFGVixRQUFROztBQUdWLCtCQUhFLFFBQVEsNkNBR0Y7QUFDUixRQUFJLENBQUMsS0FBSyxHQUFHO0FBQ1gsV0FBSyxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUU7S0FDdEIsQ0FBQztHQUNIOztZQVBHLFFBQVE7O2VBQVIsUUFBUTtBQVNaLHFCQUFpQjthQUFBLDZCQUFHO0FBQ2xCLFlBQUksU0FBUyxHQUFHLElBQUksQ0FBQztBQUNyQixhQUFLLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxZQUFXO0FBQzdCLG1CQUFTLENBQUMsUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7U0FDL0MsQ0FBQyxDQUFDO09BQ0o7O0FBRUQsVUFBTTthQUFBLGtCQUFHO0FBQ1AsWUFBSSxLQUFLLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFTLEdBQUcsRUFBRTtBQUMxRCxpQkFBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUM5QixDQUFDLENBQUM7O0FBRUgsZUFDRTs7WUFBSyxTQUFTLEVBQUMsTUFBTTtVQUNuQjs7Y0FBSSxTQUFTLEVBQUMsYUFBYTs7V0FBYTtVQUN4QyxvQkFBQyxRQUFRLE9BQUc7VUFDWixvQkFBQyxRQUFRLElBQUMsS0FBSyxFQUFFLEtBQUssQUFBQyxHQUFFO1NBQ3JCLENBQ047T0FDSDs7OztTQTVCRyxRQUFRO0dBQVMsS0FBSyxDQUFDLFNBQVM7O2lCQWdDdkIsUUFBUTs7O0FDdkN2QixZQUFZLENBQUM7Ozs7Ozs7Ozs7OztJQUVOLEtBQUssMkJBQU0sT0FBTzs7SUFDbEIsS0FBSywyQkFBTSxTQUFTOztJQUVyQixRQUFRO0FBRUQsV0FGUCxRQUFRLEdBRUU7MEJBRlYsUUFBUTs7QUFHViwrQkFIRSxRQUFRLDZDQUdGO0dBQ1Q7O1lBSkcsUUFBUTs7ZUFBUixRQUFRO0FBTVosWUFBUTthQUFBLG9CQUFHO0FBQ1QsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsS0FBSyxDQUFDO0FBQzlDLGFBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztPQUM1Qjs7QUFFRCxVQUFNO2FBQUEsa0JBQUc7QUFDUCxlQUNFOztZQUFTLFNBQVMsRUFBQyxNQUFNO1VBQ3ZCOztjQUFNLFNBQVMsRUFBQyxXQUFXLEVBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxBQUFDO1lBQzdELCtCQUFPLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxBQUFDO0FBQ3RCLHlCQUFXLEVBQUMsaUNBQWlDO0FBQzdDLGlCQUFHLEVBQUMsTUFBTTtBQUNWLHNCQUFRLE1BQUE7QUFDUixrQkFBSSxFQUFDLE1BQU0sR0FBRztXQUNoQjtTQUNDLENBQ1Y7T0FDSDs7OztTQXZCRyxRQUFRO0dBQVMsS0FBSyxDQUFDLFNBQVM7O2lCQTJCdkIsUUFBUTs7O0FDaEN2QixZQUFZLENBQUM7Ozs7Ozs7Ozs7OztJQUVOLEtBQUssMkJBQU0sT0FBTzs7SUFFbkIsUUFBUTtBQUVELFdBRlAsUUFBUSxHQUVVO3NDQUFQLEtBQUs7QUFBTCxXQUFLOzs7MEJBRmhCLFFBQVE7O0FBR1YsK0JBSEUsUUFBUSw4Q0FHRCxLQUFLLEVBQUU7QUFDaEIsUUFBSSxDQUFDLEtBQUssR0FBRztBQUNYLFdBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxFQUFFO0tBQzlCLENBQUM7R0FDSDs7WUFQRyxRQUFROztlQUFSLFFBQVE7QUFTWixVQUFNO2FBQUEsa0JBQUc7QUFDUCxlQUNFOzs7VUFDRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsVUFBQSxJQUFJO21CQUFJOzs7O2NBQU0sSUFBSSxDQUFDLEtBQUs7O2FBQU87V0FBQSxDQUFDO1NBQ25ELENBQ0w7T0FDSDs7OztTQWZHLFFBQVE7R0FBUyxLQUFLLENBQUMsU0FBUzs7aUJBa0J2QixRQUFROzs7QUN0QnZCLFlBQVksQ0FBQzs7OztJQUVOLFVBQVUsMkJBQU0sbUJBQW1COztJQUNuQyxTQUFTLDJCQUFNLGtCQUFrQjs7SUFDaEMsWUFBWSxXQUFPLFFBQVEsRUFBM0IsWUFBWTs7SUFDYixDQUFDLDJCQUFNLFFBQVE7O0FBRXRCLElBQUksYUFBYSxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUM7QUFDcEMsSUFBSSxZQUFZLEdBQUcsUUFBUSxDQUFDOztBQUU1QixJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7Ozs7OztBQU1oQixTQUFTLE1BQU0sQ0FBQyxJQUFJLEVBQUU7Ozs7QUFJcEIsTUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLElBQUksSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsTUFBTSxDQUFDLENBQUEsQ0FBRSxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDekUsUUFBTSxDQUFDLEVBQUUsQ0FBQyxHQUFHO0FBQ1gsTUFBRSxFQUFFLEVBQUU7QUFDTixZQUFRLEVBQUUsS0FBSztBQUNmLFFBQUksRUFBRSxJQUFJO0dBQ1gsQ0FBQztDQUNIOzs7Ozs7OztBQVFELFNBQVMsTUFBTSxDQUFDLEVBQUUsRUFBRSxPQUFPLEVBQUU7QUFDM0IsUUFBTSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztDQUMvQzs7Ozs7Ozs7QUFRRCxTQUFTLFNBQVMsQ0FBQyxPQUFPLEVBQUU7QUFDMUIsT0FBSyxJQUFJLEVBQUUsSUFBSSxNQUFNLEVBQUU7QUFDckIsVUFBTSxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztHQUNyQjtDQUNGOzs7Ozs7QUFNRCxTQUFTLE9BQU8sQ0FBQyxFQUFFLEVBQUU7QUFDbkIsU0FBTyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7Q0FDbkI7Ozs7O0FBS0QsU0FBUyxnQkFBZ0IsR0FBRztBQUMxQixPQUFLLElBQUksRUFBRSxJQUFJLE1BQU0sRUFBRTtBQUNyQixRQUFJLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxRQUFRLEVBQUU7QUFDdkIsYUFBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0tBQ2I7R0FDRjtDQUNGOztBQUVELElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLFlBQVksQ0FBQyxTQUFTLEVBQUU7Ozs7OztBQU1sRCxnQkFBYyxFQUFFLDBCQUFXO0FBQ3pCLFNBQUssSUFBSSxFQUFFLElBQUksTUFBTSxFQUFFO0FBQ3JCLFVBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFO0FBQ3hCLGVBQU8sS0FBSyxDQUFDO09BQ2Q7S0FDRjtBQUNELFdBQU8sSUFBSSxDQUFDO0dBQ2I7Ozs7OztBQU1ELFFBQU0sRUFBRSxrQkFBVztBQUNqQixXQUFPLE1BQU0sQ0FBQztHQUNmOztBQUVELFlBQVUsRUFBRSxzQkFBVztBQUNyQixRQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO0dBQ3pCOzs7OztBQUtELG1CQUFpQixFQUFFLDJCQUFTLFFBQVEsRUFBRTtBQUNwQyxRQUFJLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQztHQUNqQzs7Ozs7QUFLRCxzQkFBb0IsRUFBRSw4QkFBUyxRQUFRLEVBQUU7QUFDdkMsUUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUM7R0FDN0M7Q0FDRixDQUFDLENBQUM7OztBQUdILFVBQVUsQ0FBQyxRQUFRLENBQUMsVUFBUyxNQUFNLEVBQUU7QUFDbkMsTUFBSSxJQUFJLFlBQUEsQ0FBQzs7QUFFVCxVQUFPLE1BQU0sQ0FBQyxVQUFVO0FBQ3RCLFNBQUssYUFBYSxDQUFDLE1BQU07QUFDdkIsVUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDMUIsVUFBSSxJQUFJLEtBQUssRUFBRSxFQUFFO0FBQ2YsY0FBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2IsaUJBQVMsQ0FBQyxVQUFVLEVBQUUsQ0FBQztPQUN4QjtBQUNELFlBQU07O0FBQUEsQUFFUixTQUFLLGFBQWEsQ0FBQyxtQkFBbUI7QUFDcEMsVUFBSSxTQUFTLENBQUMsY0FBYyxFQUFFLEVBQUU7QUFDOUIsaUJBQVMsQ0FBQyxFQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFDO09BQzlCLE1BQU07QUFDTCxpQkFBUyxDQUFDLEVBQUMsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7T0FDN0I7QUFDRCxlQUFTLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDdkIsWUFBTTs7QUFBQSxBQUVSLFNBQUssYUFBYSxDQUFDLGFBQWE7QUFDOUIsWUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsRUFBQyxRQUFRLEVBQUUsS0FBSyxFQUFDLENBQUMsQ0FBQztBQUNyQyxlQUFTLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDdkIsWUFBTTs7QUFBQSxBQUVSLFNBQUssYUFBYSxDQUFDLFFBQVE7QUFDekIsWUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztBQUNwQyxlQUFTLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDdkIsWUFBTTs7QUFBQSxBQUVSLFNBQUssYUFBYSxDQUFDLE1BQU07QUFDdkIsVUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDMUIsVUFBSSxJQUFJLEtBQUssRUFBRSxFQUFFO0FBQ2YsY0FBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsRUFBQyxJQUFJLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztBQUNoQyxpQkFBUyxDQUFDLFVBQVUsRUFBRSxDQUFDO09BQ3hCO0FBQ0QsWUFBTTs7QUFBQSxBQUVSLFNBQUssYUFBYSxDQUFDLE9BQU87QUFDeEIsYUFBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUNuQixlQUFTLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDdkIsWUFBTTs7QUFBQSxBQUVSLFlBQVE7O0dBRVQ7Q0FDRixDQUFDLENBQUM7O0FBRUgsTUFBTSxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgQXBwIGZyb20gJy4vYXBwJztcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUm91dGVyIGZyb20gJ3JlYWN0LXJvdXRlcic7XG5cblJvdXRlci5ydW4oQXBwLnJvdXRlcywgZnVuY3Rpb24gKEhhbmRsZXIpIHtcbiAgUmVhY3QucmVuZGVyKDxIYW5kbGVyLz4sIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhcHAnKSk7XG59KTtcblxuLy8gT3IsIGlmIHlvdSdkIGxpa2UgdG8gdXNlIHRoZSBIVE1MNSBoaXN0b3J5IEFQSSBmb3IgY2xlYW5lciBVUkxzOlxuLy8gUm91dGVyLnJ1bihyb3V0ZXMsIFJvdXRlci5IaXN0b3J5TG9jYXRpb24sIGZ1bmN0aW9uIChIYW5kbGVyKSB7XG4vLyAgIFJlYWN0LnJlbmRlcig8SGFuZGxlci8+LCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdhcHAnKSk7XG4vLyB9KTtcbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIHRoaXMuX2V2ZW50cyA9IHRoaXMuX2V2ZW50cyB8fCB7fTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gdGhpcy5fbWF4TGlzdGVuZXJzIHx8IHVuZGVmaW5lZDtcbn1cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuXG4vLyBCYWNrd2FyZHMtY29tcGF0IHdpdGggbm9kZSAwLjEwLnhcbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX21heExpc3RlbmVycyA9IHVuZGVmaW5lZDtcblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhbiAxMCBsaXN0ZW5lcnMgYXJlXG4vLyBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcblxuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICBpZiAoIWlzTnVtYmVyKG4pIHx8IG4gPCAwIHx8IGlzTmFOKG4pKVxuICAgIHRocm93IFR5cGVFcnJvcignbiBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gIHRoaXMuX21heExpc3RlbmVycyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgZXIsIGhhbmRsZXIsIGxlbiwgYXJncywgaSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cy5lcnJvciB8fFxuICAgICAgICAoaXNPYmplY3QodGhpcy5fZXZlbnRzLmVycm9yKSAmJiAhdGhpcy5fZXZlbnRzLmVycm9yLmxlbmd0aCkpIHtcbiAgICAgIGVyID0gYXJndW1lbnRzWzFdO1xuICAgICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgZXI7IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoJ1VuY2F1Z2h0LCB1bnNwZWNpZmllZCBcImVycm9yXCIgZXZlbnQuJyk7XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNVbmRlZmluZWQoaGFuZGxlcikpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGhhbmRsZXIpKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QoaGFuZGxlcikpIHtcbiAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG5cbiAgICBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICBpZiAodGhpcy5fZXZlbnRzLm5ld0xpc3RlbmVyKVxuICAgIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLFxuICAgICAgICAgICAgICBpc0Z1bmN0aW9uKGxpc3RlbmVyLmxpc3RlbmVyKSA/XG4gICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICBlbHNlIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2VcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG5cbiAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkgJiYgIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICB2YXIgbTtcbiAgICBpZiAoIWlzVW5kZWZpbmVkKHRoaXMuX21heExpc3RlbmVycykpIHtcbiAgICAgIG0gPSB0aGlzLl9tYXhMaXN0ZW5lcnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9XG5cbiAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgIGlmICh0eXBlb2YgY29uc29sZS50cmFjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBub3Qgc3VwcG9ydGVkIGluIElFIDEwXG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgdmFyIGZpcmVkID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gZygpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuXG4gICAgaWYgKCFmaXJlZCkge1xuICAgICAgZmlyZWQgPSB0cnVlO1xuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICBnLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHRoaXMub24odHlwZSwgZyk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBlbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWZmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZFxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBsaXN0LCBwb3NpdGlvbiwgbGVuZ3RoLCBpO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGxlbmd0aCA9IGxpc3QubGVuZ3RoO1xuICBwb3NpdGlvbiA9IC0xO1xuXG4gIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fFxuICAgICAgKGlzRnVuY3Rpb24obGlzdC5saXN0ZW5lcikgJiYgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGxpc3QpKSB7XG4gICAgZm9yIChpID0gbGVuZ3RoOyBpLS0gPiAwOykge1xuICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGxpc3RbaV0ubGlzdGVuZXIgJiYgbGlzdFtpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uIDwgMClcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaXN0LnNwbGljZShwb3NpdGlvbiwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIga2V5LCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgLy8gbm90IGxpc3RlbmluZyBmb3IgcmVtb3ZlTGlzdGVuZXIsIG5vIG5lZWQgdG8gZW1pdFxuICBpZiAoIXRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGZvciAoa2V5IGluIHRoaXMuX2V2ZW50cykge1xuICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhrZXkpO1xuICAgIH1cbiAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNGdW5jdGlvbihsaXN0ZW5lcnMpKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICB9IGVsc2Uge1xuICAgIC8vIExJRk8gb3JkZXJcbiAgICB3aGlsZSAobGlzdGVuZXJzLmxlbmd0aClcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzW2xpc3RlbmVycy5sZW5ndGggLSAxXSk7XG4gIH1cbiAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IFtdO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIGVsc2VcbiAgICByZXQgPSB0aGlzLl9ldmVudHNbdHlwZV0uc2xpY2UoKTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbkV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIWVtaXR0ZXIuX2V2ZW50cyB8fCAhZW1pdHRlci5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IDA7XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24oZW1pdHRlci5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSAxO1xuICBlbHNlXG4gICAgcmV0ID0gZW1pdHRlci5fZXZlbnRzW3R5cGVdLmxlbmd0aDtcbiAgcmV0dXJuIHJldDtcbn07XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0IGRlZmF1bHQge1xuXG4gIFRBU0tTOiB7XG4gICAgQ09NUExFVEU6ICd0YXNrLWNvbXBsZXRlJyxcbiAgICBDUkVBVEU6ICd0YXNrLWNyZWF0ZScsXG4gICAgREVTVFJPWTogJ3Rhc2stZGVzdHJveScsXG4gICAgVE9HR0xFX0NPTVBMRVRFX0FMTDogJ3Rhc2tzLWNvbXBsZXRlLWFsbCcsXG4gICAgVVBEQVRFOiAndGFzay11cGRhdGUnLFxuICAgIFVORE9fQ09NUExFVEU6ICd0YXNrLXVuZG8tY29tcGxldGUnXG4gIH1cblxufVxuXG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7RGlzcGF0Y2hlcn0gZnJvbSAnZmx1eCc7XG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IERpc3BhdGNoZXIoKTtcbiIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IGRpc3BhdGNoZXIgZnJvbSAnLi9kaXNwYXRjaGVyJztcbmltcG9ydCBjb25zdGFudHMgZnJvbSAnLi9jb25zdGFudHMnO1xuaW1wb3J0IHJvdXRlcyBmcm9tICcuL3JvdXRlcyc7XG5cbmV4cG9ydCBkZWZhdWx0IHtcblxuICBkaXNwYXRjaGVyOiBkaXNwYXRjaGVyLFxuXG4gIGNvbnN0YW50czogY29uc3RhbnRzLFxuXG4gIHJvdXRlczogcm91dGVzXG5cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbi8vIENvbXBvbmVudHNcbmltcG9ydCBBcHAgZnJvbSAnLi4vcGFnZXMvYXBwJztcbmltcG9ydCBIb21lIGZyb20gJy4uL3BhZ2VzL2hvbWUnO1xuaW1wb3J0IE5vdEZvdW5kIGZyb20gJy4uL3BhZ2VzL25vdC1mb3VuZCc7XG5pbXBvcnQgVGFza1BhZ2UgZnJvbSAnLi4vdGFza3MnO1xuXG4vLyBEZXBlbmRlbmNpZXNcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgUm91dGVyIGZyb20gJ3JlYWN0LXJvdXRlcic7XG5cbmxldCBSb3V0ZSAgPSBSb3V0ZXIuUm91dGU7XG5sZXQgRGVmYXVsdFJvdXRlID0gUm91dGVyLkRlZmF1bHRSb3V0ZTtcbmxldCBOb3RGb3VuZFJvdXRlID0gUm91dGVyLk5vdEZvdW5kUm91dGU7XG5cbnZhciByb3V0ZXMgPSAoXG4gIDxSb3V0ZSBwYXRoPVwiL1wiIGhhbmRsZXI9e0FwcH0+XG4gICAgPERlZmF1bHRSb3V0ZSBoYW5kbGVyPXtIb21lfSAvPlxuICAgIDxOb3RGb3VuZFJvdXRlIGhhbmRsZXI9e05vdEZvdW5kfS8+XG4gICAgPFJvdXRlIHBhdGg9XCJ0YXNrc1wiIGhhbmRsZXI9e1Rhc2tQYWdlfSAvPlxuICA8L1JvdXRlPlxuKTtcblxuZXhwb3J0IGRlZmF1bHQgcm91dGVzO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHtSb3V0ZUhhbmRsZXJ9IGZyb20gJ3JlYWN0LXJvdXRlcic7XG5cbmNsYXNzIEFwcCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdj5cbiAgICAgICAgey8qIHRoaXMgaXMgdGhlIGltcG9ydGFudCBwYXJ0ICovfVxuICAgICAgICA8Um91dGVIYW5kbGVyLz5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IEFwcDtcbiIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcblxuY2xhc3MgSG9tZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdj5cbiAgICAgICAgPGgyIGNsYXNzTmFtZT1cInRleHQtY2VudGVyXCI+IFJlYWN0IExpZmUgPC9oMj5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IEhvbWU7XG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5cbmNsYXNzIE5vdEZvdW5kIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcblxuICByZW5kZXIoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxoMT4gV2hhdCBZb3UgVGFsa2luZyBBYm91dCwgV2lsbGlzPzwvaDE+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9XG5cbn1cblxuXG5leHBvcnQgZGVmYXVsdCBOb3RGb3VuZDtcbiIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBUYXNrTGlzdCBmcm9tICcuL3Rhc2stbGlzdCc7XG5pbXBvcnQgVGFza3MgZnJvbSAnLi90YXNrcyc7XG5pbXBvcnQgVGFza0Zvcm0gZnJvbSAnLi90YXNrLWZvcm0nO1xuXG5jbGFzcyBUYXNrUGFnZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgdGFza3M6IFRhc2tzLmdldEFsbCgpXG4gICAgfTtcbiAgfVxuXG4gIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgIGxldCBjb21wb25lbnQgPSB0aGlzO1xuICAgIFRhc2tzLm9uKCdjaGFuZ2VkJywgZnVuY3Rpb24oKSB7XG4gICAgICBjb21wb25lbnQuc2V0U3RhdGUoeyB0YXNrczogVGFza3MuZ2V0QWxsKCkgfSk7XG4gICAgfSk7XG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgbGV0IHRhc2tzID0gT2JqZWN0LmtleXModGhpcy5zdGF0ZS50YXNrcykubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIHRoaXMuc3RhdGUudGFza3Nba2V5XTtcbiAgICB9KTtcblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cInBhZ2VcIj5cbiAgICAgICAgPGgyIGNsYXNzTmFtZT1cInRleHQtY2VudGVyXCI+IFRhc2tzIDwvaDI+XG4gICAgICAgIDxUYXNrRm9ybSAvPlxuICAgICAgICA8VGFza0xpc3QgdGFza3M9e3Rhc2tzfS8+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgVGFza1BhZ2U7XG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgdGFza3MgZnJvbSAnLi90YXNrcyc7XG5cbmNsYXNzIFRhc2tGb3JtIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICB9XG5cbiAgb25TdWJtaXQoKSB7XG4gICAgbGV0IHZhbHVlID0gdGhpcy5yZWZzLm5hbWUuZ2V0RE9NTm9kZSgpLnZhbHVlO1xuICAgIHRhc2tzLmFkZCh7IHRhc2s6IHZhbHVlIH0pO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIHJldHVybiAoXG4gICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJjYXJkXCI+XG4gICAgICAgIDxmb3JtIGNsYXNzTmFtZT1cInRhc2stZm9ybVwiIG9uU3VibWl0PXt0aGlzLm9uU3VibWl0LmJpbmQodGhpcyl9PlxuICAgICAgICAgIDxpbnB1dCBvbktleVVwPXt0aGlzLm9uS2V5VXB9XG4gICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiU2VhcmNoIHRhc2tzIG9yIGNyZWF0ZSBuZXcgdGFza1wiXG4gICAgICAgICAgICAgICAgIHJlZj1cIm5hbWVcIlxuICAgICAgICAgICAgICAgICByZXF1aXJlZFxuICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiIC8+XG4gICAgICAgIDwvZm9ybT5cbiAgICAgIDwvc2VjdGlvbj5cbiAgICApO1xuICB9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgVGFza0Zvcm07XG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5cbmNsYXNzIFRhc2tMaXN0IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcblxuICBjb25zdHJ1Y3RvciguLi5wcm9wcykge1xuICAgIHN1cGVyKC4uLnByb3BzKTtcbiAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgdGFza3M6IHRoaXMucHJvcHMudGFza3MgfHwgW11cbiAgICB9O1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIHJldHVybiAoXG4gICAgICA8dWw+XG4gICAgICAgIHt0aGlzLnN0YXRlLnRhc2tzLm1hcCh0YXNrID0+IDxsaT4ge3Rhc2sudGl0bGV9IDwvbGk+KX1cbiAgICAgIDwvdWw+XG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBUYXNrTGlzdDtcbiIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IGRpc3BhdGNoZXIgZnJvbSAnLi4vYXBwL2Rpc3BhdGNoZXInO1xuaW1wb3J0IGNvbnN0YW50cyBmcm9tICcuLi9hcHAvY29uc3RhbnRzJztcbmltcG9ydCB7RXZlbnRFbWl0dGVyfSBmcm9tICdldmVudHMnO1xuaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcblxubGV0IFRhc2tDb25zdGFudHMgPSBjb25zdGFudHMuVEFTS1M7XG52YXIgQ0hBTkdFX0VWRU5UID0gJ2NoYW5nZSc7XG5cbnZhciBfdGFza3MgPSB7fTtcblxuLyoqXG4gKiBDcmVhdGUgYSBUT0RPIGl0ZW0uXG4gKiBAcGFyYW0gIHtzdHJpbmd9IHRleHQgVGhlIGNvbnRlbnQgb2YgdGhlIFRPRE9cbiAqL1xuZnVuY3Rpb24gY3JlYXRlKHRleHQpIHtcbiAgLy8gSGFuZCB3YXZpbmcgaGVyZSAtLSBub3Qgc2hvd2luZyBob3cgdGhpcyBpbnRlcmFjdHMgd2l0aCBYSFIgb3IgcGVyc2lzdGVudFxuICAvLyBzZXJ2ZXItc2lkZSBzdG9yYWdlLlxuICAvLyBVc2luZyB0aGUgY3VycmVudCB0aW1lc3RhbXAgKyByYW5kb20gbnVtYmVyIGluIHBsYWNlIG9mIGEgcmVhbCBpZC5cbiAgdmFyIGlkID0gKCtuZXcgRGF0ZSgpICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogOTk5OTk5KSkudG9TdHJpbmcoMzYpO1xuICBfdGFza3NbaWRdID0ge1xuICAgIGlkOiBpZCxcbiAgICBjb21wbGV0ZTogZmFsc2UsXG4gICAgdGV4dDogdGV4dFxuICB9O1xufVxuXG4vKipcbiAqIFVwZGF0ZSBhIFRPRE8gaXRlbS5cbiAqIEBwYXJhbSAge3N0cmluZ30gaWRcbiAqIEBwYXJhbSB7b2JqZWN0fSB1cGRhdGVzIEFuIG9iamVjdCBsaXRlcmFsIGNvbnRhaW5pbmcgb25seSB0aGUgZGF0YSB0byBiZVxuICogICAgIHVwZGF0ZWQuXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZShpZCwgdXBkYXRlcykge1xuICBfdGFza3NbaWRdID0gXy5tZXJnZSh7fSwgX3Rhc2tzW2lkXSwgdXBkYXRlcyk7XG59XG5cbi8qKlxuICogVXBkYXRlIGFsbCBvZiB0aGUgVE9ETyBpdGVtcyB3aXRoIHRoZSBzYW1lIG9iamVjdC5cbiAqICAgICB0aGUgZGF0YSB0byBiZSB1cGRhdGVkLiAgVXNlZCB0byBtYXJrIGFsbCBUT0RPcyBhcyBjb21wbGV0ZWQuXG4gKiBAcGFyYW0gIHtvYmplY3R9IHVwZGF0ZXMgQW4gb2JqZWN0IGxpdGVyYWwgY29udGFpbmluZyBvbmx5IHRoZSBkYXRhIHRvIGJlXG4gKiAgICAgdXBkYXRlZC5cbiAqL1xuZnVuY3Rpb24gdXBkYXRlQWxsKHVwZGF0ZXMpIHtcbiAgZm9yICh2YXIgaWQgaW4gX3Rhc2tzKSB7XG4gICAgdXBkYXRlKGlkLCB1cGRhdGVzKTtcbiAgfVxufVxuXG4vKipcbiAqIERlbGV0ZSBhIFRPRE8gaXRlbS5cbiAqIEBwYXJhbSAge3N0cmluZ30gaWRcbiAqL1xuZnVuY3Rpb24gZGVzdHJveShpZCkge1xuICBkZWxldGUgX3Rhc2tzW2lkXTtcbn1cblxuLyoqXG4gKiBEZWxldGUgYWxsIHRoZSBjb21wbGV0ZWQgVE9ETyBpdGVtcy5cbiAqL1xuZnVuY3Rpb24gZGVzdHJveUNvbXBsZXRlZCgpIHtcbiAgZm9yICh2YXIgaWQgaW4gX3Rhc2tzKSB7XG4gICAgaWYgKF90YXNrc1tpZF0uY29tcGxldGUpIHtcbiAgICAgIGRlc3Ryb3koaWQpO1xuICAgIH1cbiAgfVxufVxuXG52YXIgVGFza1N0b3JlID0gXy5tZXJnZSh7fSwgRXZlbnRFbWl0dGVyLnByb3RvdHlwZSwge1xuXG4gIC8qKlxuICAgKiBUZXN0cyB3aGV0aGVyIGFsbCB0aGUgcmVtYWluaW5nIFRPRE8gaXRlbXMgYXJlIG1hcmtlZCBhcyBjb21wbGV0ZWQuXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAqL1xuICBhcmVBbGxDb21wbGV0ZTogZnVuY3Rpb24oKSB7XG4gICAgZm9yICh2YXIgaWQgaW4gX3Rhc2tzKSB7XG4gICAgICBpZiAoIV90YXNrc1tpZF0uY29tcGxldGUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSxcblxuICAvKipcbiAgICogR2V0IHRoZSBlbnRpcmUgY29sbGVjdGlvbiBvZiBUT0RPcy5cbiAgICogQHJldHVybiB7b2JqZWN0fVxuICAgKi9cbiAgZ2V0QWxsOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gX3Rhc2tzO1xuICB9LFxuXG4gIGVtaXRDaGFuZ2U6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZW1pdChDSEFOR0VfRVZFTlQpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFja1xuICAgKi9cbiAgYWRkQ2hhbmdlTGlzdGVuZXI6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgdGhpcy5vbihDSEFOR0VfRVZFTlQsIGNhbGxiYWNrKTtcbiAgfSxcblxuICAvKipcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2tcbiAgICovXG4gIHJlbW92ZUNoYW5nZUxpc3RlbmVyOiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoQ0hBTkdFX0VWRU5ULCBjYWxsYmFjayk7XG4gIH1cbn0pO1xuXG4vLyBSZWdpc3RlciBjYWxsYmFjayB0byBoYW5kbGUgYWxsIHVwZGF0ZXNcbmRpc3BhdGNoZXIucmVnaXN0ZXIoZnVuY3Rpb24oYWN0aW9uKSB7XG4gIGxldCB0ZXh0O1xuXG4gIHN3aXRjaChhY3Rpb24uYWN0aW9uVHlwZSkge1xuICAgIGNhc2UgVGFza0NvbnN0YW50cy5DUkVBVEU6XG4gICAgICB0ZXh0ID0gYWN0aW9uLnRleHQudHJpbSgpO1xuICAgICAgaWYgKHRleHQgIT09ICcnKSB7XG4gICAgICAgIGNyZWF0ZSh0ZXh0KTtcbiAgICAgICAgVGFza1N0b3JlLmVtaXRDaGFuZ2UoKTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSBUYXNrQ29uc3RhbnRzLlRPR0dMRV9DT01QTEVURV9BTEw6XG4gICAgICBpZiAoVGFza1N0b3JlLmFyZUFsbENvbXBsZXRlKCkpIHtcbiAgICAgICAgdXBkYXRlQWxsKHtjb21wbGV0ZTogZmFsc2V9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVwZGF0ZUFsbCh7Y29tcGxldGU6IHRydWV9KTtcbiAgICAgIH1cbiAgICAgIFRhc2tTdG9yZS5lbWl0Q2hhbmdlKCk7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgVGFza0NvbnN0YW50cy5VTkRPX0NPTVBMRVRFOlxuICAgICAgdXBkYXRlKGFjdGlvbi5pZCwge2NvbXBsZXRlOiBmYWxzZX0pO1xuICAgICAgVGFza1N0b3JlLmVtaXRDaGFuZ2UoKTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSBUYXNrQ29uc3RhbnRzLkNPTVBMRVRFOlxuICAgICAgdXBkYXRlKGFjdGlvbi5pZCwge2NvbXBsZXRlOiB0cnVlfSk7XG4gICAgICBUYXNrU3RvcmUuZW1pdENoYW5nZSgpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlIFRhc2tDb25zdGFudHMuVVBEQVRFOlxuICAgICAgdGV4dCA9IGFjdGlvbi50ZXh0LnRyaW0oKTtcbiAgICAgIGlmICh0ZXh0ICE9PSAnJykge1xuICAgICAgICB1cGRhdGUoYWN0aW9uLmlkLCB7dGV4dDogdGV4dH0pO1xuICAgICAgICBUYXNrU3RvcmUuZW1pdENoYW5nZSgpO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlIFRhc2tDb25zdGFudHMuREVTVFJPWTpcbiAgICAgIGRlc3Ryb3koYWN0aW9uLmlkKTtcbiAgICAgIFRhc2tTdG9yZS5lbWl0Q2hhbmdlKCk7XG4gICAgICBicmVhaztcblxuICAgIGRlZmF1bHQ6XG4gICAgLy8gbm8gb3BcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gVGFza1N0b3JlO1xuIl19
