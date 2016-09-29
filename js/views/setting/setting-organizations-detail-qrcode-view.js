define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-organizations-detail-qrcode-view.hbs',
    'jquery'
], function(Chaplin, View, Template, $) {
    'use strict';

    var addedToDOM = function() {
        $("#backBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-organizations-detail'
            });
        });
    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: 'setting-organizations-detail-qrcode-view',
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
