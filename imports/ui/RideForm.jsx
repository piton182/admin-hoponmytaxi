import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { Mongo } from 'meteor/mongo';
import { createContainer } from 'meteor/react-meteor-data';

import {
  Form,
  FormGroup,
  Col,
  ControlLabel,
  FormControl,
  Button } from 'react-bootstrap';

import { Rides } from '../../both/collections.js';

class RideForm extends Component {
  constructor(props) {
    super(props);

    // loading Google Maps API
    GoogleMaps.load({
      key: 'AIzaSyAMUsNldKIjKx7FDU_NwrGYi9BXwxN-DLY',
      libraries: 'places'  // also accepts an array if you need more than one
    });

    const self = this;
    GoogleMaps.ready('mymap', () => {
      self.geocoder = new google.maps.Geocoder;
    })

    this.state = {
      model: this.ride2model(props.ride),
      airports: this.props.airports,
    }
  }

  geocoderCallback(ride) {
    if (ride.from && (typeof ride.from.streetAddress !== 'string')) {
      const self = this;
      this.geocoder.geocode({ location: {
        lat: ride.from.coordinates[0], lng: ride.from.coordinates[1]
      }}, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
          if (results[1]) {
            ride.from.streetAddress = results[1].formatted_address;
            self.setState(({model}) => ({
              model: self.ride2model(ride),
            }));
          } else {
            alert('No results found');
          }
        } else {
          alert('Geocoder failed due to: ' + status);
        }
      });
    }
  }

  ride2model(ride, geocoderCallback) {
    function decomposeDatetime(datetime) {
      const dt = datetime && datetime.unix ? moment.unix(datetime.unix) : null;
      return {
        date: dt ? dt.format('MM/DD/YYYY') : '',
        time_h: dt ? s.pad(dt.hours(), 2, '0') : '',
        time_m: dt ? s.pad(dt.minutes(), 2, '0') : '',
      }
    }
    function decomposeAirport(airport) {
      return {
        to_id: airport && airport._id && airport._id.valueOf() || '',
        to_name: airport && airport.name && airport.name.valueOf() || '',
      }
    }
    function decomposeFrom(from) {
      return {
        from_streetAddress: from && from.streetAddress || '',
        from_coordinates: from && from.coordinates || [],
      }
    }
    const model = {
      bkn_ref: ride.bkn_ref,
      name: ride.name || '',
      phone: ride.phone || '',
      ...decomposeDatetime(ride.datetime),
      ...decomposeFrom(ride.from),
      ...decomposeAirport(ride.to),
    };

    if (ride._id) {
      model._id = ride._id;
    }

    if (ride.bkn_ref) {
      model.bkn_ref = ride.bkn_ref;
    }

    if (geocoderCallback) {
      geocoderCallback(ride);
    }

    return model;
  }

  model2ride(model, airports) {
    function composeDatetime(date, time_h, time_m) {
      return {
        unix: moment(`${date}:${time_h}:${time_m}`, "MM/DD/YYYY:HH:mm").unix(),
      }
    }
    function composeAirport(airport_id, airports) {
      return {
        _id: new Mongo.ObjectID(airport_id),
        name: _.find(airports, (airport) => {
          return airport._id.valueOf() === airport_id
        }).name,
      }
    }
    function composeFrom(from_streetAddress, from_coordinates) {
      return {
        streetAddress: from_streetAddress,
        location: { type: "Point", coordinates: from_coordinates }
      }
    }
    const ride = {
      name: model.name,
      phone: model.phone,
      datetime: composeDatetime(model.date, model.time_h, model.time_m),
      from: composeFrom(model.from_streetAddress, model.from_coordinates),
      to: composeAirport(model.to_id, airports),
    };

    if (model._id) {
      ride._id = model._id
    }

    if (model.bkn_ref) {
      ride.bkn_ref = model.bkn_ref
    }

    return ride;
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      model: this.ride2model(nextProps.ride, this.geocoderCallback.bind(this)),
      airports: nextProps.airports,
      googleMapsLoaded: this.props.googleMapsLoaded,
    });
  }

  componentDidUpdate() {
    if (this.props.googleMapsLoaded) {
      // TODO: do not attach geocomplete on every change, do it once and keep in state
      const self = this;
      $(ReactDOM.findDOMNode(this.refs.from_streetAddress)).geocomplete()
      .bind("geocode:result", function(event, result) {
        // console.log(result.geometry.location.lat(), result.geometry.location.lng())
        self.setState( ({model}) => (
          {
            model: {
              ...model,
              from_streetAddress: result.formatted_address,
              from_coordinates: [result.geometry.location.lat(), result.geometry.location.lng()],
            }
          }
        ));
      });
    }

    // console.log('componentDidUpdate')
    // console.log(GoogleMaps.maps.mymap && GoogleMaps.maps.mymap.instance)
  }

  clearModelAndSession() {
    this.setState({
      model: this.ride2model({}),
      ...this.state
    });

    Session.set('rideFormModel', null);
    Session.set('rideInEdit', null);
  }

  handleSubmit(event) {
    event.preventDefault();

    // console.log(this.state.model)

    if (this.props.mode === 'edit') {
      const ride = this.model2ride(this.state.model, this.state.airports)
      // Rides.update({_id: ride._id}, ride)
      Meteor.call('rides.update', ride)
    } else if (this.props.mode === 'new') {
      const ride = this.model2ride(this.state.model, this.state.airports)
      // Rides.insert(ride)
      Meteor.call('rides.create', ride);
    } else {
      // uh?
    }

    this.clearModelAndSession();
  }

  handleChange(event) {
    const key = event.target.name, value = event.target.value;
    // console.log(`key=${key}, value=${value}`)
    const nextState = this.state;
    nextState.model[key] = value;
    this.setState(nextState);
  }

  fakeARide() {
    const from_coordinates = [
      59.32 + _.random(3)/100 + Math.random()/1000,
      17.97 + _.random(16)/100 + Math.random()/1000
    ]
    return {
      name: faker.name.findName(),
      phone: faker.phone.phoneNumberFormat(),
      datetime: {
        unix: moment().unix() + (1 * 60 * 60) + Math.floor(Math.random() * (48 * 60 * 60)),
      },
      from: {
        coordinates: from_coordinates,
        streetAddress: from_coordinates,
      },
      to: this.state.airports[Math.round(Math.random())],
    }
  }

  handleFakeOne() {
    const ride = this.fakeARide();
    this.setState(({model}) => ({
      model: this.ride2model(ride, this.geocoderCallback.bind(this)),
    }));
  }

  handleCancelEdit() {
    this.clearModelAndSession();
  }

  _mapOptions() {
    return {
      center: new google.maps.LatLng(59.3293, 18.0686),
      zoom: 8
    };
  }

  renderAirportOptions() {
    return this.state.airports.map((airport) => {
      return <option key={airport._id.valueOf()}
        value={airport._id.valueOf()}
      >
        {airport.name}
      </option>
      });
  }

  renderMap() {
    if (this.props.googleMapsLoaded) {
      return (
        <GoogleMap
          id="#mymap"
          name="mymap"
          options={this._mapOptions()}
          marker={{
            lat: this.state.model.from_coordinates[0],
            lng: this.state.model.from_coordinates[1]
          }}
        />
      )
    }

    return <div>Loading map...</div>;
  }

  render() {
    // console.log('RideForm.render')
    // console.log(this.state)
    return (
      <div style={{width: "280px"}}>
        { this.props.mode === 'edit'
          ? <h3>Editing ride #{this.state.model.bkn_ref}</h3>
          : <h3>New Ride</h3> }
        { this.renderMap() }
        <Form horizontal onSubmit={this.handleSubmit.bind(this)}>
          <FormGroup
            controlId="name"
            // validationState={this.getValidationState()}
            bsSize="small"
          >
            <Col sm={3}>
              <ControlLabel>Name<span style={{color: "red"}}>*</span></ControlLabel>
            </Col>
            <Col sm={9}>
              <FormControl
                type="text"
                name="name"
                value={this.state.model.name}
                placeholder="Enter name"
                onChange={this.handleChange.bind(this)}
              />
            </Col>
          </FormGroup>

          <FormGroup
            controlId="phone"
            // validationState={this.getValidationState()}
            bsSize="small"
          >
            <Col sm={3}>
              <ControlLabel>Phone<span style={{color: "red"}}>*</span></ControlLabel>
            </Col>
            <Col sm={9}>
              <FormControl
                type="text"
                name="phone"
                value={this.state.model.phone}
                placeholder="Enter phone"
                onChange={this.handleChange.bind(this)}
              />
            </Col>
          </FormGroup>

          <FormGroup
            controlId="datetime"
            // validationState={this.getValidationState()}
            bsSize="small"
          >
            <Col sm={3}>
              <ControlLabel>Date&time<span style={{color: "red"}}>*</span></ControlLabel>
            </Col>
            <Col sm={5} style={{paddingRight: "0"}}>
              <FormControl
                type="text"
                name="date"
                value={this.state.model.date}
                placeholder="mm/dd/yyyy"
                onChange={this.handleChange.bind(this)}
              />
            </Col>
            <Col sm={2} style={{padding: "0", margin: "0"}}>
              <FormControl
                type="text"
                name="time_h"
                value={this.state.model.time_h}
                placeholder="hh"
                onChange={this.handleChange.bind(this)}
                style={{width: "35px"}}
              />
            </Col>
            <Col sm={2} style={{padding: "0", margin: "0"}}>
              <FormControl
                type="text"
                name="time_m"
                value={this.state.model.time_m}
                placeholder="mm"
                onChange={this.handleChange.bind(this)}
                style={{width: "35px"}}
              />
            </Col>
          </FormGroup>

          <FormGroup
            controlId="from"
            // validationState={this.getValidationState()}
            bsSize="small"
          >
            <Col sm={3}>
              <ControlLabel>From<span style={{color: "red"}}>*</span></ControlLabel>
            </Col>
            <Col sm={9}>
              <FormControl
                type="text"
                name="from_streetAddress"
                ref="from_streetAddress"
                value={this.state.model.from_streetAddress}
                placeholder="Enter address"
                onChange={this.handleChange.bind(this)}
              />
            </Col>
          </FormGroup>

          <FormGroup
            controlId="to"
            // validationState={this.getValidationState()}
            bsSize="small"
          >
            <Col sm={3}>
              <ControlLabel>To<span style={{color: "red"}}>*</span></ControlLabel>
            </Col>
            <Col sm={9}>
              <FormControl
                componentClass="select"
                name="to_id"
                value={this.state.model.to_id}
                placeholder="-- Select --"
                onChange={this.handleChange.bind(this)}
              >
              <option key="null" value="null">-- Select --</option>
              { this.renderAirportOptions() }
            </FormControl>
            </Col>
          </FormGroup>

          <FormGroup>
            <Col sm={3} style={{textAlign: "right", padding: 0}}>
              { this.props.mode === 'new'
                ? <a href="#" onClick={this.handleFakeOne.bind(this)}>Fake one</a>
                // ? <a href="#" style={{color: "white"}}>Fake one</a>
                : ''}
            </Col>
            <Col sm={9} style={{textAlign: "right"}}>
              { this.props.mode === 'edit'
                ? (
                  <div>
                    <a href="#"
                      onClick={this.handleCancelEdit.bind(this)}
                      style={{paddingRight: "10px"}}>Cancel</a>
                    <Button type="submit" bsSize="small">Save</Button>
                  </div>
                  )
                : <Button type="submit" bsSize="small">Submit</Button>}
            </Col>
          </FormGroup>
        </Form>
      </div>
    );
  }
}

