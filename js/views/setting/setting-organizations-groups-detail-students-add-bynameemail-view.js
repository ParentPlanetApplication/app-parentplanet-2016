define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-organizations-groups-detail-students-add-bynameemail-view.hbs',
    'jquery',
    'spinner',
    'pgenerator',
    'parse',
    'groupService'
], function(Chaplin, View, Template, $, spinner, pgenerator, Parse, groupService) {
    'use strict';

    var user;
    var selectedOrgId;
    var selectedOrgData;
    var selectedOrgGroupId;
    var selectedOrgGroupData;
    var pwd;
    var deferred = null;
    var redirect = function() {
        spinner.hide();
        setTimeout(function() {
            Chaplin.utils.redirectTo({ name: 'setting-organizations-groups-detail-students' });
        }, DEFAULT_ANIMATION_DELAY);
    }; //eo redirect
    var initData = function() {
        user = _getUserData();
        selectedOrgId = user.setting.selectedOrgId;
        selectedOrgData = user.setting.selectedOrgData;
        selectedOrgGroupId = user.setting.selectedOrgGroupId;
        selectedOrgGroupData = user.setting.selectedOrgGroupData;

    }; //eo initData
    var initButtons = function() {
        $("#cancelBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({ name: 'setting-organizations-groups-detail-students' });
        });
    }; //eo initButtons
    var generatedPassword = function(generatedPassword) {
        pwd = generatedPassword;
    };
    var initAddByNameEmail = function() {
        var ele = $('#submit');
        ele.pGenerator({ //put this here so that when submit is clicked a new pwd is generated before the actual submit callback
            'bind': 'click',
            'passwordLength': 7,
            'uppercase': true,
            'lowercase': true,
            'numbers': true,
            'specialChars': false,
            'onPasswordGenerated': generatedPassword
        });
        ele.on('click', function(e) { //bind form fields to model vars
            addByNameEmail(
                $("#email").val().toLowerCase(),
                $("#firstName").val(),
                $("#lastName").val(),
                pwd);
        });
    }; //eo initAddByEmail
    /*
     * MAIN HERE
     */
    var addByNameEmail = function(email, firstName, lastName, pwd) {
        function validate() {
            var flag = false;
            if (!firstName || !lastName || !email) {
                _alert("Please enter all fields");
            } else if (!_validateEmail(email)) {
                _alert("Please enter a valid email address");
            } else { flag = true; }
            return flag;
        }; //eo validate

        if (validate()) {
            spinner.show();
            groupService.addStudentToGroupByMail(
                    user, firstName, lastName, email, pwd,
                    selectedOrgId, selectedOrgData.name, selectedOrgData.type,
                    selectedOrgGroupId, selectedOrgGroupData.name, redirect)
                .then(function() { _alert('Student was successfully added to group'); })
                .always(function() {
                    spinner.hide();
                });
        }
    }; //eo addByNameEmail

    var addedToDOM = function() {
        initData();
        initButtons();
        initAddByNameEmail();
    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: 'setting-organizations-groups-detail-students-add-bynameemail-view',
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