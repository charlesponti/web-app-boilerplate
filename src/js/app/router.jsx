'use strict';

// Components
import App from '../components/app.jsx';
import Home from '../components/home.jsx';
import NotFound from '../components/not-found';

// Dependencies
import React from 'react';
import Router from 'react-router';

let Route  = Router.Route;
let DefaultRoute = Router.DefaultRoute;
let NotFoundRoute = Router.NotFoundRoute;

var routes = (
  <Route path="/" handler={App}>
    <DefaultRoute handler={Home} />
    <NotFoundRoute handler={NotFound}/>
  </Route>
);

Router.run(routes, function (Handler) {
  React.render(<Handler/>, document.querySelector('body'));
});

// Or, if you'd like to use the HTML5 history API for cleaner URLs:
// Router.run(routes, Router.HistoryLocation, function (Handler) {
//   React.render(<Handler/>, document.querySelector('app'));
// });
