(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

require("./dropbox-client.js");

var React = require("react");
var Router = require("react-router");
var App = require("./app");

// Initialize TouchEvents
React.initializeTouchEvents(true);

Router.run(App.routes, function (Handler) {
  React.render(React.createElement(Handler, null), document.querySelector("#app"));
});

// Or, if you'd like to use the HTML5 history API for cleaner URLs:
// Router.run(routes, Router.HistoryLocation, function (Handler) {
//   React.render(<Handler/>, document.querySelector('app'));
// });

},{"./app":8,"./dropbox-client.js":10,"react":"react","react-router":"react-router"}],2:[function(require,module,exports){
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

var React = require("react");

module.exports = React.createClass({
  displayName: "exports",

  onSubmit: function onSubmit(event) {
    event.preventDefault();
  },

  render: function render() {
    return React.createElement(
      "form",
      { onSubmit: this.onSubmit },
      React.createElement("input", { type: "text", name: "activity.name", ref: "name" }),
      React.createElement(
        "button",
        null,
        " Start Tracking "
      )
    );
  }

});

},{"react":"react"}],4:[function(require,module,exports){
"use strict";

var React = require("react");

module.exports = React.createClass({
  displayName: "exports",

  render: function render() {
    return React.createElement("ul", null);
  }

});

},{"react":"react"}],5:[function(require,module,exports){
"use strict";

var React = require("react");
var ActivityForm = require("./activity-form");
var ActivityList = require("./activity-list");

module.exports = React.createClass({
  displayName: "exports",

  render: function render() {
    return React.createElement(
      "div",
      null,
      React.createElement(
        "h3",
        { className: "text-center" },
        " Activity "
      ),
      React.createElement(ActivityForm, null),
      React.createElement(ActivityList, null)
    );
  }

});

},{"./activity-form":3,"./activity-list":4,"react":"react"}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
"use strict";

var Dispatcher = require("flux").Dispatcher;

module.exports = new Dispatcher();

},{"flux":"flux"}],8:[function(require,module,exports){
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

},{"./constants":6,"./dispatcher":7,"./routes":9}],9:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

// Components

var App = _interopRequire(require("../pages/app"));

var Home = _interopRequire(require("../pages/home"));

var NotFound = _interopRequire(require("../pages/not-found"));

var TaskPage = _interopRequire(require("../tasks"));

var ActivityPage = _interopRequire(require("../activity"));

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
  React.createElement(Route, { path: "tasks", handler: TaskPage }),
  React.createElement(Route, { path: "activity", handler: ActivityPage })
);

module.exports = routes;

},{"../activity":5,"../pages/app":11,"../pages/home":12,"../pages/not-found":13,"../tasks":15,"react":"react","react-router":"react-router"}],10:[function(require,module,exports){
"use strict";

var client = new Dropbox.Client({ key: "w2ncihown3ze0at" });

// Try to finish OAuth authorization.
client.authenticate({ interactive: false }, function (error) {
  if (error) {
    alert("Authentication error: " + error);
  }
});

module.exports = {

  client: client,

  manager: function manager() {
    if (client.isAuthenticated()) {
      return client.getDatastoreManager();
    }

    return client.authenticate();
  },

  /**
   * Retrieve table from datastore
   * @param {string} tableName
   * @returns {Promise}
   */
  getTable: function getTable(tableName) {
    var datastoreManager = this.manager();
    return new Promise(function (resolve, reject) {
      datastoreManager.openDefaultDatastore(function (error, store) {
        if (error) {
          return reject(error);
        }

        // Return table from datastore
        return resolve(store.getTable(tableName));
      });
    });
  }

};

},{}],11:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var React = _interopRequire(require("react"));

var RouteHandler = require("react-router").RouteHandler;

var client = require("../dropbox-client").client;

var dispatcher = _interopRequire(require("../app/dispatcher"));

module.exports = React.createClass({
  displayName: "app",

  componentDidMount: function componentDidMount() {
    if (client.isAuthenticated()) {
      client.getAccountInfo(function (err, account) {
        if (err) return console.warn("Error communicating with Dropbox:", err);

        dispatcher.dispatch({
          actionType: "user:authenicated",
          data: account
        });
      });
    }
  },

  render: function render() {
    return React.createElement(
      "div",
      null,
      React.createElement(RouteHandler, null)
    );
  }

});
/* this is the important part */

},{"../app/dispatcher":7,"../dropbox-client":10,"react":"react","react-router":"react-router"}],12:[function(require,module,exports){
"use strict";

var React = require("react");
var dropbox = require("../dropbox-client").client;

module.exports = React.createClass({
  displayName: "home",

  getInitialState: function getInitialState() {
    return {
      authenticated: dropbox.isAuthenticated()
    };
  },

  connectDropbox: function connectDropbox() {
    if (!this.state.authenticated) {
      dropbox.authenticate();
    }
  },

  render: function render() {
    return React.createElement(
      "section",
      { className: "text-center home" },
      React.createElement(
        "button",
        {
          style: {
            display: this.state.authenticated ? "none" : "block",
            margin: "0 auto"
          },
          onClick: this.connectDropbox },
        " Connect Your Dropbox "
      )
    );
  }

});

},{"../dropbox-client":10,"react":"react"}],13:[function(require,module,exports){
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

},{"react":"react"}],14:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var React = _interopRequire(require("react"));

var dispatcher = _interopRequire(require("../app/dispatcher"));

module.exports = React.createClass({
  displayName: "hashtags",

  getInitialState: function getInitialState() {
    for (var _len = arguments.length, props = Array(_len), _key = 0; _key < _len; _key++) {
      props[_key] = arguments[_key];
    }

    return {};
  },

  _onClick: function _onClick(hashtag) {
    // Check if hashtag is same as currently selected
    var isSelected = this.state.selected === hashtag;

    // Set selected hashtag to state
    this.setState({ selected: hashtag });

    // Dispatch search by hashtag
    dispatcher.dispatch({
      actionType: "search:hashtag",
      data: isSelected ? undefined : hashtag
    });
  },

  render: function render() {
    var _this = this;

    return React.createElement(
      "ul",
      { className: "task-hashtags-list" },
      this.props.hashtags.map(function (hashTag) {
        return React.createElement(
          "li",
          { key: hashTag,
            className: { selected: _this.state.selected === hashTag } },
          React.createElement(
            "a",
            { onClick: _this._onClick.bind(_this, hashTag) },
            { hashTag: hashTag }
          )
        );
      })
    );
  }

});

},{"../app/dispatcher":7,"react":"react"}],15:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var React = _interopRequire(require("react"));

var TaskList = _interopRequire(require("./task-list"));

var Tasks = _interopRequire(require("./store"));

var TaskForm = _interopRequire(require("./task-form"));

var Hashtags = _interopRequire(require("./hashtags"));

var dispatcher = _interopRequire(require("../app/dispatcher"));

