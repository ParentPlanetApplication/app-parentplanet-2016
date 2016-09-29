define([
  'backbone',
  'underscore',
  'models/base/collection',
  'models/event',
  'localstorage',
  'moment',
  'text!data/events.json',
  'underscore.string',
  'module',
], function(Backbone, _, Collection, Event, Store, moment, eventsdata, _s, module) {
  'use strict';

  
  var Events = Collection.extend({ //this is a collection (array) of Event models bound to the events-view.js class
    model: Event,
    raw: null,
    today: null,
    localStorage: new Backbone.LocalStorage("events"), //localStorage persistance

    afterFetch: function(data) { //this processes the collection so that it can be bound to the collectionview = eventsview
      //load data file if in debug mode
      //todo: save the view to localstorage for persistance, and work out how to use dualsync the same way
      var raw = null;
      if(module.config().debug && data.length == 0) {
        raw = JSON.parse(eventsdata);
      }
        //sort the data in ascending order (past to future)
        //since we are iterating through, add date 'group'
        //note we are using the _.chain(x)
      raw = _.chain(raw).sortBy(function(d) { //sort everything in the collection. Since we are iterating do some processing at this stage instead of looping again
        var m = moment(d.dtstart.value);
        d.dtstart.params['group'] = m.format('YYYY-MM-DD');
        d.dtstart.params['time'] = m.format('h:mmA');
        return m.unix(); //return the unix seconds for the start date/time for sorting and filter purposes
      })
      //group the data; if date before past cutoff then return 'past'
      .groupBy(function(d) {
        var cutoff = '2014-05-26'; //anything before this date all gets lumped together into a 'past' group, set to 'today' for production
        var group = d.dtstart.params.group;
        return (group < cutoff ? 'past' : group);
      })
      //convert to a list
      .omit('past') //throw out anything in the 'past' group
      //retrieve array of key-value arrays
      .pairs(raw) //this is how we form the header/events sections in the layout
      //return the final raw array of arrays
      .value(); //this returns the array of arrays
      //create array of models
      _.each(raw, function(d) { //loop over the raw array of arrays and create the DOM layout
        var header = moment(d[0]).calendar();
        //use underscore.string to modify calendar() output to strip away 'at 12:00' etc.
        var n = d[1].length;
        this.add(new Event({'header':header, 'n':n}));
        //loop over items in this group, flag if it is the last item for styling and add event model to collection
        _.each(d[1], function(_d, i, list) {
          var _event = null;
          var flag = (i === list.length - 1);
          _d = (flag ? _.extend(_d, {'lastoftheday':true}) : _d); //if this is the last event for the group, flag it with an extra property
          _event = new Event(_d);
          _event.id = _d.uid.value;
          //put in random icons to test
          var klass = (_d.klass ? _d.klass : 'icon-' + parseInt(57 * Math.random()) );
          var testcolor = (_d.testcolor ? _d.testcolor : 'p2-color-' + parseInt(8 * Math.random()) );
          _event.set({"klass":klass, "testcolor":testcolor});
          this.add(_event); //add this new Event to the collection
        },this); //context is always 'this' collection
      }, this);
    },

    initialize: function() {
      var debug = module.config().debug; //check to see if we are in debug mode
      this.today = moment().format('YYYY-MM-DD'); //hang on to 'today' for cutoff and memory management
      this.fetch().done(_.bind(this.afterFetch, this)); //OK, try to grab data and then process it
    }

  });

  return Events;
});