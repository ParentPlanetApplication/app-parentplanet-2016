define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-user-contact-info-view.hbs',
    'jquery',
    'spinner',
    'parse'
], function(Chaplin, View, Template, $, overlaySpinner, Parse) {
    'use strict';

    var user;
    var spinner;

    var initData = function() {
        user = JSON.parse(localStorage.getItem("user"));
    }

    var loadUserInfo = function() {
        var currentUser = Parse.User.current();

        var firstName = currentUser.get("firstName") ? currentUser.get("firstName") : "";
        var lastName = currentUser.get("lastName") ? currentUser.get("lastName") : "";
        var homePhone = currentUser.get("homePhone") ? currentUser.get("homePhone") : "";
        var mobilePhone = currentUser.get("mobilePhone") ? currentUser.get("mobilePhone") : "";
        var workPhone = currentUser.get("workPhone") ? currentUser.get("workPhone") : "";
        var addressLine1 = currentUser.get("addressLine1") ? currentUser.get("addressLine1") : "";
        var addressLine2 = currentUser.get("addressLine2") ? currentUser.get("addressLine2") : "";
        var city = currentUser.get("city") ? currentUser.get("city") : "";
        var zip = currentUser.get("zip") ? currentUser.get("zip") : "";

        $("#firstName").val(firstName);
        $("#lastName").val(lastName);
        $("#homePhone").val(homePhone);
        $("#mobilePhone").val(mobilePhone);
        $("#workPhone").val(workPhone);
        $("#addressLine1").val(addressLine1);
        $("#addressLine2").val(addressLine2);
        $("#city").val(city);
        $("#zip").val(zip);

        var state = currentUser.get("state");
        if (state) {
            if (state != "" && state != null) {
                $("#state").val(state);
            }
        }
    }

    var initButtonEvents = function() {
        $("#backBtn").on('click', function(e) {
            redirectTo();
        });

        $("#doneBtn").on('click', function(e) {
            onDone();
        });
    }

    var onDone = function() {

        overlaySpinner.show();

        var firstName = $("#firstName").val();
        var lastName = $("#lastName").val();
        var homePhone = $("#homePhone").val();
        var mobilePhone = $("#mobilePhone").val();
        var workPhone = $("#workPhone").val();
        var addressLine1 = $("#addressLine1").val();
        var addressLine2 = $("#addressLine2").val();
        var city = $("#city").val();
        var state = $("#state").val();
        var zip = $("#zip").val();

        if(firstName == ""){
            overlaySpinner.hide();
            _alert("Please enter your first name");
            return;
        }

        if(lastName == ""){
            overlaySpinner.hide();
            _alert("Please enter your last name");
            return;
        }

        // not requiring address for now

        // if(addressLine1 == ""){
        //     overlaySpinner.hide();
        //     _alert("Please enter your address");
        //     return;
        // }

        // if(city == ""){
        //     overlaySpinner.hide();
        //     _alert("Please enter your city");
        //     return;
        // }

        // if (state == "") {
        //     overlaySpinner.hide();
        //     _alert("Please select a state");
        //     return;
        // }

        // if(zip == ""){
        //     overlaySpinner.hide();
        //     _alert("Please enter your zip");
        //     return;
        // }

        var currentUser = Parse.User.current();
        currentUser.set("firstName", firstName);
        currentUser.set("lastName", lastName);
        currentUser.set("homePhone", homePhone);
        currentUser.set("mobilePhone", mobilePhone);
        currentUser.set("workPhone", workPhone);
        currentUser.set("addressLine1", addressLine1);
        currentUser.set("addressLine2", addressLine2);
        currentUser.set("city", city);
        currentUser.set("state", state);
        currentUser.set("zip", zip);

        currentUser.save(null, {
            success: function(user) {
                redirectTo();
            },
            error: function(user) {
                overlaySpinner.hide();
                _alert("Error, could not update user contact info");
            }
        });
    }

    var redirectTo = function() {
        overlaySpinner.hide();
        Chaplin.utils.redirectTo({
            name: 'setting-user-home'
        });
    }

    /*
    var validateEmail = function(email) {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }*/

    var addedToDOM = function() {
        initData();
        initButtonEvents();
        loadUserInfo();

    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: 'setting-user-contact-info-view',
        className: "user-signup view-container",
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