var dropbox = require("../dropbox-client");

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
    _onChange: {
      value: function _onChange() {
        this.setState({ tasks: Tasks.getAll() });
      }
    },
    componentWillMount: {
      value: function componentWillMount() {
        var _this = this;

        return dropbox.getTable("tasks").then(function (store) {
          return _this.setState({ store: store });
        });
      }
    },
    componentDidMount: {
      value: function componentDidMount() {
        var _this = this;

        // Register with app dispatcher
        this.token = dispatcher.register(function (payload) {
          switch (payload.actionType) {
            case "search:hashtag":
              _this.setState({
                tasks: Tasks.getByHashtag(payload.data)
              });
          }
        });

        // Watch for changes to Tasks
        Tasks.addChangeListener(this._onChange.bind(this));
      }
    },
    componentWillUnmount: {
      value: function componentWillUnmount() {
        // Unregister from app dispatcher
        dispatcher.unregister(this.token);
        // Unwatch for changes to Tasks
        Tasks.removeChangeListener(this._onChange.bind(this));
      }
    },
    render: {
      value: function render() {
        var _this = this;

        var tasks = Object.keys(this.state.tasks).map(function (key) {
          return _this.state.tasks[key];
        });

        var hashtags = Tasks.getHashtags();

        return React.createElement(
          "div",
          { className: "page" },
          React.createElement(
            "h4",
            { className: "text-center" },
            " Tasks "
          ),
          React.createElement(Hashtags, { hashtags: hashtags }),
          React.createElement(TaskForm, null),
          this.state.store ? React.createElement(TaskList, { tasks: tasks }) : React.createElement(
            "span",
            null,
            " Loading Tasks "
          )
        );
      }
    }
  });

  return TaskPage;
})(React.Component);

