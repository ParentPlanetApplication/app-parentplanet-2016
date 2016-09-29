define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-organizations-detail-students-add-view.hbs',
    'jquery'
], function(Chaplin, View, Template, $) {
    'use strict';


    var initButtons = function() {
        $("#backBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-organizations-detail-students'
            });
        });
        $("#addByIdBtn").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {
                Chaplin.utils.redirectTo({
                    name: 'setting-organizations-detail-students-add-byid'
                });
            }, DEFAULT_ANIMATION_DELAY);
        });
        $("#addByNameBtn").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {
                Chaplin.utils.redirectTo({
                    name: 'setting-organizations-detail-students-add-byname'
                });
            }, DEFAULT_ANIMATION_DELAY);
        });
        $("#addByNameEmailBtn").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {
                Chaplin.utils.redirectTo({
                    name: 'setting-organizations-detail-students-add-bynameemail'
                });
            }, DEFAULT_ANIMATION_DELAY);
        });
        $("#addByNameMobileBtn").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {
                Chaplin.utils.redirectTo({
                    name: 'setting-organizations-detail-students-add-bynamemobile'
                });
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
        id: 'setting-organizations-detail-students-add-view',
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
