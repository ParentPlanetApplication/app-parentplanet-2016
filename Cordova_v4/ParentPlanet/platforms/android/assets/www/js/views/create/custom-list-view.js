define([
    'chaplin',
    'views/base/view',
    'text!templates/create/custom-list-view.hbs',
    'jquery',
    'parse',
    'spinner'
], function(Chaplin, View, Template, $, Parse, midSpinner) {
    'use strict';

    var user;
    var spinner;
    var userOrgRelations;
    var userOrgs;
    var userMyGroups;
    var allgroups;
    var orgIdArray;
    var orgIds;
    var orgIdData;
    var permissionArray;

    var initData = function() {
        user = JSON.parse(localStorage.getItem("user"));
        spinner = _createSpinner('spinner');

        userOrgRelations = [];
        userOrgs = [];
        userMyGroups = [];
        allgroups = []; //Contain both orgs and mygroups
        permissionArray = [];
    }

    var initButtonEvents = function() {
        $("#cancelBtn").on('click', function(e) {
            /*
            Chaplin.utils.redirectTo({
                name: 'create-sendto'
            });
            */
            Chaplin.utils.redirectTo({
                name: user.view.beforeCustomListView
            });
        });
    }

    // var checkPermissions = function() {
    //     if (user.isAdmin
    //             || user.setting.permissonOfSelectedOrg == "faculty"
    //             || user.setting.permissonOfSelectedOrg == "teacher"
    //             || user.setting.permissonOfSelectedOrg == "class parent"
    //             || user.setting.permissonOfSelectedOrg == "admin") {
    //         loadUserOrgRelations();
    //     } else {
    //             displayMyGroups();
    //             initMenuEvents();
    //     }
    // }

    var loadUserOrgRelations = function() {
        var UserOrganizationRelation = Parse.Object.extend("UserOrganizationRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserOrganizationRelation.query();
        if (!user.isAdmin) {
            query.containedIn("permission", ["faculty", "teacher", "classparent", "admin"]);
        }
        query.equalTo("userId", user.id);
        query.ascending("name");
        query.find({
            success: function(results) {
                userOrgRelations = results;
                loadOrgs();
            }, //eo success
            error: function(error) {
                    //loadMyGroups();
                    loadOrgs();
                    console.log(error)
                } //eo error
        }); //eo query.find
    }

    var loadOrgs = function() {

        orgIdArray = [];
        orgIdData = [];
        orgIds = [];
        var relation;
        for (var i = 0; i < userOrgRelations.length; i++) {
            relation = userOrgRelations[i];
            orgIds.push(relation.get("organizationId"));
            permissionArray.push(relation.get("permission"));
        }
        //console.log(userOrgRelations)
        //console.log(orgIdArray)
        var Organization = Parse.Object.extend("Organization", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = Organization.query();
        query.containedIn("objectId", orgIds);
        query.notEqualTo("objectId", "jXkZjUzi9T");
        query.find({
            success: function(results) {
                //Assign new attr so that we can use to tell the difference between orgs and mygroups when they are merged
                //This is only neccessary for sortAndDisplayAllGroups() function, which we do not use for now
                /*for (var i = 0; i < results.length; i++) {
                    results[i].isOrg = true;
                }*/

                userOrgs = results;
                for (var i = 0; i < results.length; i++) {
                    var org = results[i];
                        orgIdArray.push(org.get("organizationId"));
                        orgIdData.push(org);
                }
                displayOrgs();
                displayMyGroups();
                initMenuEvents();
            }, //eo success
            error: function(error) {
                    //loadMyGroups();
                    displayResultsWithMyGroups();
                    console.log(error)
                } //eo error
        }); //eo query.find
    }

    var displayOrgs = function() {
        var group;
        for (var i = 0; i < userOrgs.length; i++) {
            group = userOrgs[i];
            //console.log(group.get("name"));
            $("#content").append(
                '<div class="menu-item" id="' + group.id + '" groupType="org">   \
                <div class="text-left">' + group.get("name") + '</div>    \
                <div class="icon-right"><i class="icon-right-open"></i></div>   \
                </div>'
            );

        }
    }

    var displayMyGroups = function() {
        //Add mygroups menu
        $("#content").append(
            '<div class="menu-item" groupType="mygroups">   \
            <div class="text-left">My Groups</div>    \
            <div class="icon-right"><i class="icon-right-open"></i></div>   \
            </div>'
        );
    }

    var initMenuEvents = function() {
        //Init events
        $(".menu-item").on('click', function(e) {
            var groupType = $(this).attr("groupType");
            //console.log(groupType);

            if (groupType == "org") {
                //Save data locally
                user.customList.selectedId = $(this).attr("id");
                user.customList.selectedName = $(this).children(".text-left").eq(0).html();
                //user.customList.selectedGroupType = groupType;
                var selectedOrgId = $(this).attr("id");
                var permisson = permissionArray[orgIds.indexOf(selectedOrgId)];

                if (user.setting == null) {
                    user.setting = {};
                }
                //Store in localStorage cache
                user.setting.selectedOrgId = selectedOrgId;
                user.setting.selectedOrgData = orgIdData[orgIdArray.indexOf(selectedOrgId)];
                user.setting.permissonOfSelectedOrg = permisson;
                localStorage.setItem("user", JSON.stringify(user));

                //Redirect
                $(this).addClass("bg-highlight-grey");
                setTimeout(function() {
                    Chaplin.utils.redirectTo({
                        name: 'custom-list-org'
                    });
                }, DEFAULT_ANIMATION_DELAY);
            } else {

                //Redirect
                $(this).addClass("bg-highlight-grey");
                setTimeout(function() {
                    Chaplin.utils.redirectTo({
                        name: 'custom-list-mygroups'
                    });
                }, DEFAULT_ANIMATION_DELAY);
            }
        });

        spinner.stop();
    }

    /*  Do not delete this!!!
    var loadMyGroups = function() {
        var UserCustomList = Parse.Object.extend("UserCustomGroup");
        var query = new Parse.Query(UserCustomList);
        query.equalTo("userId", user.id);
        query.find({
            success: function(results) {
                userMyGroups = results;
                sortAndDisplayAllGroups();
            }, //eo success
            error: function(error) {
                    sortAndDisplayAllGroups();
                } //eo error
        }); //eo query.find
    }

    var sortAndDisplayAllGroups = function() {
        allgroups = userOrgs.concat(userMyGroups);
        allgroups.sort(compareStrings);
        //console.log(allgroups)
        var group, groupType;
        for (var i = 0; i < allgroups.length; i++) {
            group = allgroups[i];
            //console.log(group.get("name"));

            //If a group has organization id attached to it, then it is a custom list
            groupType = group.isOrg ? "org" : "mygroup";

            $("#content").append(
                '<div class="menu-item" id="' + group.id + '" groupType="' + groupType + '">   \
                <div class="text-left">' + group.get("name") + '</div>    \
                <div class="icon-right"><i class="icon-right-open"></i></div>   \
                </div>'
            );

        }

        //Init events
        $(".menu-item").on('click', function(e) {
            var groupType = $(this).attr("groupType");
            //console.log(groupType);

            //Save data locally
            user.customList.selectedId = $(this).attr("id");
            user.customList.selectedName = $(this).children(".text-left").eq(0).html();
            //user.customList.selectedGroupType = groupType;
            localStorage.setItem("user", JSON.stringify(user));

            //Redirect
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {
                Chaplin.utils.redirectTo({
                    name: 'custom-list-org'
                });
            }, DEFAULT_ANIMATION_DELAY);
        });

        spinner.stop();
    }*/

    //when the DOM has been updated let gumby reinitialize UI modules
    var addedToDOM = function() {

        initData();
        initButtonEvents();
        //checkPermissions();
        loadUserOrgRelations();
    };

    var compareStrings = function(a, b) {
        // Assuming you want case-insensitive comparison
        a = a.get("name").toLowerCase();
        b = b.get("name").toLowerCase();

        return (a < b) ? -1 : (a > b) ? 1 : 0;
    }

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        className: 'view-container custom-list-view',
        id: 'custom-list-view',
        //containerMethod: "prepend",
        listen: {
            addedToDOM: addedToDOM
        },
        initialize: function(options) {
            Chaplin.View.prototype.initialize.call(this, arguments);
        }
    }); //eo View.extend

    return View;
});