export default createContainer(() => {
  return {
    googleMapsLoaded: GoogleMaps.loaded(),
  }
}, RideForm);

GoogleMap = React.createClass({
  // propTypes: {
  //   name: React.PropTypes.string.isRequired,
  //   options: React.PropTypes.object.isRequired
  // },
  getInitialState() {
    return {
      marker: null,
    }
  },
  componentDidMount() {
    GoogleMaps.create({
      name: this.props.name,
      element: ReactDOM.findDOMNode(this),
      options: this.props.options
    });

    // GoogleMaps.ready(this.props.name, function(map) {
    //   var marker = new google.maps.Marker({
    //     position: map.options.center,
    //     map: map.instance
    //   });
    // });
  },
  componentWillUnmount() {
    if (GoogleMaps.maps[this.props.name]) {
      google.maps.event.clearInstanceListeners(GoogleMaps.maps[this.props.name].instance);
      delete GoogleMaps.maps[this.props.name];
    }
  },
  componentWillReceiveProps(nextProps) {
    // console.log('googlemap.componentWillReceiveProps')
    const map = GoogleMaps.maps[this.props.name];
    if (map && nextProps.marker.lat && nextProps.marker.lng) {
      if (this.state.marker) {
        this.state.marker.setMap(null);
      }
      const marker = new google.maps.Marker({
        position: {...nextProps.marker},
        map: map.instance,
      });
      this.setState({
        marker
      });
    }
  },
  render() {
    return <div className="map-container"></div>;
  }
});
