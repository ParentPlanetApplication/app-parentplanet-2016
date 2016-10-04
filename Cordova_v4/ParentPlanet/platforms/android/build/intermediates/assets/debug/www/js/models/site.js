define([
  'chaplin',
  'models/base/model'
], function(Chaplin, Model) {
  'use strict';

  var Site = Model.extend({
    initialize: function() {
      this.set({
        toolbar: [
          {id: 'home-tool', cls: 'p2-home', label: 'Home'},
          {id: 'calendar-tool', cls: 'p2-calendar', label: 'Schedule'},
          {id: 'messages-tool', cls: 'p2-message-i', label: 'Messages'},
          {id: 'homework-tool', cls: 'p2-homework', label: 'Homework'},
          {id: 'contacts-tool', cls: 'p2-contact', label: 'Contacts'}
        ]
      });
      //console.log('site model ',this);
    }

  });

  return Site;
});
