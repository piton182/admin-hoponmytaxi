import { Mongo } from 'meteor/mongo';

export const Rides = new Mongo.Collection('rides', {idGeneration: 'MONGO'});
