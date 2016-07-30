import React, { Component } from 'react';
import { createContainer } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';

import RideForm from './RideForm.jsx';
import RideList from './RideList.jsx';

import { Airports } from '../../both/collections.js';

class App extends Component {
  render() {
    // console.log('App.render')
    return (
      <div style={{border: "5px solid red"}}>
        <table>
          <tbody>
            <tr>
              <td style={{border: "5px solid yellow"}}>
              
                {/* {{> ride_form model=rideModel callbacks=rideCRUDCallbacks isEditingMode=isRideFormEditingMode }}*/}
                <RideForm
                  ride={this.props.rideFormModel}
                  mode={this.props.rideInEdit ? 'edit' : 'new'}
                  airports={this.props.airports} />
              </td>
              <td style={{width: "30px"}}></td>
              <td style={{border: "5px solid blue"}}>
                {/* {{> ride_list callbacks=rideCRUDCallbacks }}*/}
                <RideList />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
}

export default createContainer(() => {
  return {
    rideFormModel: Session.get('rideFormModel') || {},
    rideInEdit: Session.get('rideInEdit') && Session.get('rideFormModel') || null,
    airports: Airports.find().fetch(),
  }
}, App);
