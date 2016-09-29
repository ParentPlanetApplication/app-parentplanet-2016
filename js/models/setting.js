define([
    'chaplin',
    'models/base/model'
], function(Chaplin, Model) {
    'use strict';

    var User = Model.extend({
        defaults: {
          ModeServer: MODESERVER
        }

    });

    return User;
});
