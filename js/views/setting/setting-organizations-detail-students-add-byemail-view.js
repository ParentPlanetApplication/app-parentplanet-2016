define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-organizations-detail-students-add-byemail-view.hbs',
    'jquery',
    'spinner'
], function(Chaplin, View, Template, $, spinner) {
    'use strict';

    var user;

    var initData = function(){
        user = JSON.parse(localStorage.getItem("user"));
    }; //eo initData

    var initButtons = function() {
        $("#cancelBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-organizations-detail-students-add'
            });
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
        id: 'setting-organizations-detail-students-add-byemail-view',
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
