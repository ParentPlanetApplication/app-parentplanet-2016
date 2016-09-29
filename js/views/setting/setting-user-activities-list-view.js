define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-user-activities-list-view.hbs',
    'jquery',
    'parse'
], function(Chaplin, View, Template, $, Parse) {
    'use strict';

    var user;
    var childObject;
    var spinner = null;

    var initData = function() {
        //Load user data from cache
        user = JSON.parse(_ls.getItem("user"));

        //Get child data
        var children = user.children;
        loop: for (var i = 0; i < children.length; i++) {
            childObject = children[i];
            if (childObject.id == _selectedChildId) {
                break loop;
            }
        }
    }

    var loadActivitiesList = function() {
        $("#titleStr").html(childObject.firstName);
        $("#titleStr").css("color", childObject.color);

        //Load Activites
        //Step1: Load user-org relations
        var spinner = _createSpinner('spinner');
        var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserOrganizationGroupRelation.query();
        query.equalTo("userId", childObject.id);
        query.equalTo("relationType", "student");
        query.find({
            success: function(results) {
                var organizationGroupIdArray = [];
                for (var i = 0; i < results.length; i++) {
                    var relation = results[i];
                    if (organizationGroupIdArray.indexOf(relation.get("organizationGroupId")) == -1) {
                        organizationGroupIdArray.push(relation.get("organizationGroupId"));
                    }
                }

                //Steps2: Load organization data
                var OrganizationGroup = Parse.Object.extend("OrganizationGroup", {}, {
                  query: function(){
                    return new Parse.Query(this.className);
                  }
                });
                var queryOrgGroup = OrganizationGroup.query();
                var queryMyGroup = OrganizationGroup.query();
                queryOrgGroup.containedIn("objectId", organizationGroupIdArray);
                queryMyGroup.containedIn("organizationId", organizationGroupIdArray);
                var query = Parse.Query.or(queryOrgGroup, queryMyGroup);
                query.ascending("name");
                query.find({
                    success: function(results) {
                        $("#title").removeClass("hidden");

                        for (var i = 0; i < results.length; i++) {
                            var group = results[i];
                            var groupId = group.get("isMyGroup") ? group.get("organizationId") : group.id; //if My Group use UserCustomGroup id
                            $("#main-content").append('<div class="menu-item" uid="' + groupId + '"><div class="text-left" >' + group.get("name") + '</div><div class="icon-right"><i class="icon-right-open"></i></div></div>');
                        }

                        //Init events
                        $(".menu-item").on('click', function(e) {
                            $(this).addClass("bg-highlight-grey");
                            _selectedChildActivityId = $(this).attr('uid');
                            _selectedChildActivityName = $(this).children().eq(0).html();
                            setTimeout(function() {
                                Chaplin.utils.redirectTo({
                                    name: 'setting-user-activities-detail'
                                });
                            }, DEFAULT_ANIMATION_DELAY);
                        });
                        $("#title").off('click');
                        spinner.stop();
                    },
                    error: function(error) {
                        console.log(error);
                        spinner.stop();
                    }
                }); //eo query.find org
                // loadOrgGroups(organizationGroupIdArray);
                // loadMyGroups(organizationGroupIdArray);
                // spinner.stop();


            },
            error: function(error) {
                console.log(error);
                spinner.stop();
            }
        }); //eo query.find user-org relations
    }; //eo loadActivitiesList

    // var loadOrgGroups = function(organizationGroupIdArray) {
    //     var OrganizationGroup = Parse.Object.extend("OrganizationGroup");
    //     var query = new Parse.Query(OrganizationGroup);
    //     query.containedIn("objectId", organizationGroupIdArray);
    //     query.ascending("name");
    //     query.find({
    //         success: function(results) {
    //             $("#title").removeClass("hidden");

    //             for (var i = 0; i < results.length; i++) {
    //                 var group = results[i];
    //                 $("#main-content").append('<div class="menu-item" uid="' + group.id + '"><div class="text-left" >' + group.get("name") + '</div><div class="icon-right"><i class="icon-right-open"></i></div></div>');
    //             }

    //             //Init events
    //             $(".menu-item").on('click', function(e) {
    //                 $(this).addClass("bg-highlight-grey");
    //                 _selectedChildActivityId = $(this).attr('uid');
    //                 _selectedChildActivityName = $(this).children().eq(0).html();
    //                 setTimeout(function() {
    //                     Chaplin.utils.redirectTo({
    //                         name: 'setting-user-activities-detail'
    //                     });
    //                 }, DEFAULT_ANIMATION_DELAY);
    //             });
    //             $("#title").off('click');
    //             //spinner.stop();
    //         },
    //         error: function(error) {
    //             console.log(error);
    //             spinner.stop();
    //         }
    //     }); //eo query.find org
    // }; //eo loadOrgGroups

    // var loadMyGroups = function(organizationGroupIdArray) {
    //     var UserCustomGroup = Parse.Object.extend("UserCustomGroup");
    //     var query = new Parse.Query(UserCustomGroup);
    //     query.containedIn("objectId", organizationGroupIdArray);
    //     query.ascending("name");
    //     query.find({
    //         success: function(results) {
    //             $("#title").removeClass("hidden");

    //             for (var i = 0; i < results.length; i++) {
    //                 var group = results[i];
    //                 $("#main-content").append('<div class="menu-item" uid="' + group.id + '"><div class="text-left" >' + group.get("name") + '</div><div class="icon-right"><i class="icon-right-open"></i></div></div>');
    //             }

    //             //Init events
    //             $(".menu-item").on('click', function(e) {
    //                 $(this).addClass("bg-highlight-grey");
    //                 _selectedChildActivityId = $(this).attr('uid');
    //                 _selectedChildActivityName = $(this).children().eq(0).html();
    //                 setTimeout(function() {
    //                     Chaplin.utils.redirectTo({
    //                         name: 'setting-user-activities-detail'
    //                     });
    //                 }, DEFAULT_ANIMATION_DELAY);
    //             });
    //             $("#title").off('click');
    //             //spinner.stop();
    //         },
    //         error: function(error) {
    //             console.log(error);
    //             spinner.stop();
    //         }
    //     }); //eo query.find org
    // }; //eo loadMyGroups


    var addedToDOM = function() {
        initData();
        loadActivitiesList();

        $("#backBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-user-activities-home'
            });
        });
    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        className: 'view-container',
        id: 'setting-user-activities-list-view',
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