module.exports = TaskPage;

},{"../app/dispatcher":7,"../dropbox-client":10,"./hashtags":14,"./store":16,"./task-form":17,"./task-list":18,"react":"react"}],16:[function(require,module,exports){
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
 * Create a new task
 * @param  {string} task
 */
function create(task) {
  task.id = (+new Date() + Math.floor(Math.random() * 999999)).toString(36);
  task.complete = false;
  task.hashtags = TaskStore.parseHashtags(task.description);
  _tasks[task.id] = task;
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

  toArray: function toArray() {
    return Object.keys(_tasks).map(function (id) {
      return _tasks[id];
    });
  },

  /**
   * @description Get store's records filtered on property by value
   * @param  {*} property Property to filter records on
   * @param  {*} value    Value to filter for
   * @return {Array}
   */
  getBy: function getBy(property, value, not) {
    var tasks = this.toArray();
    if (not) {
      return tasks.filter(function (record) {
        return record[property] !== value;
      });
    } else {
      return tasks.filter(function (record) {
        return record[property] === value;
      });
    }
  },

  getByHashtag: function getByHashtag(hashtag) {
    return this.toArray().filter(function (task) {
      return ~task.hashtags.indexOf(hashtag);
    });
  },

  /**
   * @description Get hashtags from store's records
   * @returns {Array}
   */
  getHashtags: function getHashtags() {
    var hashtags = [];
    //let tasks = Object.keys(_tasks).map(id => _tasks[id]);

    this.toArray().forEach(function (task) {
      if (task.hashtags) task.hashtags.forEach(function (hashtag) {
        if (! ~hashtags.indexOf(hashtag)) hashtags.push(hashtag);
      });
    });

    return hashtags;
  },

  /**
   * @description Get array of hashtags from text
   * @param  {String} text Text to search for hashtags
   * @return {Array}      List of hashtags
   */
  parseHashtags: function parseHashtags(text) {
    return text.match(/(#[a-z\d][\w-]*)/ig) || [];
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
      if (action.data.description !== "") {
        create(action.data);
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

},{"../app/constants":6,"../app/dispatcher":7,"events":2,"lodash":"lodash"}],17:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var React = _interopRequire(require("react"));

var dispatcher = _interopRequire(require("../app/dispatcher"));

var constants = _interopRequire(require("../app/constants"));

module.exports = React.createClass({
  displayName: "task-form",

  getInitialState: function getInitialState() {
    return {};
  },

  /**
   * Handle form submission
   * @param {SyntheticEvent} event
   */
  onSubmit: function onSubmit(event) {
    event.preventDefault();

    // Empty input value
    this.setState({ value: "" });

    // Dispatch task creation event
    dispatcher.dispatch({
      actionType: constants.TASKS.CREATE,
      data: {
        description: this.refs.name.getDOMNode().value
      }
    });
  },

  /**
   * Set value of input field to state.value on change
   */
  onChange: function onChange() {
    this.setState({ value: this.refs.name.getDOMNode().value });
  },

  render: function render() {
    return React.createElement(
      "section",
      { className: "card" },
      React.createElement(
        "form",
        { className: "task-form", onSubmit: this.onSubmit },
        React.createElement("input", { onChange: this.onChange,
          placeholder: "Search tasks or create new task",
          ref: "name",
          required: true,
          type: "text",
          value: this.state.value })
      )
    );
  }

});

},{"../app/constants":6,"../app/dispatcher":7,"react":"react"}],18:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var React = _interopRequire(require("react"));

module.exports = React.createClass({
  displayName: "task-list",

  render: function render() {
    return React.createElement(
      "ul",
      { className: "task-list" },
      this.props.tasks.map(function (task) {
        return React.createElement(
          "li",
          { key: task.id, className: "task-list-item" },
          React.createElement("input", { type: "checkbox", value: task.completed }),
          React.createElement(
            "span",
            null,
            task.description
          )
        );
      })
    );
  }

});

},{"react":"react"}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvY2hhcmxlc3BvbnRpL0RldmVsb3Blci9yZWFjdGpzLWxpZmUvc3JjL21haW4uanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsIi9Vc2Vycy9jaGFybGVzcG9udGkvRGV2ZWxvcGVyL3JlYWN0anMtbGlmZS9zcmMvYWN0aXZpdHkvYWN0aXZpdHktZm9ybS5qcyIsIi9Vc2Vycy9jaGFybGVzcG9udGkvRGV2ZWxvcGVyL3JlYWN0anMtbGlmZS9zcmMvYWN0aXZpdHkvYWN0aXZpdHktbGlzdC5qcyIsIi9Vc2Vycy9jaGFybGVzcG9udGkvRGV2ZWxvcGVyL3JlYWN0anMtbGlmZS9zcmMvYWN0aXZpdHkvaW5kZXguanMiLCIvVXNlcnMvY2hhcmxlc3BvbnRpL0RldmVsb3Blci9yZWFjdGpzLWxpZmUvc3JjL2FwcC9jb25zdGFudHMuanMiLCIvVXNlcnMvY2hhcmxlc3BvbnRpL0RldmVsb3Blci9yZWFjdGpzLWxpZmUvc3JjL2FwcC9kaXNwYXRjaGVyLmpzIiwiL1VzZXJzL2NoYXJsZXNwb250aS9EZXZlbG9wZXIvcmVhY3Rqcy1saWZlL3NyYy9hcHAvaW5kZXguanMiLCIvVXNlcnMvY2hhcmxlc3BvbnRpL0RldmVsb3Blci9yZWFjdGpzLWxpZmUvc3JjL2FwcC9yb3V0ZXMuanMiLCIvVXNlcnMvY2hhcmxlc3BvbnRpL0RldmVsb3Blci9yZWFjdGpzLWxpZmUvc3JjL2Ryb3Bib3gtY2xpZW50LmpzIiwiL1VzZXJzL2NoYXJsZXNwb250aS9EZXZlbG9wZXIvcmVhY3Rqcy1saWZlL3NyYy9wYWdlcy9hcHAuanMiLCIvVXNlcnMvY2hhcmxlc3BvbnRpL0RldmVsb3Blci9yZWFjdGpzLWxpZmUvc3JjL3BhZ2VzL2hvbWUuanMiLCIvVXNlcnMvY2hhcmxlc3BvbnRpL0RldmVsb3Blci9yZWFjdGpzLWxpZmUvc3JjL3BhZ2VzL25vdC1mb3VuZC5qcyIsIi9Vc2Vycy9jaGFybGVzcG9udGkvRGV2ZWxvcGVyL3JlYWN0anMtbGlmZS9zcmMvdGFza3MvaGFzaHRhZ3MuanMiLCIvVXNlcnMvY2hhcmxlc3BvbnRpL0RldmVsb3Blci9yZWFjdGpzLWxpZmUvc3JjL3Rhc2tzL2luZGV4LmpzIiwiL1VzZXJzL2NoYXJsZXNwb250aS9EZXZlbG9wZXIvcmVhY3Rqcy1saWZlL3NyYy90YXNrcy9zdG9yZS5qcyIsIi9Vc2Vycy9jaGFybGVzcG9udGkvRGV2ZWxvcGVyL3JlYWN0anMtbGlmZS9zcmMvdGFza3MvdGFzay1mb3JtLmpzIiwiL1VzZXJzL2NoYXJsZXNwb250aS9EZXZlbG9wZXIvcmVhY3Rqcy1saWZlL3NyYy90YXNrcy90YXNrLWxpc3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSxZQUFZLENBQUM7O1FBRU4scUJBQXFCOztBQUU1QixJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDN0IsSUFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3JDLElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQzs7O0FBRzNCLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQzs7QUFFbEMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLFVBQVUsT0FBTyxFQUFFO0FBQ3hDLE9BQUssQ0FBQyxNQUFNLENBQUMsb0JBQUMsT0FBTyxPQUFFLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0NBQzFELENBQUMsQ0FBQzs7Ozs7Ozs7QUNiSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QVMsU0FBUyxFQUFDLE1BQU07TUFDdkI7O1VBQU0sU0FBUyxFQUFDLFdBQVcsRUFBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsQUFBQztRQUNsRCwrQkFBTyxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsQUFBQztBQUN4QixxQkFBVyxFQUFDLGlDQUFpQztBQUM3QyxhQUFHLEVBQUMsTUFBTTtBQUNWLGtCQUFRLE1BQUE7QUFDUixjQUFJLEVBQUMsTUFBTTtBQUNYLGVBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQUFBQyxHQUFFO09BQzVCO0tBQ0MsQ0FDVjtHQUNIOztDQUVGLENBQUM7OztBQ3JERixZQUFZLENBQUM7Ozs7SUFFTixLQUFLLDJCQUFNLE9BQU87O2lCQUVWLEtBQUssQ0FBQyxXQUFXLENBQUM7OztBQUUvQixRQUFNLEVBQUUsa0JBQVc7QUFDakIsV0FDRTs7UUFBSSxTQUFTLEVBQUMsV0FBVztNQUN0QixJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsVUFBQyxJQUFJLEVBQUs7QUFDOUIsZUFDRTs7WUFBSSxHQUFHLEVBQUUsSUFBSSxDQUFDLEVBQUUsQUFBQyxFQUFDLFNBQVMsRUFBQyxnQkFBZ0I7VUFDMUMsK0JBQU8sSUFBSSxFQUFDLFVBQVUsRUFBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFNBQVMsQUFBQyxHQUFHO1VBQ2hEOzs7WUFBTyxJQUFJLENBQUMsV0FBVztXQUFRO1NBQzVCLENBQ0w7T0FDSCxDQUFDO0tBQ0MsQ0FDTDtHQUNIOztDQUVGLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgJy4vZHJvcGJveC1jbGllbnQuanMnO1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xudmFyIFJvdXRlciA9IHJlcXVpcmUoJ3JlYWN0LXJvdXRlcicpO1xudmFyIEFwcCA9IHJlcXVpcmUoJy4vYXBwJyk7XG5cbi8vIEluaXRpYWxpemUgVG91Y2hFdmVudHNcblJlYWN0LmluaXRpYWxpemVUb3VjaEV2ZW50cyh0cnVlKTtcblxuUm91dGVyLnJ1bihBcHAucm91dGVzLCBmdW5jdGlvbiAoSGFuZGxlcikge1xuICBSZWFjdC5yZW5kZXIoPEhhbmRsZXIvPiwgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FwcCcpKTtcbn0pO1xuXG4vLyBPciwgaWYgeW91J2QgbGlrZSB0byB1c2UgdGhlIEhUTUw1IGhpc3RvcnkgQVBJIGZvciBjbGVhbmVyIFVSTHM6XG4vLyBSb3V0ZXIucnVuKHJvdXRlcywgUm91dGVyLkhpc3RvcnlMb2NhdGlvbiwgZnVuY3Rpb24gKEhhbmRsZXIpIHtcbi8vICAgUmVhY3QucmVuZGVyKDxIYW5kbGVyLz4sIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2FwcCcpKTtcbi8vIH0pO1xuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgdGhpcy5fZXZlbnRzID0gdGhpcy5fZXZlbnRzIHx8IHt9O1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSB0aGlzLl9tYXhMaXN0ZW5lcnMgfHwgdW5kZWZpbmVkO1xufVxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuMTAueFxuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzID0gdW5kZWZpbmVkO1xuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuIDEwIGxpc3RlbmVycyBhcmVcbi8vIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2ggaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG5FdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gIGlmICghaXNOdW1iZXIobikgfHwgbiA8IDAgfHwgaXNOYU4obikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCduIG11c3QgYmUgYSBwb3NpdGl2ZSBudW1iZXInKTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBlciwgaGFuZGxlciwgbGVuLCBhcmdzLCBpLCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgIGlmICghdGhpcy5fZXZlbnRzLmVycm9yIHx8XG4gICAgICAgIChpc09iamVjdCh0aGlzLl9ldmVudHMuZXJyb3IpICYmICF0aGlzLl9ldmVudHMuZXJyb3IubGVuZ3RoKSkge1xuICAgICAgZXIgPSBhcmd1bWVudHNbMV07XG4gICAgICBpZiAoZXIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH1cbiAgICAgIHRocm93IFR5cGVFcnJvcignVW5jYXVnaHQsIHVuc3BlY2lmaWVkIFwiZXJyb3JcIiBldmVudC4nKTtcbiAgICB9XG4gIH1cblxuICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc1VuZGVmaW5lZChoYW5kbGVyKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKGlzRnVuY3Rpb24oaGFuZGxlcikpIHtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIGZhc3QgY2FzZXNcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICAgICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChpc09iamVjdChoYW5kbGVyKSkge1xuICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcblxuICAgIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBtO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09PSBcIm5ld0xpc3RlbmVyXCIhIEJlZm9yZVxuICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyXCIuXG4gIGlmICh0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpXG4gICAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsXG4gICAgICAgICAgICAgIGlzRnVuY3Rpb24obGlzdGVuZXIubGlzdGVuZXIpID9cbiAgICAgICAgICAgICAgbGlzdGVuZXIubGlzdGVuZXIgOiBsaXN0ZW5lcik7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gIGVsc2UgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZVxuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcblxuICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSAmJiAhdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCkge1xuICAgIHZhciBtO1xuICAgIGlmICghaXNVbmRlZmluZWQodGhpcy5fbWF4TGlzdGVuZXJzKSkge1xuICAgICAgbSA9IHRoaXMuX21heExpc3RlbmVycztcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgIH1cblxuICAgIGlmIChtICYmIG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xuICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGgpO1xuICAgICAgaWYgKHR5cGVvZiBjb25zb2xlLnRyYWNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIC8vIG5vdCBzdXBwb3J0ZWQgaW4gSUUgMTBcbiAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICB2YXIgZmlyZWQgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBnKCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG5cbiAgICBpZiAoIWZpcmVkKSB7XG4gICAgICBmaXJlZCA9IHRydWU7XG4gICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfVxuXG4gIGcubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgdGhpcy5vbih0eXBlLCBnKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGVtaXRzIGEgJ3JlbW92ZUxpc3RlbmVyJyBldmVudCBpZmYgdGhlIGxpc3RlbmVyIHdhcyByZW1vdmVkXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIGxpc3QsIHBvc2l0aW9uLCBsZW5ndGgsIGk7XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgbGVuZ3RoID0gbGlzdC5sZW5ndGg7XG4gIHBvc2l0aW9uID0gLTE7XG5cbiAgaWYgKGxpc3QgPT09IGxpc3RlbmVyIHx8XG4gICAgICAoaXNGdW5jdGlvbihsaXN0Lmxpc3RlbmVyKSAmJiBsaXN0Lmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuXG4gIH0gZWxzZSBpZiAoaXNPYmplY3QobGlzdCkpIHtcbiAgICBmb3IgKGkgPSBsZW5ndGg7IGktLSA+IDA7KSB7XG4gICAgICBpZiAobGlzdFtpXSA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICAgICAobGlzdFtpXS5saXN0ZW5lciAmJiBsaXN0W2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9zaXRpb24gPCAwKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgIGxpc3QubGVuZ3RoID0gMDtcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3Quc3BsaWNlKHBvc2l0aW9uLCAxKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBrZXksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICByZXR1cm4gdGhpcztcblxuICAvLyBub3QgbGlzdGVuaW5nIGZvciByZW1vdmVMaXN0ZW5lciwgbm8gbmVlZCB0byBlbWl0XG4gIGlmICghdGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZW1pdCByZW1vdmVMaXN0ZW5lciBmb3IgYWxsIGxpc3RlbmVycyBvbiBhbGwgZXZlbnRzXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgZm9yIChrZXkgaW4gdGhpcy5fZXZlbnRzKSB7XG4gICAgICBpZiAoa2V5ID09PSAncmVtb3ZlTGlzdGVuZXInKSBjb250aW51ZTtcbiAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKGtleSk7XG4gICAgfVxuICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZW1vdmVMaXN0ZW5lcicpO1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGxpc3RlbmVycykpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVycyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gTElGTyBvcmRlclxuICAgIHdoaWxlIChsaXN0ZW5lcnMubGVuZ3RoKVxuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbbGlzdGVuZXJzLmxlbmd0aCAtIDFdKTtcbiAgfVxuICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gW107XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24odGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcbiAgZWxzZVxuICAgIHJldCA9IHRoaXMuX2V2ZW50c1t0eXBlXS5zbGljZSgpO1xuICByZXR1cm4gcmV0O1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghZW1pdHRlci5fZXZlbnRzIHx8ICFlbWl0dGVyLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gMDtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbihlbWl0dGVyLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IDE7XG4gIGVsc2VcbiAgICByZXQgPSBlbWl0dGVyLl9ldmVudHNbdHlwZV0ubGVuZ3RoO1xuICByZXR1cm4gcmV0O1xufTtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIG9uU3VibWl0KGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICB9LFxuXG4gIHJlbmRlcigpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPGZvcm0gb25TdWJtaXQ9e3RoaXMub25TdWJtaXR9PlxuICAgICAgICA8aW5wdXQgdHlwZT1cInRleHRcIiBuYW1lPVwiYWN0aXZpdHkubmFtZVwiIHJlZj1cIm5hbWVcIiAvPlxuICAgICAgICA8YnV0dG9uPiBTdGFydCBUcmFja2luZyA8L2J1dHRvbj5cbiAgICAgIDwvZm9ybT5cbiAgICApXG4gIH1cblxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbmNvbnN0IFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgcmVuZGVyKCkge1xuICAgIHJldHVybiAoXG4gICAgICA8dWw+XG4gICAgICA8L3VsPlxuICAgIClcbiAgfVxuXG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuY29uc3QgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xuY29uc3QgQWN0aXZpdHlGb3JtID0gcmVxdWlyZSgnLi9hY3Rpdml0eS1mb3JtJyk7XG5jb25zdCBBY3Rpdml0eUxpc3QgPSByZXF1aXJlKCcuL2FjdGl2aXR5LWxpc3QnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgcmVuZGVyKCkge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8aDMgY2xhc3NOYW1lPVwidGV4dC1jZW50ZXJcIj4gQWN0aXZpdHkgPC9oMz5cbiAgICAgICAgPEFjdGl2aXR5Rm9ybSAvPlxuICAgICAgICA8QWN0aXZpdHlMaXN0IC8+XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cblxufSk7XG5cbiIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0IGRlZmF1bHQge1xuXG4gIFRBU0tTOiB7XG4gICAgQ09NUExFVEU6ICd0YXNrLWNvbXBsZXRlJyxcbiAgICBDUkVBVEU6ICd0YXNrLWNyZWF0ZScsXG4gICAgREVTVFJPWTogJ3Rhc2stZGVzdHJveScsXG4gICAgVE9HR0xFX0NPTVBMRVRFX0FMTDogJ3Rhc2tzLWNvbXBsZXRlLWFsbCcsXG4gICAgVVBEQVRFOiAndGFzay11cGRhdGUnLFxuICAgIFVORE9fQ09NUExFVEU6ICd0YXNrLXVuZG8tY29tcGxldGUnXG4gIH1cblxufVxuXG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7RGlzcGF0Y2hlcn0gZnJvbSAnZmx1eCc7XG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IERpc3BhdGNoZXIoKTtcbiIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IGRpc3BhdGNoZXIgZnJvbSAnLi9kaXNwYXRjaGVyJztcbmltcG9ydCBjb25zdGFudHMgZnJvbSAnLi9jb25zdGFudHMnO1xuaW1wb3J0IHJvdXRlcyBmcm9tICcuL3JvdXRlcyc7XG5cbmV4cG9ydCBkZWZhdWx0IHtcblxuICBkaXNwYXRjaGVyOiBkaXNwYXRjaGVyLFxuXG4gIGNvbnN0YW50czogY29uc3RhbnRzLFxuXG4gIHJvdXRlczogcm91dGVzXG5cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbi8vIENvbXBvbmVudHNcbmltcG9ydCBBcHAgZnJvbSAnLi4vcGFnZXMvYXBwJztcbmltcG9ydCBIb21lIGZyb20gJy4uL3BhZ2VzL2hvbWUnO1xuaW1wb3J0IE5vdEZvdW5kIGZyb20gJy4uL3BhZ2VzL25vdC1mb3VuZCc7XG5pbXBvcnQgVGFza1BhZ2UgZnJvbSAnLi4vdGFza3MnO1xuaW1wb3J0IEFjdGl2aXR5UGFnZSBmcm9tICcuLi9hY3Rpdml0eSc7XG5cbi8vIERlcGVuZGVuY2llc1xuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBSb3V0ZXIgZnJvbSAncmVhY3Qtcm91dGVyJztcblxubGV0IFJvdXRlICA9IFJvdXRlci5Sb3V0ZTtcbmxldCBEZWZhdWx0Um91dGUgPSBSb3V0ZXIuRGVmYXVsdFJvdXRlO1xubGV0IE5vdEZvdW5kUm91dGUgPSBSb3V0ZXIuTm90Rm91bmRSb3V0ZTtcblxudmFyIHJvdXRlcyA9IChcbiAgPFJvdXRlIHBhdGg9XCIvXCIgaGFuZGxlcj17QXBwfT5cbiAgICA8RGVmYXVsdFJvdXRlIGhhbmRsZXI9e0hvbWV9IC8+XG4gICAgPE5vdEZvdW5kUm91dGUgaGFuZGxlcj17Tm90Rm91bmR9Lz5cbiAgICA8Um91dGUgcGF0aD1cInRhc2tzXCIgaGFuZGxlcj17VGFza1BhZ2V9IC8+XG4gICAgPFJvdXRlIHBhdGg9XCJhY3Rpdml0eVwiIGhhbmRsZXI9e0FjdGl2aXR5UGFnZX0gLz5cbiAgPC9Sb3V0ZT5cbik7XG5cbmV4cG9ydCBkZWZhdWx0IHJvdXRlcztcbiIsIid1c2Ugc3RyaWN0JztcblxuY29uc3QgY2xpZW50ID0gbmV3IERyb3Bib3guQ2xpZW50KHtrZXk6ICd3Mm5jaWhvd24zemUwYXQnIH0pO1xuXG4vLyBUcnkgdG8gZmluaXNoIE9BdXRoIGF1dGhvcml6YXRpb24uXG5jbGllbnQuYXV0aGVudGljYXRlKHtpbnRlcmFjdGl2ZTogZmFsc2V9LCBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgaWYgKGVycm9yKSB7XG4gICAgYWxlcnQoJ0F1dGhlbnRpY2F0aW9uIGVycm9yOiAnICsgZXJyb3IpO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgY2xpZW50OiBjbGllbnQsXG5cbiAgbWFuYWdlcjogZnVuY3Rpb24oKSB7XG4gICAgaWYgKGNsaWVudC5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgcmV0dXJuIGNsaWVudC5nZXREYXRhc3RvcmVNYW5hZ2VyKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNsaWVudC5hdXRoZW50aWNhdGUoKTtcbiAgfSxcblxuICAvKipcbiAgICogUmV0cmlldmUgdGFibGUgZnJvbSBkYXRhc3RvcmVcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhYmxlTmFtZVxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICovXG4gIGdldFRhYmxlOiBmdW5jdGlvbih0YWJsZU5hbWUpIHtcbiAgICBjb25zdCBkYXRhc3RvcmVNYW5hZ2VyID0gdGhpcy5tYW5hZ2VyKCk7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGRhdGFzdG9yZU1hbmFnZXIub3BlbkRlZmF1bHREYXRhc3RvcmUoZnVuY3Rpb24oZXJyb3IsIHN0b3JlKSB7XG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgIHJldHVybiByZWplY3QoZXJyb3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmV0dXJuIHRhYmxlIGZyb20gZGF0YXN0b3JlXG4gICAgICAgIHJldHVybiByZXNvbHZlKHN0b3JlLmdldFRhYmxlKHRhYmxlTmFtZSkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxufTtcblxuXG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQge1JvdXRlSGFuZGxlcn0gZnJvbSAncmVhY3Qtcm91dGVyJztcbmltcG9ydCB7Y2xpZW50fSBmcm9tICcuLi9kcm9wYm94LWNsaWVudCc7XG5pbXBvcnQgZGlzcGF0Y2hlciBmcm9tICcuLi9hcHAvZGlzcGF0Y2hlcic7XG5cbmV4cG9ydCBkZWZhdWx0IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICBpZiAoY2xpZW50LmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICBjbGllbnQuZ2V0QWNjb3VudEluZm8oZnVuY3Rpb24oZXJyLCBhY2NvdW50KSB7XG4gICAgICAgIGlmIChlcnIpXG4gICAgICAgICAgcmV0dXJuIGNvbnNvbGUud2FybignRXJyb3IgY29tbXVuaWNhdGluZyB3aXRoIERyb3Bib3g6JywgZXJyKTtcblxuICAgICAgICBkaXNwYXRjaGVyLmRpc3BhdGNoKHtcbiAgICAgICAgICBhY3Rpb25UeXBlOiAndXNlcjphdXRoZW5pY2F0ZWQnLFxuICAgICAgICAgIGRhdGE6IGFjY291bnRcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG5cbiAgcmVuZGVyKCkge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2PlxuICAgICAgICB7LyogdGhpcyBpcyB0aGUgaW1wb3J0YW50IHBhcnQgKi99XG4gICAgICAgIDxSb3V0ZUhhbmRsZXIvPlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG5cbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5jb25zdCBkcm9wYm94ID0gcmVxdWlyZSgnLi4vZHJvcGJveC1jbGllbnQnKS5jbGllbnQ7XG5cbmV4cG9ydCBkZWZhdWx0IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICBnZXRJbml0aWFsU3RhdGUoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGF1dGhlbnRpY2F0ZWQ6IGRyb3Bib3guaXNBdXRoZW50aWNhdGVkKClcbiAgICB9XG4gIH0sXG5cbiAgY29ubmVjdERyb3Bib3goKSB7XG4gICAgaWYgKCF0aGlzLnN0YXRlLmF1dGhlbnRpY2F0ZWQpIHtcbiAgICAgIGRyb3Bib3guYXV0aGVudGljYXRlKCk7XG4gICAgfVxuICB9LFxuXG4gIHJlbmRlcigpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPVwidGV4dC1jZW50ZXIgaG9tZVwiPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgIGRpc3BsYXk6IHRoaXMuc3RhdGUuYXV0aGVudGljYXRlZCA/ICdub25lJyA6ICdibG9jaycsXG4gICAgICAgICAgICBtYXJnaW46ICcwIGF1dG8nXG4gICAgICAgICAgfX1cbiAgICAgICAgICBvbkNsaWNrPXt0aGlzLmNvbm5lY3REcm9wYm94fT4gQ29ubmVjdCBZb3VyIERyb3Bib3ggPC9idXR0b24+XG4gICAgICA8L3NlY3Rpb24+XG4gICAgKVxuICB9XG5cbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuXG5jbGFzcyBOb3RGb3VuZCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG5cbiAgcmVuZGVyKCkge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8aDE+IFdoYXQgWW91IFRhbGtpbmcgQWJvdXQsIFdpbGxpcz88L2gxPlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfVxuXG59XG5cblxuZXhwb3J0IGRlZmF1bHQgTm90Rm91bmQ7XG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgZGlzcGF0Y2hlciBmcm9tICcuLi9hcHAvZGlzcGF0Y2hlcic7XG5cbmV4cG9ydCBkZWZhdWx0IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuICBnZXRJbml0aWFsU3RhdGUoLi4ucHJvcHMpIHtcbiAgICByZXR1cm4ge307XG4gIH0sXG5cbiAgX29uQ2xpY2soaGFzaHRhZykge1xuICAgIC8vIENoZWNrIGlmIGhhc2h0YWcgaXMgc2FtZSBhcyBjdXJyZW50bHkgc2VsZWN0ZWRcbiAgICBsZXQgaXNTZWxlY3RlZCA9IHRoaXMuc3RhdGUuc2VsZWN0ZWQgPT09IGhhc2h0YWc7XG5cbiAgICAvLyBTZXQgc2VsZWN0ZWQgaGFzaHRhZyB0byBzdGF0ZVxuICAgIHRoaXMuc2V0U3RhdGUoeyBzZWxlY3RlZDogaGFzaHRhZyB9KTtcblxuICAgIC8vIERpc3BhdGNoIHNlYXJjaCBieSBoYXNodGFnXG4gICAgZGlzcGF0Y2hlci5kaXNwYXRjaCh7XG4gICAgICBhY3Rpb25UeXBlOiAnc2VhcmNoOmhhc2h0YWcnLFxuICAgICAgZGF0YTogaXNTZWxlY3RlZCA/IHVuZGVmaW5lZCA6IGhhc2h0YWdcbiAgICB9KTtcbiAgfSxcblxuICByZW5kZXIoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDx1bCBjbGFzc05hbWU9XCJ0YXNrLWhhc2h0YWdzLWxpc3RcIj5cbiAgICAgICAge3RoaXMucHJvcHMuaGFzaHRhZ3MubWFwKChoYXNoVGFnKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxsaSBrZXk9e2hhc2hUYWd9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPXt7c2VsZWN0ZWQ6IHRoaXMuc3RhdGUuc2VsZWN0ZWQgPT09IGhhc2hUYWcgfX0+XG4gICAgICAgICAgICAgIDxhIG9uQ2xpY2s9e3RoaXMuX29uQ2xpY2suYmluZCh0aGlzLCBoYXNoVGFnKX0+XG4gICAgICAgICAgICAgICAge3toYXNoVGFnfX1cbiAgICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICApO1xuICAgICAgICB9KX1cbiAgICAgIDwvdWw+XG4gICAgKTtcbiAgfVxuXG59KTtcblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IFRhc2tMaXN0IGZyb20gJy4vdGFzay1saXN0JztcbmltcG9ydCBUYXNrcyBmcm9tICcuL3N0b3JlJztcbmltcG9ydCBUYXNrRm9ybSBmcm9tICcuL3Rhc2stZm9ybSc7XG5pbXBvcnQgSGFzaHRhZ3MgZnJvbSAnLi9oYXNodGFncyc7XG5pbXBvcnQgZGlzcGF0Y2hlciBmcm9tICcuLi9hcHAvZGlzcGF0Y2hlcic7XG5jb25zdCBkcm9wYm94ID0gcmVxdWlyZSgnLi4vZHJvcGJveC1jbGllbnQnKTtcblxuY2xhc3MgVGFza1BhZ2UgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgIHRhc2tzOiBUYXNrcy5nZXRBbGwoKVxuICAgIH07XG4gIH1cblxuICBfb25DaGFuZ2UoKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7IHRhc2tzOiBUYXNrcy5nZXRBbGwoKSB9KTtcbiAgfVxuXG4gIGNvbXBvbmVudFdpbGxNb3VudCgpIHtcbiAgICByZXR1cm4gZHJvcGJveC5nZXRUYWJsZSgndGFza3MnKS50aGVuKChzdG9yZSkgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMuc2V0U3RhdGUoeyBzdG9yZTogc3RvcmUgfSk7XG4gICAgfSk7XG4gIH1cblxuICBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICAvLyBSZWdpc3RlciB3aXRoIGFwcCBkaXNwYXRjaGVyXG4gICAgdGhpcy50b2tlbiA9IGRpc3BhdGNoZXIucmVnaXN0ZXIoKHBheWxvYWQpID0+IHtcbiAgICAgIHN3aXRjaCAocGF5bG9hZC5hY3Rpb25UeXBlKSB7XG4gICAgICAgIGNhc2UgJ3NlYXJjaDpoYXNodGFnJzpcbiAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHRhc2tzOiBUYXNrcy5nZXRCeUhhc2h0YWcocGF5bG9hZC5kYXRhKVxuICAgICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gV2F0Y2ggZm9yIGNoYW5nZXMgdG8gVGFza3NcbiAgICBUYXNrcy5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLl9vbkNoYW5nZS5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xuICAgIC8vIFVucmVnaXN0ZXIgZnJvbSBhcHAgZGlzcGF0Y2hlclxuICAgIGRpc3BhdGNoZXIudW5yZWdpc3Rlcih0aGlzLnRva2VuKTtcbiAgICAvLyBVbndhdGNoIGZvciBjaGFuZ2VzIHRvIFRhc2tzXG4gICAgVGFza3MucmVtb3ZlQ2hhbmdlTGlzdGVuZXIodGhpcy5fb25DaGFuZ2UuYmluZCh0aGlzKSk7XG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgbGV0IHRhc2tzID0gT2JqZWN0LmtleXModGhpcy5zdGF0ZS50YXNrcykubWFwKChrZXkpID0+IHtcbiAgICAgIHJldHVybiB0aGlzLnN0YXRlLnRhc2tzW2tleV07XG4gICAgfSk7XG5cbiAgICBsZXQgaGFzaHRhZ3MgPSBUYXNrcy5nZXRIYXNodGFncygpO1xuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwicGFnZVwiPlxuICAgICAgICA8aDQgY2xhc3NOYW1lPVwidGV4dC1jZW50ZXJcIj4gVGFza3MgPC9oND5cbiAgICAgICAgPEhhc2h0YWdzIGhhc2h0YWdzPXtoYXNodGFnc30vPlxuICAgICAgICA8VGFza0Zvcm0gLz5cbiAgICAgICAge3RoaXMuc3RhdGUuc3RvcmUgPyA8VGFza0xpc3QgdGFza3M9e3Rhc2tzfS8+IDogKFxuICAgICAgICAgIDxzcGFuPiBMb2FkaW5nIFRhc2tzIDwvc3Bhbj5cbiAgICAgICAgKX1cblxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IFRhc2tQYWdlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgZGlzcGF0Y2hlciBmcm9tICcuLi9hcHAvZGlzcGF0Y2hlcic7XG5pbXBvcnQgY29uc3RhbnRzIGZyb20gJy4uL2FwcC9jb25zdGFudHMnO1xuaW1wb3J0IHtFdmVudEVtaXR0ZXJ9IGZyb20gJ2V2ZW50cyc7XG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuXG5sZXQgVGFza0NvbnN0YW50cyA9IGNvbnN0YW50cy5UQVNLUztcbnZhciBDSEFOR0VfRVZFTlQgPSAnY2hhbmdlJztcblxudmFyIF90YXNrcyA9IHt9O1xuXG4vKipcbiAqIENyZWF0ZSBhIG5ldyB0YXNrXG4gKiBAcGFyYW0gIHtzdHJpbmd9IHRhc2tcbiAqL1xuZnVuY3Rpb24gY3JlYXRlKHRhc2spIHtcbiAgdGFzay5pZCA9ICgrbmV3IERhdGUoKSArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDk5OTk5OSkpLnRvU3RyaW5nKDM2KTtcbiAgdGFzay5jb21wbGV0ZSA9IGZhbHNlO1xuICB0YXNrLmhhc2h0YWdzID0gVGFza1N0b3JlLnBhcnNlSGFzaHRhZ3ModGFzay5kZXNjcmlwdGlvbik7XG4gIF90YXNrc1t0YXNrLmlkXSA9IHRhc2s7XG59XG5cbi8qKlxuICogVXBkYXRlIGEgVE9ETyBpdGVtLlxuICogQHBhcmFtICB7c3RyaW5nfSBpZFxuICogQHBhcmFtIHtvYmplY3R9IHVwZGF0ZXMgQW4gb2JqZWN0IGxpdGVyYWwgY29udGFpbmluZyBvbmx5IHRoZSBkYXRhIHRvIGJlXG4gKiAgICAgdXBkYXRlZC5cbiAqL1xuZnVuY3Rpb24gdXBkYXRlKGlkLCB1cGRhdGVzKSB7XG4gIF90YXNrc1tpZF0gPSBfLm1lcmdlKHt9LCBfdGFza3NbaWRdLCB1cGRhdGVzKTtcbn1cblxuLyoqXG4gKiBVcGRhdGUgYWxsIG9mIHRoZSBUT0RPIGl0ZW1zIHdpdGggdGhlIHNhbWUgb2JqZWN0LlxuICogICAgIHRoZSBkYXRhIHRvIGJlIHVwZGF0ZWQuICBVc2VkIHRvIG1hcmsgYWxsIFRPRE9zIGFzIGNvbXBsZXRlZC5cbiAqIEBwYXJhbSAge29iamVjdH0gdXBkYXRlcyBBbiBvYmplY3QgbGl0ZXJhbCBjb250YWluaW5nIG9ubHkgdGhlIGRhdGEgdG8gYmVcbiAqICAgICB1cGRhdGVkLlxuICovXG5mdW5jdGlvbiB1cGRhdGVBbGwodXBkYXRlcykge1xuICBmb3IgKHZhciBpZCBpbiBfdGFza3MpIHtcbiAgICB1cGRhdGUoaWQsIHVwZGF0ZXMpO1xuICB9XG59XG5cbi8qKlxuICogRGVsZXRlIGEgVE9ETyBpdGVtLlxuICogQHBhcmFtICB7c3RyaW5nfSBpZFxuICovXG5mdW5jdGlvbiBkZXN0cm95KGlkKSB7XG4gIGRlbGV0ZSBfdGFza3NbaWRdO1xufVxuXG4vKipcbiAqIERlbGV0ZSBhbGwgdGhlIGNvbXBsZXRlZCBUT0RPIGl0ZW1zLlxuICovXG5mdW5jdGlvbiBkZXN0cm95Q29tcGxldGVkKCkge1xuICBmb3IgKHZhciBpZCBpbiBfdGFza3MpIHtcbiAgICBpZiAoX3Rhc2tzW2lkXS5jb21wbGV0ZSkge1xuICAgICAgZGVzdHJveShpZCk7XG4gICAgfVxuICB9XG59XG5cbnZhciBUYXNrU3RvcmUgPSBfLm1lcmdlKHt9LCBFdmVudEVtaXR0ZXIucHJvdG90eXBlLCB7XG5cbiAgLyoqXG4gICAqIFRlc3RzIHdoZXRoZXIgYWxsIHRoZSByZW1haW5pbmcgVE9ETyBpdGVtcyBhcmUgbWFya2VkIGFzIGNvbXBsZXRlZC5cbiAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICovXG4gIGFyZUFsbENvbXBsZXRlOiBmdW5jdGlvbigpIHtcbiAgICBmb3IgKHZhciBpZCBpbiBfdGFza3MpIHtcbiAgICAgIGlmICghX3Rhc2tzW2lkXS5jb21wbGV0ZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGVudGlyZSBjb2xsZWN0aW9uIG9mIFRPRE9zLlxuICAgKiBAcmV0dXJuIHtvYmplY3R9XG4gICAqL1xuICBnZXRBbGw6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBfdGFza3M7XG4gIH0sXG5cbiAgdG9BcnJheSgpIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMoX3Rhc2tzKS5tYXAoaWQgPT4gX3Rhc2tzW2lkXSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBkZXNjcmlwdGlvbiBHZXQgc3RvcmUncyByZWNvcmRzIGZpbHRlcmVkIG9uIHByb3BlcnR5IGJ5IHZhbHVlXG4gICAqIEBwYXJhbSAgeyp9IHByb3BlcnR5IFByb3BlcnR5IHRvIGZpbHRlciByZWNvcmRzIG9uXG4gICAqIEBwYXJhbSAgeyp9IHZhbHVlICAgIFZhbHVlIHRvIGZpbHRlciBmb3JcbiAgICogQHJldHVybiB7QXJyYXl9XG4gICAqL1xuICBnZXRCeShwcm9wZXJ0eSwgdmFsdWUsIG5vdCkge1xuICAgIGxldCB0YXNrcyA9IHRoaXMudG9BcnJheSgpO1xuICAgIGlmIChub3QpXG4gICAgICByZXR1cm4gdGFza3MuZmlsdGVyKHJlY29yZCA9PiByZWNvcmRbcHJvcGVydHldICE9PSB2YWx1ZSk7XG4gICAgZWxzZVxuICAgICAgcmV0dXJuIHRhc2tzLmZpbHRlcihyZWNvcmQgPT4gcmVjb3JkW3Byb3BlcnR5XSA9PT0gdmFsdWUpO1xuICB9LFxuXG4gIGdldEJ5SGFzaHRhZyhoYXNodGFnKSB7XG4gICAgcmV0dXJuIHRoaXMudG9BcnJheSgpLmZpbHRlcihmdW5jdGlvbih0YXNrKSB7XG4gICAgICByZXR1cm4gfnRhc2suaGFzaHRhZ3MuaW5kZXhPZihoYXNodGFnKTtcbiAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogQGRlc2NyaXB0aW9uIEdldCBoYXNodGFncyBmcm9tIHN0b3JlJ3MgcmVjb3Jkc1xuICAgKiBAcmV0dXJucyB7QXJyYXl9XG4gICAqL1xuICBnZXRIYXNodGFncygpIHtcbiAgICB2YXIgaGFzaHRhZ3MgPSBbXTtcbiAgICAvL2xldCB0YXNrcyA9IE9iamVjdC5rZXlzKF90YXNrcykubWFwKGlkID0+IF90YXNrc1tpZF0pO1xuXG4gICAgdGhpcy50b0FycmF5KCkuZm9yRWFjaCgodGFzayk9PiB7XG4gICAgICBpZiAodGFzay5oYXNodGFncylcbiAgICAgICAgdGFzay5oYXNodGFncy5mb3JFYWNoKChoYXNodGFnKSA9PiB7XG4gICAgICAgICAgaWYgKCF+aGFzaHRhZ3MuaW5kZXhPZihoYXNodGFnKSkgaGFzaHRhZ3MucHVzaChoYXNodGFnKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gaGFzaHRhZ3M7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBkZXNjcmlwdGlvbiBHZXQgYXJyYXkgb2YgaGFzaHRhZ3MgZnJvbSB0ZXh0XG4gICAqIEBwYXJhbSAge1N0cmluZ30gdGV4dCBUZXh0IHRvIHNlYXJjaCBmb3IgaGFzaHRhZ3NcbiAgICogQHJldHVybiB7QXJyYXl9ICAgICAgTGlzdCBvZiBoYXNodGFnc1xuICAgKi9cbiAgcGFyc2VIYXNodGFncyh0ZXh0KSB7XG4gICAgcmV0dXJuIHRleHQubWF0Y2goLygjW2EtelxcZF1bXFx3LV0qKS9pZykgfHwgW107XG4gIH0sXG5cbiAgZW1pdENoYW5nZTogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5lbWl0KENIQU5HRV9FVkVOVCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrXG4gICAqL1xuICBhZGRDaGFuZ2VMaXN0ZW5lcjogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICB0aGlzLm9uKENIQU5HRV9FVkVOVCwgY2FsbGJhY2spO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFja1xuICAgKi9cbiAgcmVtb3ZlQ2hhbmdlTGlzdGVuZXI6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcihDSEFOR0VfRVZFTlQsIGNhbGxiYWNrKTtcbiAgfVxuXG59KTtcblxuLy8gUmVnaXN0ZXIgY2FsbGJhY2sgdG8gaGFuZGxlIGFsbCB1cGRhdGVzXG5kaXNwYXRjaGVyLnJlZ2lzdGVyKGZ1bmN0aW9uKGFjdGlvbikge1xuICBsZXQgdGV4dDtcblxuICBzd2l0Y2goYWN0aW9uLmFjdGlvblR5cGUpIHtcbiAgICBjYXNlIFRhc2tDb25zdGFudHMuQ1JFQVRFOlxuICAgICAgaWYgKGFjdGlvbi5kYXRhLmRlc2NyaXB0aW9uICE9PSAnJykge1xuICAgICAgICBjcmVhdGUoYWN0aW9uLmRhdGEpO1xuICAgICAgICBUYXNrU3RvcmUuZW1pdENoYW5nZSgpO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlIFRhc2tDb25zdGFudHMuVE9HR0xFX0NPTVBMRVRFX0FMTDpcbiAgICAgIGlmIChUYXNrU3RvcmUuYXJlQWxsQ29tcGxldGUoKSkge1xuICAgICAgICB1cGRhdGVBbGwoe2NvbXBsZXRlOiBmYWxzZX0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdXBkYXRlQWxsKHtjb21wbGV0ZTogdHJ1ZX0pO1xuICAgICAgfVxuICAgICAgVGFza1N0b3JlLmVtaXRDaGFuZ2UoKTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSBUYXNrQ29uc3RhbnRzLlVORE9fQ09NUExFVEU6XG4gICAgICB1cGRhdGUoYWN0aW9uLmlkLCB7Y29tcGxldGU6IGZhbHNlfSk7XG4gICAgICBUYXNrU3RvcmUuZW1pdENoYW5nZSgpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlIFRhc2tDb25zdGFudHMuQ09NUExFVEU6XG4gICAgICB1cGRhdGUoYWN0aW9uLmlkLCB7Y29tcGxldGU6IHRydWV9KTtcbiAgICAgIFRhc2tTdG9yZS5lbWl0Q2hhbmdlKCk7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgVGFza0NvbnN0YW50cy5VUERBVEU6XG4gICAgICB0ZXh0ID0gYWN0aW9uLnRleHQudHJpbSgpO1xuICAgICAgaWYgKHRleHQgIT09ICcnKSB7XG4gICAgICAgIHVwZGF0ZShhY3Rpb24uaWQsIHt0ZXh0OiB0ZXh0fSk7XG4gICAgICAgIFRhc2tTdG9yZS5lbWl0Q2hhbmdlKCk7XG4gICAgICB9XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgVGFza0NvbnN0YW50cy5ERVNUUk9ZOlxuICAgICAgZGVzdHJveShhY3Rpb24uaWQpO1xuICAgICAgVGFza1N0b3JlLmVtaXRDaGFuZ2UoKTtcbiAgICAgIGJyZWFrO1xuXG4gICAgZGVmYXVsdDpcbiAgICAvLyBubyBvcFxuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBUYXNrU3RvcmU7XG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgZGlzcGF0Y2hlciBmcm9tICcuLi9hcHAvZGlzcGF0Y2hlcic7XG5pbXBvcnQgY29uc3RhbnRzIGZyb20gJy4uL2FwcC9jb25zdGFudHMnO1xuXG5leHBvcnQgZGVmYXVsdCBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgZ2V0SW5pdGlhbFN0YXRlKCkge1xuICAgIHJldHVybiB7fTtcbiAgfSxcblxuICAvKipcbiAgICogSGFuZGxlIGZvcm0gc3VibWlzc2lvblxuICAgKiBAcGFyYW0ge1N5bnRoZXRpY0V2ZW50fSBldmVudFxuICAgKi9cbiAgb25TdWJtaXQoZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgLy8gRW1wdHkgaW5wdXQgdmFsdWVcbiAgICB0aGlzLnNldFN0YXRlKHsgdmFsdWU6ICcnIH0pO1xuXG4gICAgLy8gRGlzcGF0Y2ggdGFzayBjcmVhdGlvbiBldmVudFxuICAgIGRpc3BhdGNoZXIuZGlzcGF0Y2goe1xuICAgICAgYWN0aW9uVHlwZTogY29uc3RhbnRzLlRBU0tTLkNSRUFURSxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgZGVzY3JpcHRpb246IHRoaXMucmVmcy5uYW1lLmdldERPTU5vZGUoKS52YWx1ZVxuICAgICAgfVxuICAgIH0pXG4gIH0sXG5cbiAgLyoqXG4gICAqIFNldCB2YWx1ZSBvZiBpbnB1dCBmaWVsZCB0byBzdGF0ZS52YWx1ZSBvbiBjaGFuZ2VcbiAgICovXG4gIG9uQ2hhbmdlKCkge1xuICAgIHRoaXMuc2V0U3RhdGUoeyB2YWx1ZTogdGhpcy5yZWZzLm5hbWUuZ2V0RE9NTm9kZSgpLnZhbHVlIH0pO1xuICB9LFxuXG4gIHJlbmRlcigpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPVwiY2FyZFwiPlxuICAgICAgICA8Zm9ybSBjbGFzc05hbWU9XCJ0YXNrLWZvcm1cIiBvblN1Ym1pdD17dGhpcy5vblN1Ym1pdH0+XG4gICAgICAgICAgPGlucHV0IG9uQ2hhbmdlPXt0aGlzLm9uQ2hhbmdlfVxuICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIlNlYXJjaCB0YXNrcyBvciBjcmVhdGUgbmV3IHRhc2tcIlxuICAgICAgICAgICAgICAgICByZWY9XCJuYW1lXCJcbiAgICAgICAgICAgICAgICAgcmVxdWlyZWRcbiAgICAgICAgICAgICAgICAgdHlwZT1cInRleHRcIlxuICAgICAgICAgICAgICAgICB2YWx1ZT17dGhpcy5zdGF0ZS52YWx1ZX0vPlxuICAgICAgICA8L2Zvcm0+XG4gICAgICA8L3NlY3Rpb24+XG4gICAgKTtcbiAgfVxuXG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcblxuZXhwb3J0IGRlZmF1bHQgUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDx1bCBjbGFzc05hbWU9XCJ0YXNrLWxpc3RcIj5cbiAgICAgICAge3RoaXMucHJvcHMudGFza3MubWFwKCh0YXNrKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxsaSBrZXk9e3Rhc2suaWR9IGNsYXNzTmFtZT1cInRhc2stbGlzdC1pdGVtXCI+XG4gICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiB2YWx1ZT17dGFzay5jb21wbGV0ZWR9IC8+XG4gICAgICAgICAgICAgIDxzcGFuPnt0YXNrLmRlc2NyaXB0aW9ufTwvc3Bhbj5cbiAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgKTtcbiAgICAgICAgfSl9XG4gICAgICA8L3VsPlxuICAgICk7XG4gIH1cblxufSk7XG4iXX0=
