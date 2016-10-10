define([
    'chaplin',
    'models/base/model'
], function(Chaplin, Model) {
    'use strict';

    var User = Model.extend({
        defaults: {
          ModeServer: MODESERVER,
          BuildDate: BUILDDATE,
          AndroidBuild: ANDROID,
          WebBuild: WEBAPP
        }

    });

    return User;
});
