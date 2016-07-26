import React, { Component, PropTypes } from 'react';

import { createContainer } from 'meteor/react-meteor-data';

import { Rides } from '../api/rides.js';

class RideList extends Component {
  formatDate(datetime) {
    return datetime && datetime.unix
      ? moment.unix(datetime.unix).format("MM/DD/YYYY HH:mm")
      : '';
  }

  formatAirport(airport) {
    return airport && airport.name ? airport.name : '';
  }

  handleEditRide(ride) {
    // TODO: factor this out of here; pass the callback via props
    Session.set('rideInEdit', true);
    Session.set('rideFormModel', ride);
  }

  handleDeleteRide(ride) {
    Rides.remove({_id: ride._id});
  }

  renderRides() {
    // console.log(this.props.rides);
    return this.props.rides.map((ride) => (
      <tr key={ride._id}>
        <td style={{whiteSpace: "nowrap"}}>
          {ride.bkn_ref}
        </td>
        <td style={{whiteSpace: "nowrap"}}>
          {ride.name}<br/>
        <img src="images/phone-icon.png" style={{width: "16px", height: "16px"}}/> {ride.phone}
        </td>
        <td style={{whiteSpace: "nowrap"}}>
          {this.formatDate(ride.datetime)}
        </td>
        <td style={{whiteSpace: "nowrap"}}>
          {ride.from}
        </td>
        <td style={{whiteSpace: "nowrap"}}>
          {this.formatAirport(ride.to)}
        </td>
        <td style={{whiteSpace: "nowrap"}}>
          {ride.coriders}
        </td>
        <td style={{whiteSpace: "nowrap"}}>
          { this.props.rideInEdit
            ? ( this.props.rideInEdit._id.equals(ride._id)
                ? <span>editing...</span> : '' )
            : <div>
                <a href="#" onClick={this.handleEditRide.bind(this, ride)}>Edit</a>
                <span> | </span>
                <a href="#" onClick={this.handleDeleteRide.bind(this, ride)}>Delete</a>
              </div>
          }
        </td>
      </tr>
    ));
  }

  render() {
    // console.log('RideList.render')
    return (
      <div>
        <h3>Rides</h3>
        <table className="table table-striped">
          <thead>
            <tr>
              <th style={{whiteSpace: "nowrap"}}>bkn #</th>
              <th>Name</th>
              <th>Date/Time</th>
              <th>From</th>
              <th>To</th>
              <th style={{whiteSpace: "nowrap"}}>Co-rider</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            { this.props.rides.length === 0 ?
              <tr>
                <td colSpan="7">
                  <span style={{color: "red"}}>No rides</span>
                </td>
              </tr>
              : this.renderRides() }
          </tbody>
        </table>
      </div>
    );
  }
}

export default createContainer(() => {
  return {
    rides: Rides.find({}).fetch(),
    rideInEdit: Session.get('rideInEdit') && Session.get('rideFormModel') || null,
  }
}, RideList);
