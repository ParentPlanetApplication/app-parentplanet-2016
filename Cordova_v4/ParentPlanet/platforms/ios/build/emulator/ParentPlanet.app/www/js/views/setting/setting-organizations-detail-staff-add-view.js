define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-organizations-detail-staff-add-view.hbs',
    'jquery'
], function(Chaplin, View, Template, $) {
    'use strict';

    var initButtons = function() {
        $("#backBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({    name: 'setting-organizations-detail-staff'    });
        });
        $("#addByIdBtn").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {
                Chaplin.utils.redirectTo({    name: 'setting-organizations-detail-staff-add-byid'    });
            }, DEFAULT_ANIMATION_DELAY);
        });
        $("#addByEmailBtn").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {
                Chaplin.utils.redirectTo({    name: 'setting-organizations-detail-staff-add-byemail'    });
            }, DEFAULT_ANIMATION_DELAY);
        });
    }; //eo initButtons

    var addedToDOM = function() {
        initButtons();
    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: 'setting-organizations-detail-staff-add-view',
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
