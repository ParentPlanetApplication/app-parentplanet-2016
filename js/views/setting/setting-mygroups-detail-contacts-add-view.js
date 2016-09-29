define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-mygroups-detail-contacts-add-view.hbs',
    'jquery'
], function(Chaplin, View, Template, $) {
    'use strict';


    var initButtons = function() {
        $("#backBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({ name: 'setting-mygroups-detail-contacts' });
        });
        $("#addByIdBtn").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {
                Chaplin.utils.redirectTo({ name: 'setting-mygroups-detail-contacts-add-byid' });
            }, DEFAULT_ANIMATION_DELAY);
        });
        $("#addByEmailBtn").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {
                Chaplin.utils.redirectTo({ name: 'setting-mygroups-detail-contacts-add-byemail' });
            }, DEFAULT_ANIMATION_DELAY);
        });
        $("#addByMobileBtn").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {
                Chaplin.utils.redirectTo({ name: 'setting-mygroups-detail-contacts-add-mobilephone' });
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
        id: 'setting-mygroups-detail-contacts-add-view',
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
