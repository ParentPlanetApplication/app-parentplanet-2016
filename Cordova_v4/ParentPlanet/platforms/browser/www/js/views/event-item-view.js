define([
  'chaplin',
  'views/base/view',
  'text!templates/event-item-view.hbs',
  'moment'
], function(Chaplin, View, template, moment) {
  'use strict';

  var EventItemView = View.extend({

    template: template, //which template to use: event-item-view.hbs for the item
    tagName: 'div', //what do we append to the containing list, here it is a div; but could be a li, or anything else
    className: 'row', //when the div is created other attributes to add to it, here it is a class="row"

    listen: { //chaplin triggers to respond to
      'change model': 'render', //OK render whenever the underlying model for this view changes
      'addedToParent': 'addedToParent' //we are going to need some extra css added to the item after it has been rendered
    },
    events: { //which event routing to respond to for this view item
      'click .delete': 'delete'
    },

    //when this view has been added to the DOM then do some last sec. styling for headers
    'addedToParent': function () {
      if(this.model.has('header')) {
        this.$el.addClass('header');
      }
      if(this.model.has('lastoftheday')) {
        this.$el.addClass('lastoftheday');
      }
    },
    //not used yet, example of how to handle an interaction from the cars CRUD
    'delete': function (event) {
      event.preventDefault();
      // Shortcuts
      var model = this.model;
      var collection = model.collection;
      // Remove the model from its collection. This disposes this item view.
      collection.remove(model);
      // Dispose the model explicitly. It shouldn’t be used elsewhere.
      model.dispose();
      collection.save();
    }

  }); //eo extend

  var formatDate = function(date, format) { //return date string as we want it it to look
    var dateForm = 'YYYYMMDDTHHmmssZ';
    var d = (moment(date,[dateForm]).isValid() ? moment(date,[dateForm]).format(format) : date);
    return d;
  }

  EventItemView.prototype.getTemplateData = function() {
    var data, source, m;
    var startDate, startTime, endTime;
    data = this.model ? Chaplin.utils.serialize(this.model) : {};
    source = this.model;
    if (source) {
      if (typeof source.isSynced === 'function' && !('synced' in data)) {
        data.synced = source.isSynced();
      }
    }
    if(source.has('dtstart')) {
      m = moment(data.dtstart.value);
      data.dtstart.params['group'] = m.format('YYYY-MM-DD');
      data.dtstart.params['time'] = m.format('h:mmA');
    }

            
  /*  data.exdate = moment(data.dtstart.value).calendar();
    data.dtstart.value = formatDate(data.dtstart.value, 'h:mmA'); //simplify the display of the start date/time to just the time
    data.dtend.value = formatDate(data.dtend.value, 'h:mmA');
    data.description.value = data.description.value.replace(/\\n/g, ' ').replace(/\\,/g, ',');
   */
    return data;
  };

  return EventItemView; //this class is instantiated for each event model in the events collection
});