import React, { Component } from 'react';
import { createContainer } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';

import RideFormAndList from './RideFormAndList.jsx';
import Page2 from './Page2.jsx';
import Page3 from './Page3.jsx';


export default class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      route: window.location.hash.substr(1)
    }
  }
  componentDidMount() {
    window.addEventListener('hashchange', () => {
      this.setState({
        route: window.location.hash.substr(1)
      })
    })
  }
  render() {
    let App
        
    switch (this.state.route) {
      case '/#':      App = home; break;
      case '/Page2':  App = Page2; break;
      case '/Page3':  App = Page3; break;
      default: App = RideFormAndList;
    }
    // console.log('App.render')
    return (
      <div style={{border: "5px solid red"}}>
      <nav aria-label="Page navigation">
        <ul className="pagination">
            <li><a href='#/'>home</a></li>
            <li><a href='#/Page2'>Page2</a></li>
            <li><a href='#/Page3'>Page3</a></li>
        </ul>
      </nav>
        <App />
      </div>
    );
  }
}
