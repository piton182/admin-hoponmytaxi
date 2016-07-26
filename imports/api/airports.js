import { Mongo } from 'meteor/mongo';

export const Airports = new Mongo.Collection('airports', {idGeneration: 'MONGO'});
