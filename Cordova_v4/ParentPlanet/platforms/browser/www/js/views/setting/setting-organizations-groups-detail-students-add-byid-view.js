define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-organizations-groups-detail-students-add-byid-view.hbs',
    'jquery',
    'spinner',
    'parse',
    'groupService'
], function(Chaplin, View, Template, $, spinner, Parse, groupService) {
    'use strict';

    var user;
    var selectedOrgId;
    var selectedOrgData;
    var selectedOrgGroupId;
    var selectedOrgGroupData;
    var childId;
    var parentId;

    var initData = function() {
        user = JSON.parse(localStorage.getItem("user"));
        selectedOrgId = user.setting.selectedOrgId;
        selectedOrgData = user.setting.selectedOrgData;
        selectedOrgGroupId = user.setting.selectedOrgGroupId;
        selectedOrgGroupData = user.setting.selectedOrgGroupData;
    }; //eo initData

    var initButtons = function() {
        $("#cancelBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-organizations-groups-detail-students-add'
            });
        });
    }; //eo initButtons

    var initAddByChildId = function() {
        //ToDo
        //Test this!

        $("#submit").on('click', function(e) {
            addById();
        });
    }; //eo initAddByChildId

    //Check if child exist
    var addById = function() {

        var studentId = $("#studentId").val();

        if (studentId == null || studentId == "") {
            _confirm("Please enter student id");
        } else {
            spinner.show();
            groupService
                .addStudentToGroupById(studentId, selectedOrgId, selectedOrgData.name, selectedOrgData.type, selectedOrgGroupId, selectedOrgGroupData.name, redirect)
                .then(function() { _alert('Student was successfully added to group'); })
                .always(function() { spinner.hide(); });

        }
    }; //eo addById

    var redirect = function() {
        spinner.hide();
        Chaplin.utils.redirectTo({
            name: 'setting-organizations-groups-detail-students'
        });
    }; //eo redirect

    var addedToDOM = function() {

        initData();
        initButtons();
        initAddByChildId();
    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: 'setting-organizations-groups-detail-students-add-byid-view',
        className: 'view-container',
        listen: {
            addedToDOM: addedToDOM
        },
        initialize: function(options) {
            //Reset footer
            $("#footer-toolbar > li").removeClass("active");
            Chaplin.View.prototype.initialize.call(this, arguments);
        }
    }); //eo view.extend

    return View;
});