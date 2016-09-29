define([
  'chaplin',
  'models/base/model'
], function(Chaplin, Model) {
  'use strict';
  //Event model is very simple. We are using it here as a wrapper for the underlying vevent json
  var Event = Model.extend({ //each event in the collection is instantiated with one of these Event model class objects
		idAttribute: "uid.value", //here is the id the is bound to the model
  });

  return Event; //the built-in parse method of the Model base class will bind the 'fetched' json data as attributes to the instance of the Model class
});