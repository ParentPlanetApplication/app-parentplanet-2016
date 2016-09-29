define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-organizations-groups-detail-view.hbs',
    'jquery'
], function(Chaplin, View, Template, $) {
    'use strict';

    var loadInfo = function(){
        var user = JSON.parse(localStorage.getItem("user"));
        var selectedOrgGroupId = user.setting.selectedOrgGroupId;
        var data = user.setting.selectedOrgGroupData;
        $("#title").html(user.setting.selectedOrgData.name + " - " + data.name);
        $("#group-name").html(data.name);
        $("#group-id").html(data.objectId);
        $("#group-label").html(data.label);
        $("#group-info").html(data.description);
        if(user.isAdmin){
            $("#editBtn").removeClass("hidden");
            $("#groupAdminBtn").removeClass("hidden");
        }
        if (data.adminJsonList[user.id] == "Admin" || data.adminJsonList[user.id] == "Faculty") {
            $("#groupAdminBtn").removeClass("hidden");
        }
    }; //eo loadInfo

    var initEvents = function(){
        $("#backBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-organizations-groups-list'
            });
        });

        $("#editBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-organizations-groups-detail-edit'
            });
        });

        /*$("#qr").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-organizations-groups-detail-qrcode'
            });
        });*/
        $("#studentsBtn").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {
                Chaplin.utils.redirectTo({
                    name: 'setting-organizations-groups-detail-students'
                });
            }, DEFAULT_ANIMATION_DELAY);
        });

        $("#groupAdminBtn").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {
                Chaplin.utils.redirectTo({
                    name: 'setting-organizations-groups-detail-groupadmin'
                });
            }, DEFAULT_ANIMATION_DELAY);
        }); //eo groupAdminBtn click
    }; //eo initEvents

    var addedToDOM = function() {
        initEvents();
        loadInfo();
    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: 'setting-organizations-groups-detail-view',
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
