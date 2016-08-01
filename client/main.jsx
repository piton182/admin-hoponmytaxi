import React from 'react';
import { Meteor } from 'meteor/meteor';
import { render } from 'react-dom';
import { Router, Route, browserHistory } from 'react-router'

import App from '../imports/ui/App.jsx';
import Page2 from '../imports/ui/Page2.jsx';
import Page3 from '../imports/ui/Page3.jsx';



Meteor.startup(() => {
  render(
  	<Router history={browserHistory}>
    	<Route path='/' 	 component={App} />
    	<Route path='/Page2' component={Page2} />
    	<Route path='/Page3' component={Page3} />
  	</Router>, document.getElementById('render-target'));
});
