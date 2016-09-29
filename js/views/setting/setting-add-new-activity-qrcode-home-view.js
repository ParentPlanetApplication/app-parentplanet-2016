define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-add-new-activity-qrcode-home-view.hbs',
    'jquery'
], function(Chaplin, View, Template, $) {
    'use strict';

    var addedToDOM = function() {
        $("#backBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-add-new-activity-home'
            });
        });
        //ToDo
        $("#scanQrCodeBtn").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {
                Chaplin.utils.redirectTo({
                    name: 'setting-add-new-activity-qrcode-scan'
                });
            }, DEFAULT_ANIMATION_DELAY);
        });
    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        className: 'view-container',
        id: 'setting-add-new-activity-qrcode-home-view',
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
