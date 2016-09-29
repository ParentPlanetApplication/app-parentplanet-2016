define([
    'controllers/base/controller',
    'models/contacts',
    'views/index/contacts-view',
    'views/index/contacts-groups-view',
    'views/index/contacts-groups-detail-view'
], function(Controller, Model, ContactsView, ContactsGroupsView, ContactsGroupsDetailView) {
    'use strict';

    var Controller = Controller.extend({

        //Not working for some reasons
        show: function(params) {
            this.model = new Model();
            this.view = new ContactsView({
                model: this.model,
                region: 'main'
            });
        },

        groups: function(params) {
            this.model = new Model();
            this.view = new ContactsGroupsView({
                model: this.model,
                region: 'main'
            });
        },

        'groups-detail': function(params) {
            this.model = new Model();
            this.view = new ContactsGroupsDetailView({
                model: this.model,
                region: 'main'
            });
        }
    });

    return Controller;
});
