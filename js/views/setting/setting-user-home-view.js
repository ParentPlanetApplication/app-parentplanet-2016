define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-user-home-view.hbs',
    'jquery',
    'parse'
], function(Chaplin, View, Template, $, Parse) {
    'use strict';

    var addedToDOM = function() {
        var dirty = false; //keep track if anything has changed
        var user = Parse.User.current();
        var userLocal = JSON.parse(localStorage.getItem("user"));
        $("#backBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-home'
            });
        }); //eo backBtn click

        $("#contactPermissionsDefaultBtn").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {
                Chaplin.utils.redirectTo({
                    name: 'setting-user-contactpermissions'
                });
            }, DEFAULT_ANIMATION_DELAY);
        }); //eo contactPermissionsDefaultBtn click

        $("#activitiesBtn").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {
                Chaplin.utils.redirectTo({
                    name: 'setting-user-activities-home'
                });
            }, DEFAULT_ANIMATION_DELAY);
        }); //eo activitiesBtn click

        $("#kidsBtn").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {
                Chaplin.utils.redirectTo({
                    name: 'setting-user-kids-home'
                });
            }, DEFAULT_ANIMATION_DELAY);
        }); //eo kidsBtn click

        $("#accessBtn").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {
                Chaplin.utils.redirectTo({
                    name: 'setting-user-access-home'
                });
            }, DEFAULT_ANIMATION_DELAY);
        }); //eo accessBtn click

        $("#defaultListBtn").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {
                Chaplin.utils.redirectTo({
                    name: 'setting-user-default-list'
                });
            }, DEFAULT_ANIMATION_DELAY);
        }); //eo defaultListBtn click

        $("#contactInfoBtn").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {
                Chaplin.utils.redirectTo({
                    name: 'setting-user-contact-info'
                });
            }, DEFAULT_ANIMATION_DELAY);
        }); //eo defaultListBtn click

        $("#addToCalendarBtn").on('click', function() {
            console.log('clicked addToCalendarBtn  ' + $("#addToCalendarBtn").prop('checked'));
        });
        var emailBoolean = user.get("isEmailDelivery");
        emailBoolean = emailBoolean ? "checked" : "";
        $("#userId").append('<div class="text-left">User ID: '+ user.id + '</div>');
        $("#emailDeliveryBtn").prop('checked', emailBoolean);
        $("#emailDeliveryBtn").on('click', function() {
            var isChecked = $("#emailDeliveryBtn").prop('checked');
            dirty = true;
            user.set("isEmailDelivery", isChecked);
            user.save();
            findOrgGroups(isChecked);
        });
        var findOrgGroups = function(isChecked) {
            var childIdArray = [];
            var orgGroupIdArray = [];
            for (var i = 0; i < userLocal.children.length; i++) {
                childIdArray.push(userLocal.children[i].id);
            }
            var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var query = UserOrganizationGroupRelation.query();
            query.containedIn("userId", childIdArray);
            query.find({
                success: function(results) {
                    for (var i = 0; i < results.length; i++) {
                        var orgGroupRelation = results[i];
                        var orgGroupId = orgGroupRelation.get("organizationGroupId");
                        if (orgGroupIdArray.indexOf(orgGroupId) == -1) {
                            orgGroupIdArray.push(orgGroupId);
                        }
                    }
                    isChecked ? addToUserContactEmail(orgGroupIdArray) : removeUserContactEmail(orgGroupIdArray);
                    findLinkedGroups(isChecked);
                },
                error: function(error) {
                    console.log('Error: ' + JSON.stringify(error));
                }
            });
        }; //eo findOrgGroups

        var findLinkedGroups = function (isChecked) {
            var user = Parse.User.current();

            var getOriginalParent = function() {
                var deferred = $.Deferred();
                var userAcctAccess = Parse.Object.extend("UserAcctAccess", {}, {
                  query: function(){
                    return new Parse.Query(this.className);
                  }
                });
                var query = userAcctAccess.query();
                query.equalTo("givenAccessUserId", user.id);
                query.find({
                    success: function (results) {
                        results ? deferred.resolve(results) : deferred.reject();
                    },
                    error: function (error) {
                        console.log('Error: ' + JSON.stringify(error));
                        deferred.reject();
                    }
                });
                return deferred;
            };

            var getChildList = function(userAcctAccessList) {
                var deferred = $.Deferred();
                var child = Parse.Object.extend("Child", {}, {
                  query: function(){
                    return new Parse.Query(this.className);
                  }
                });
                var parentIdArray = [];
                $.each(userAcctAccessList, function(i, userAcctAccess) {
                    if (parentIdArray.indexOf(userAcctAccess.get("parentId")) == -1) {
                        parentIdArray.push(userAcctAccess.get("parentId"));
                    }
                });
                var query = child.query();
                query.containedIn("creatorParentId", parentIdArray);
                query.find({
                    success: function(results) {
                        results ? deferred.resolve(results) : deferred.reject();
                    },
                    error: function(error) {
                        console.log('Error: ' + JSON.stringify(error));
                        deferred.reject();
                    }
                });
                return deferred;
            };

            var getRelationGroup = function(childList) {
                var childIdArray = [];
                var orgGroupIdArray = [];
                $.each(childList, function(i, child) {
                    childIdArray.push(child.id);
                });
                var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation", {}, {
                  query: function(){
                    return new Parse.Query(this.className);
                  }
                });
                var query = UserOrganizationGroupRelation.query();
                query.containedIn("userId", childIdArray);
                query.find({
                    success: function(results) {
                        for (var i = 0; i < results.length; i++) {
                            var orgGroupRelation = results[i];
                            var orgGroupId = orgGroupRelation.get("organizationGroupId");
                            if (orgGroupIdArray.indexOf(orgGroupId) == -1) {
                                orgGroupIdArray.push(orgGroupId);
                            }
                        }
                        isChecked ? addToUserContactEmail(orgGroupIdArray) : removeUserContactEmail(orgGroupIdArray);
                    },
                    error: function(error) {
                        console.log('Error: ' + JSON.stringify(error));
                    }
                });
            };
            getOriginalParent().then(getChildList).then(getRelationGroup);
        };

        var addToUserContactEmail = function(orgGroupIdArray) {
            var UserCustomList = Parse.Object.extend("UserCustomList", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var query = UserCustomList.query();
            query.containedIn("groupId", orgGroupIdArray);
            query.find({
                success: function(results) {
                    for (var i = 0; i < results.length; i++) {
                        var customList = results[i];
                        customList.addUnique("userContactEmail", user.get("email"));
                        customList.save();
                    }
                },
                error: function(error) {
                    _alert('Server error: Unable to add address to email list');
                }
            });
        }; //eo addToUserContactEmail

        var removeUserContactEmail = function(orgGroupIdArray) {
            var UserCustomList = Parse.Object.extend("UserCustomList", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var query = UserCustomList.query();
            query.containedIn("groupId", orgGroupIdArray);
            query.find({
                success: function(results) {
                    for (var i = 0; i < results.length; i++) {
                        var customList = results[i];
                        customList.remove("userContactEmail", user.get("email"));
                        customList.save();
                    }
                },
                error: function(error) {
                    _alert('Server error: Unable to remove address from email list');
                }
            });
        }; //eo removeUserContactEmail
    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: 'setting-user-home-view',
        className: 'view-container',
        listen: {    addedToDOM: addedToDOM    },
        initialize: function(options) {
            $("#footer-toolbar > li").removeClass("active"); //Reset footer
            Chaplin.View.prototype.initialize.call(this, arguments);
        }
    }); //eo view.extend

    return View;
});
