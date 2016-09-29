define([
    'controllers/base/controller',
    'models/homework',
    'views/index/homework-view',
    'views/index/content/homework-view'
], function(Controller, Model, HomeworkHomeView, HomeworkView) {
    'use strict';

    var Controller = Controller.extend({

        show: function(params) {
            this.model = new Model();
            this.view = new HomeworkHomeView({
                model: this.model,
                region: 'main'
            });
        },

        read: function(params) {
            this.model = new Model();
            this.view = new HomeworkView({
                model: this.model,
                region: 'main'
            });
        }
    });

    return Controller;
});
