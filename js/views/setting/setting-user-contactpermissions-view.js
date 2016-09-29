define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-user-contactpermissions-view.hbs',
    'jquery',
    'parse'
], function(Chaplin, View, Template, $, Parse) {
    'use strict';
    var user;
    var dirty = false;
    var initData = function() {
        user = Parse.User.current();
        var query = new Parse.Query(Parse.User);
        query.equalTo("objectId", user.id);
        query.find({
            success: function(results) {
                user = results[0];
                var parentFirstName = user.get("showParentFirstName");
                parentFirstName = parentFirstName ? "checked" : "";
                $("#parentFirstNameBtn").prop('checked', parentFirstName);
                $("#parentFirstNameBtn").on('click', function() {
                    var isChecked = $("#parentFirstNameBtn")[0].checked;
                    dirty = true;
                    user.set("showParentFirstName", isChecked);
                    user.save();
                });
                var parentLastName = user.get("showParentLastName");
                parentLastName = parentLastName ? "checked" : "";
                $("#parentLastNameBtn").prop('checked', parentLastName);
                $("#parentLastNameBtn").on('click', function() {
                    var isChecked = $("#parentLastNameBtn")[0].checked;
                    dirty = true;
                    user.set("showParentLastName", isChecked);
                    user.save();
                });
                var childFirstName = user.get("showChildFirstName");
                childFirstName = childFirstName ? "checked" : "";
                $("#childFirstNameBtn").prop('checked', childFirstName);
                $("#childFirstNameBtn").on('click', function() {
                    var isChecked = $("#childFirstNameBtn")[0].checked;
                    dirty = true;
                    user.set("showChildFirstName", isChecked);
                    user.save();
                });
                var childLastName = user.get("showChildLastName");
                childLastName = childLastName ? "checked" : "";
                $("#childLastNameBtn").prop('checked', childLastName);
                $("#childLastNameBtn").on('click', function() {
                    var isChecked = $("#childLastNameBtn")[0].checked;
                    dirty = true;
                    user.set("showChildLastName", isChecked);
                    user.save();
                });
                var email = user.get("showEmail");
                email = email ? "checked" : "";
                $("#emailBtn").prop('checked', email);
                $("#emailBtn").on('click', function() {
                    var isChecked = $("#emailBtn")[0].checked;
                    dirty = true;
                    user.set("showEmail", isChecked);
                    user.save();
                });
                var homePhone = user.get("showHomePhone");
                homePhone = homePhone ? "checked" : "";
                $("#homePhoneBtn").prop('checked', homePhone);
                $("#homePhoneBtn").on('click', function() {
                    var isChecked = $("#homePhoneBtn")[0].checked;
                    dirty = true;
                    user.set("showHomePhone", isChecked);
                    user.save();
                });
                var mobilePhone = user.get("showMobilePhone");
                mobilePhone = mobilePhone ? "checked" : "";
                $("#mobilePhoneBtn").prop('checked', mobilePhone);
                $("#mobilePhoneBtn").on('click', function() {
                    var isChecked = $("#mobilePhoneBtn")[0].checked;
                    dirty = true;
                    user.set("showMobilePhone", isChecked);
                    user.save();
                });
                var workPhone = user.get("showWorkPhone");
                workPhone = workPhone ? "checked" : "";
                $("#workPhoneBtn").prop('checked', workPhone);
                $("#workPhoneBtn").on('click', function() {
                    var isChecked = $("#workPhoneBtn")[0].checked;
                    dirty = true;
                    user.set("showWorkPhone", isChecked);
                    user.save();
                });
                var address = user.get("showAddress");
                address = address ? "checked" : "";
                $("#addressBtn").prop('checked', address);
                $("#addressBtn").on('click', function() {
                    var isChecked = $("#addressBtn")[0].checked;
                    dirty = true;
                    user.set("showAddress", isChecked);
                    user.save();
                });
            },
            error: function(err) {
                _alert('Internal error: '+JSON.stringify(err));
            }
        });
    }; //eo initData

    var addedToDOM = function() {
        initData();
        $("#backBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-user-home'
            });
        });




    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: 'setting-user-contactpermissions-view',
        className: 'view-container',
        listen: {
            addedToDOM: addedToDOM
        },
        initialize: function(options) {
            //Reset footer
            $("#footer-toolbar > li").removeClass("active");
            Chaplin.View.prototype.initialize.call(this, arguments);
        }
    });

    return View;
});
