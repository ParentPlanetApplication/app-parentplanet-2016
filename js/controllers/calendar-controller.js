define([
    'controllers/base/controller',
    'models/calendar',
    'views/index/content/calendar-view',
    'views/index/calendar-view'
], function(Controller, CalendarModel, CalendarView, CalendarHomeView) {
    'use strict';

    var CalendarController = Controller.extend({

        /*show: function(params) {
            this.model = new CalendarModel();
            this.view = new CalendarHomeView({
                model: this.model,
                region: 'main'
            });
        },*/

        read: function(params) {
            this.model = new CalendarModel();
            this.view = new CalendarView({
                model: this.model,
                region: 'main'
            });
        }
    });

    return CalendarController;
});
