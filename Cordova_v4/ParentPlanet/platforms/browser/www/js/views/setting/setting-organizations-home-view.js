define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-organizations-home-view.hbs',
    'jquery',
    'parse'
], function(Chaplin, View, Template, $, Parse) {
    'use strict';

    var user;
    var orgIdArray;
    var permissionArray;

    var initData = function() {
        user = JSON.parse(localStorage.getItem("user"));
        orgIdArray = [];
        permissionArray = [];
    }; //eo initData

    var loadOrganizations = function() {
        user.isAdmin ? loadOrgForAdmin() : loadOrgForUser();
    }; //eo loadOrganizations

    var loadOrgForAdmin = function() {
        var spinner = _createSpinner('spinner');
        var orgIdArray = [];
        var orgIdData = [];
        var Organization = Parse.Object.extend("Organization", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = Organization.query();
        query.notEqualTo("objectId", "jXkZjUzi9T");
        query.ascending("name");
        query.find({
            success: function(results) {
                //If no results found
                if (results.length == 0) {
                    $("#organizationList").append('<div style="text-align:center; padding:0 10px;">No organization found</div>');
                    spinner.stop();
                } else {
                    var organizationIdArray = [];
                    results.sort(function(a,b) {
                        a = a.get('name').toLowerCase();
                        b = b.get('name').toLowerCase();
                        a = a.split(' ');
                        b = b.split(' ');
                        if (a[0] < b[0]) //sort string ascending
                          return -1;
                        if (a[0] > b[0])
                          return 1;
                        return 0; //default return value (no sorting)
                    });
                    for (var i = 0; i < results.length; i++) {
                        var org = results[i];
                        orgIdArray.push(org.id);
                        orgIdData.push(org);
                        $("#organizationList").append(
                            '<div id="'
                            + org.id
                            + '" class="menu-item"><div class="text-left">'
                            + org.get("name")
                            + '</div><div class="icon-right"><i class="icon-right-open"></i></div></div>'
                        );
                    } //eo for results.length
                    //Init action evetns
                    $(".menu-item").on('click', function(e) {
                        //Get org id
                        var user = JSON.parse(localStorage.getItem("user"));
                        var selectedOrgId = $(this).attr("id");
                        if (user.setting == null) {
                            user.setting = {};
                        }
                        //Store in localStorage cache
                        user.setting.selectedOrgId = selectedOrgId;
                        user.setting.selectedOrgData = orgIdData[orgIdArray.indexOf(selectedOrgId)];
                        localStorage.setItem("user", JSON.stringify(user));
                        //Show animation & redirect
                        $(this).addClass("bg-highlight-grey");
                        setTimeout(function() {
                            Chaplin.utils.redirectTo({    name: 'setting-organizations-detail'    });
                        }, DEFAULT_ANIMATION_DELAY);
                    }); //eo menu-item click
                    $(".menu-item").eq(0).off("click");
                } //eo else results.length
                spinner.stop();
            }, //eo success
            error: function(error) {
                spinner.stop();
            }
        }); //eo query.find
    }; //eo loadOrgForAdmin

    var loadOrgForUser = function() {
        var spinner = _createSpinner('spinner');
        var orgIds = [];
        var orgIdArray = [];
        var orgIdData = [];
        var user = JSON.parse(localStorage.getItem("user"));
        var UserOrganizationRelation = Parse.Object.extend("UserOrganizationRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserOrganizationRelation.query();
        query.equalTo("userId", user.id);
        query.find({
            success: function(results) {
                //If no results found
                if (results.length == 0) {
                    $("#organizationList").append('<div style="text-align:center; padding:0 10px;">No organization found</div>');
                    spinner.stop();
                } else {
                    for (var i = 0; i < results.length; i++) {
                        var relation = results[i];
                        orgIds.push(relation.get("organizationId"));
                        permissionArray.push(relation.get("permission"));
                    }
                    //Load organization info and then save to system cache later
                    //Avoid storing data in localStorage here, what if an admin is on this page and we have 500+ orgs in the system?
                    var Organization = Parse.Object.extend("Organization", {}, {
                      query: function(){
                        return new Parse.Query(this.className);
                      }
                    });
                    var query = Organization.query();
                    query.containedIn("objectId", orgIds);
                    query.ascending("name");
                    query.find({
                        success: function(results) {
                            for (var i = 0; i < results.length; i++) {
                                var org = results[i];
                                orgIdArray.push(org.id);
                                orgIdData.push(org);
                                $("#organizationList").append(
                                    '<div id="'
                                    + org.id
                                    + '" class="menu-item"><div class="text-left">'
                                    + org.get("name")
                                    + '</div><div class="icon-right"><i class="icon-right-open"></i></div></div>'
                                );
                            } //eo for results.length
                            //Init action evetns
                            $(".menu-item").on('click', function(e) {
                                //Get org id and permission
                                var selectedOrgId = $(this).attr("id");
                                var permisson = permissionArray[orgIds.indexOf(selectedOrgId)];
                                if (user.setting == null) {    user.setting = {};    }
                                //Store in localStorage cache
                                user.setting.selectedOrgId = selectedOrgId;
                                user.setting.selectedOrgData = orgIdData[orgIdArray.indexOf(selectedOrgId)];
                                user.setting.permissonOfSelectedOrg = permisson;
                                localStorage.setItem("user", JSON.stringify(user));
                                //Show animation & redirect
                                $(this).addClass("bg-highlight-grey");
                                setTimeout(function() {
                                    Chaplin.utils.redirectTo({    name: 'setting-organizations-detail'    });
                                }, DEFAULT_ANIMATION_DELAY);
                            }); // menu-item click
                            $(".menu-item").eq(0).off("click");
                            spinner.stop();
                        },
                        error: function(error) {
                                spinner.stop();
                            } //eo error
                    }); //eo query.find
                } //eo results.length
            },
            error: function(error) {    spinner.stop();    }
        }); //eo query.find
    }; //eo loadOrgForUser

    var initButtons = function() {
        $("#backBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({    name: 'setting-home'    });
        });
    }; //eo initButtons

    var spinner = null;
    var addedToDOM = function() {
        initData();
        loadOrganizations();
        initButtons();
    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: 'setting-organizations-home-view',
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
