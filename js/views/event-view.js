define([
  'chaplin',
  'views/base/view',
  'text!templates/event-view.hbs',
  'moment'
], function(Chaplin, View, template, moment) {
  'use strict';

  var EventView = View.extend({
    template: template,
    autoRender: true,
    className: 'event-view',
    container: '#main-container'
  });

  var formatDate = function(date, format) { //return date string as we want it it to look
      var dateForm = 'YYYYMMDDTHHmmssZ';
      var d = (moment(date,[dateForm]).isValid() ? moment(date,[dateForm]).format(format) : date);
      return d;
    }

  EventView.prototype.getTemplateData = function() {
    var data, source;
    var startDate, startTime, endTime;
    data = this.model ? Chaplin.utils.serialize(this.model) : {};
    source = this.model;
    if (source) {
      if (typeof source.isSynced === 'function' && !('synced' in data)) {
        data.synced = source.isSynced();
      }
    }
    data.exdate = moment(data.dtstart.value).calendar();
    data.dtstart.value = formatDate(data.dtstart.value, 'h:mmA'); //simplify the display of the start date/time to just the time
    data.dtend.value = formatDate(data.dtend.value, 'h:mmA');
    data.description.value = data.description.value.replace(/\\n/g, ' ').replace(/\\,/g, ',');
    return data;
  };

  return EventView;
});
