define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-mygroups-detail-view.hbs',
    'jquery'
], function(Chaplin, View, Template, $) {
    'use strict';

    var loadInfo = function(){
        var user = JSON.parse(localStorage.getItem("user"));
        var selectedMyGroupId = user.setting.selectedMyGroupId;
        var data = user.setting.selectedMyGroupData;

        $("#title").html(data.name);
        $("#group-name").html(data.name);
        $("#group-id").html(data.objectId);
        if (data.type === 'Muslim' || data.type === 'Jewish' || data.type === 'Christian' || data.type === 'Buddhist') {
          $("#group-label").html('Religious');
        } else {
          $("#group-label").html(data.type);
        }
        $("#group-info").html(data.description);

    }; //eo loadInfo

    var initEvents = function(){
        $("#backBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-mygroups'
            });
        });
        $("#editBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-mygroups-edit'
            });
        });

        $("#contactsBtn").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {
                Chaplin.utils.redirectTo({
                    name: 'setting-mygroups-detail-contacts'
                });
            }, DEFAULT_ANIMATION_DELAY);
        });

        /*$("#groupAdminBtn").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {
                Chaplin.utils.redirectTo({
                    name: 'setting-mygroups-detail-groupadmin'
                });
            }, DEFAULT_ANIMATION_DELAY);
        });*/
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
        id: 'setting-mygroups-detail-view',
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
