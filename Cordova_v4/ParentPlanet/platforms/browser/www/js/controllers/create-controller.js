define([
    'controllers/base/controller',
    'models/create',
    'views/create/index-view',
    'views/create/new-event-view',
    'views/create/new-message-view',
    'views/create/new-homework-view',
    'views/create/sendto-view',
    'views/create/custom-list-view',
    'views/create/custom-list-org-view',
    'views/create/custom-list-mygroups-view',
    //'views/create/custom-list-groups-view',
    'views/create/edit-view',
    'views/create/group-info-view',
    'views/create/update-event-view',
    'views/create/update-homework-view'

], function(
    Controller,
    Model,
    CreateIndexView,
    CreateNewEventView,
    CreateNewMessageView,
    CreateNewHomeworkView,
    CreateSendToView,
    CustomListView,
    CustomListOrgView,
    CustomListMyGroupsView,
    //CustomListGroupsView,
    EditView,
    GroupInfoView,
    UpdateEventView,
    UpdateHomeworkView
    ) {
    'use strict';

    var CreateController = Controller.extend({

        beforeAction: function() {
            // Create a new Cars collection or preserve the existing.
            // This prevents the Cars collection from being disposed
            // in order to share it between controller actions.
            Controller.prototype.beforeAction();  //if we dont put this line here, there will be an error thrown
        },

        'index': function(params) {
            this.model = new Model();
            this.view = new CreateIndexView({
                model: this.model,
                region: 'main'
            });
        },

        'create-event': function(params) {
            this.model = new Model();
            this.view = new CreateNewEventView({
                model: this.model,
                region: 'main',
                params: params
            });
        },

        'create-message': function(params) {
            this.model = new Model();
            this.view = new CreateNewMessageView({
                model: this.model,
                region: 'main'
            });
        },

        'create-homework': function(params) {
            this.model = new Model();
            this.view = new CreateNewHomeworkView({
                model: this.model,
                region: 'main'
            });
        },

        'create-sendto': function(params) {
            this.model = new Model();
            this.view = new CreateSendToView({
                model: this.model,
                region: 'main'
            });
        },
        'custom-list': function(params) {
            this.model = new Model();
            this.view = new CustomListView({
                model: this.model,
                region: 'main'
            });
        },
        'custom-list-org': function(params) {
            this.model = new Model();
            this.view = new CustomListOrgView({
                model: this.model,
                region: 'main'
            });
        },
        'custom-list-mygroups': function(params) {
            this.model = new Model();
            this.view = new CustomListMyGroupsView({
                model: this.model,
                region: 'main'
            });
        },
        /*'custom-list-groups': function(params) {
            this.model = new Model();
            this.view = new CustomListGroupsView({
                model: this.model,
                region: 'main'
            });
        },*/
        'edit': function(params) {
            this.model = new Model();
            this.view = new EditView({
                model: this.model,
                region: 'main'
            });
        },
        'show-group-info': function(params) {
            this.model = new Model();
            this.view = new GroupInfoView({
                model: this.model,
                region: 'main'
            });
        },
        'update-event': function(params) {
            this.model = new Model();
            this.view = new UpdateEventView({
                model: this.model,
                region: 'main'
            });
        },
        'update-homework': function(params) {
            this.model = new Model();
            this.view = new UpdateHomeworkView({
                model: this.model,
                region: 'main'
            });
        }


    });

    return CreateController;
});

