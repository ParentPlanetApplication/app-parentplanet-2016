define([
    'chaplin',
    'models/base/model'
], function(Chaplin, Model) {
    'use strict';

    var Messages = Model.extend({
        defaults: {
            messages: 'Messages',
            editBtn: 'Edit',
            backBtn: 'Back',

            message: "Message",
            posted: "Posted: ",
            at: "at ",
            reminder: "Reminder",
            createdBy: "From"
        }

    });

    return Messages;
});
