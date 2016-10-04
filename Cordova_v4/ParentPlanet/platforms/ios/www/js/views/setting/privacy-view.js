define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/privacy-view.hbs',
    'jquery',
    'parse'
], function(Chaplin, View, Template, $, Parse) {
    'use strict';

    var addedToDOM = function() {
      $("#backBtn").on('click', function (e) {
        _goToSettingPage(Chaplin);
      });

        // hide buttom bar if use null
        var user = Parse.User.current();
        if(user == null){
            $("#footer").hide();
            $("#privacy-view").css('padding-bottom','0px');
        } else {
            $("#footer").show();
            $("#privacy-view").css('padding-bottom','');
        }
    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: 'privacy-view',
        className: 'view-container',
        listen: {
            addedToDOM: addedToDOM
        },
        initialize: function(options) {
            //Reset footer
            $("#footer-toolbar > li").removeClass("active");
            Chaplin.View.prototype.initialize.call(this, arguments);
        }
    }); //eo View.extend

    return View;
});
