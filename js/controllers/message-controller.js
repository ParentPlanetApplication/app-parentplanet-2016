define([
    'controllers/base/controller',
    'models/messages',
    'views/index/messages-view',
    'views/index/content/message-view'
], function(Controller, MessageModel, MessagesHomeView, MessageView) {
    'use strict';

    var MessageController = Controller.extend({

        show: function(params) {
            this.model = new MessageModel();
            this.view = new MessagesHomeView({
                model: this.model,
                region: 'main'
            });
        },

        read: function(params) {
            this.model = new MessageModel();
            this.view = new MessageView({
                model: this.model,
                region: 'main'
            });
        }
    });

    return MessageController;
});
