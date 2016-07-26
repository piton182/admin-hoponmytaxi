import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { Mongo } from 'meteor/mongo';

import classnames from 'classnames';
import {
  Form,
  FormGroup,
  Col,
  ControlLabel,
  FormControl,
  Button } from 'react-bootstrap';

import { Rides } from '../api/rides.js';

export default class RideForm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      model: this.ride2model(props.ride),
      airports: this.props.airports,
    }
  }

  ride2model(ride) {
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
    const model = {
      bkn_ref: ride.bkn_ref,
      name: ride.name || '',
      phone: ride.phone || '',
      ...decomposeDatetime(ride.datetime),
      from: ride.from || '',
      ...decomposeAirport(ride.to),
    };

    if (ride._id) {
      model._id = ride._id;
    }

    if (ride.bkn_ref) {
      model.bkn_ref = ride.bkn_ref;
    }

    return model;
  }

  model2ride(model, airports) {
    const ride = {
      name: model.name,
      phone: model.phone,
      datetime: {
        unix: moment(`${model.date}:${model.time_h}:${model.time_m}`, "MM/DD/YYYY:HH:mm").unix(),
      },
      from: model.from,
      to: {
        _id: new Mongo.ObjectID(model.to_id),
        name: _.find(airports, (airport) => {
          return airport._id.valueOf() === model.to_id
        }).name,
      },
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
      model: this.ride2model(nextProps.ride),
      airports: nextProps.airports,
    });
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
      Rides.update({_id: ride._id}, ride)
    } else if (this.props.mode === 'new') {
      const ride = this.model2ride(this.state.model, this.state.airports)
      ride.bkn_ref = 'R' + Math.floor(Math.random()*(100*1000));
      Rides.insert(ride)
    } else {
      // uh?
    }

    this.clearModelAndSession();
  }

  handleChange(event) {
    const key = event.target.name, value = event.target.value;
    console.log(`key=${key}, value=${value}`)
    const nextState = this.state;
    nextState.model[key] = value;
    this.setState(nextState);
  }

  fakeARide() {
    return {
      name: faker.name.findName(),
      phone: faker.phone.phoneNumberFormat(),
      datetime: {
        unix: moment().unix() + (1 * 60 * 60) + Math.floor(Math.random() * (48 * 60 * 60)),
      },
      from: faker.address.streetAddress(),
      to: this.state.airports[Math.round(Math.random())],
    }
  }

  handleFakeOne() {
    const ride = this.fakeARide();
    this.setState(({model}) => ({
      model: this.ride2model(ride),
    }));
  }

  handleCancelEdit() {
    this.clearModelAndSession();
  }

  getValidationState() {
    return 'success';
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

  render() {
    // console.log('RideForm.render')
    // console.log(this.state)
    return (
      <div style={{width: "280px"}}>
        { this.props.mode === 'edit'
          ? <h3>Editing ride #{this.state.model.bkn_ref}</h3>
          : <h3>New Ride</h3> }
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
                name="from"
                value={this.state.model.from}
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

          { this.props.mode === 'edit'
            ? (
              <div>
                <Button type="submit" bsSize="small">Save</Button>
                <a href="#" onClick={this.handleCancelEdit.bind(this)}>Cancel</a>
              </div>
              )
            : <Button type="submit" bsSize="small">Submit</Button>}

          { this.props.mode === 'new'
            ? <a href="#" onClick={this.handleFakeOne.bind(this)}>Fake one</a>
            : ''}
        </Form>
      </div>
    );
  }
}
