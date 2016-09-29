define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-organizations-groups-detail-students-add-view.hbs',
    'jquery'
], function(Chaplin, View, Template, $) {
    'use strict';


    var initData = function(){
    }; //eo initData

    var initButtons = function(){

        $("#backBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-organizations-groups-detail-students'
            });
        });

        $("#addFromOrganization").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {
                Chaplin.utils.redirectTo({
                    name: 'setting-organizations-groups-detail-students-add-organization'
                });
            }, DEFAULT_ANIMATION_DELAY);
        });

        $("#addByIdBtn").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {
                Chaplin.utils.redirectTo({
                    name: 'setting-organizations-groups-detail-students-add-byid'
                });
            }, DEFAULT_ANIMATION_DELAY);

        });

        // $("#addByNameBtn").on('click', function(e) {
        //     $(this).addClass("bg-highlight-grey");
        //     setTimeout(function() {
        //         Chaplin.utils.redirectTo({
        //             name: 'setting-organizations-groups-detail-students-add-byname'
        //         });
        //     }, DEFAULT_ANIMATION_DELAY);
        // });

        $("#addByNameEmailBtn").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {
                Chaplin.utils.redirectTo({
                    name: 'setting-organizations-groups-detail-students-add-bynameemail'
                });
            }, DEFAULT_ANIMATION_DELAY);
        });

        $("#addByNameMobileBtn").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {
                Chaplin.utils.redirectTo({
                    name: 'setting-organizations-groups-detail-students-add-bynamemobile'
                });
            }, DEFAULT_ANIMATION_DELAY);
        });
    }; //eo initButtons

    var addedToDOM = function() {
        initData();
        initButtons();
    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: 'setting-organizations-groups-detail-students-add-view',
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
