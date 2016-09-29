define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-user-default-list-view.hbs',
    'jquery',
    'parse'
], function(Chaplin, View, Template, $, Parse) {
    'use strict';

    var spinner = null;
    var user;
    var customList;
    var customListId;
    var mygroups;
    var allgroups;
    var isEdit;

    var initData = function() {
        spinner = _createSpinner('spinner');
        user = JSON.parse(localStorage.getItem("user"));
        customList = [];
        customListId = [];
        mygroups = [];
        allgroups = [];
        isEdit = false;

        //Reset edit custom list value everything we come back to this page
        user.customList.isEdit = false;
        localStorage.setItem("user", JSON.stringify(user));
    }

    var initButtonEvents = function() {
        //Init touch/click events
        $("#cancelBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-user-home'
            });
        });

        $("#mylists").off("click");
        $("#custom-list").off("click");

        $("#custom-list").on('click', function(e) {
            //Remember the current view
            user.view.beforeCustomListView = "setting-user-default-list";
            localStorage.setItem("user", JSON.stringify(user));

            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {
                Chaplin.utils.redirectTo({
                    name: 'custom-list'
                });
            }, DEFAULT_ANIMATION_DELAY);
        });
    }

    var loadGroups = function() {
        loadCustomList();
    }

    var loadCustomList = function() {
        var UserCustomList = Parse.Object.extend("UserCustomList", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserCustomList.query();
        query.equalTo("ownerId", user.id);
        query.ascending("name");
        query.find({
            success: function(results) {
                customList = results;

                //Build id index of custom list
                for (var i = 0; i < customList.length; i++) {
                    customListId.push(customList[i].id);
                }

                //loadMyGroups();
                sortAndDisplayAllGroups();
            }, //eo success
            error: function(error) {
                    //loadMyGroups();
                    sortAndDisplayAllGroups();
                    console.log(error)
                } //eo error
        }); //eo query.find
    }

    var sortAndDisplayAllGroups = function() {
        allgroups = customList.concat(mygroups);
        allgroups.sort(compareStrings);

        var group, groupType;
        $("#content").empty();
        for (var i = 0; i < allgroups.length; i++) {
            group = allgroups[i];
            //console.log(group.get("name"));
            //If a group has organization id attached to it, then it is a custom list

            if (group.get("organizationId") == null || group.get("organizationId") == "") {
                groupType = "mygroups";
            } else {
                groupType = "org";
            }
            $("#content").append(
                '<div class="item-list" id="' + group.id + '"><div class="text-left" style="width:74%;">' + '<div class="icon-wrapper" id="' + group.id + '" groupName="' + group.get("name") + '"><i class="icon-fontello-circle icon-grey"></i></div>' + '<div class="name-wrapper pointer" id="' + group.id + '" groupId="' + group.id + '" groupName="' + group.get("name") + '">' + group.get("name")
                //Do not DELETE this, we will need it in the next version
                /*+ '<div class="icon-right"><i class="icon-right-open"></i>'*/
                + '</div>' + '</div>' + '<div class="delete hidden">Delete</div> </div>'
            );
        }

        //Mark default group
        if (user.defaultCustomListId) {
            //$(".icon-fontello-ok").parent().remove();
            //$("#" + user.defaultCustomListId).append('<div class="icon-right"><i class="icon-fontello-ok"></i></div>');
        }

        //Init events
        var selectedGroupIdArray = [];
        $(".item-list").off("click");
        $(".delete").off("click");
        $(".item-list").on("click", function(e) {
            var groupId = $(this).attr("id"); //group's id = Kid's id
            var index = selectedGroupIdArray.indexOf(groupId);
            var div = $(this).children().children().children().eq(0);
            if (index == -1) {
                selectedGroupIdArray.push(groupId);
                div.removeClass("icon-fontello-circle");
                div.removeClass("icon-grey");
                div.addClass("icon-fontello-ok-circled");
                div.addClass("icon-red");
                $(this).children().eq(1).removeClass("hidden");
            } else {
                selectedGroupIdArray.splice(index, 1);
                div.addClass("icon-fontello-circle");
                div.addClass("icon-grey");
                div.removeClass("icon-fontello-ok-circled");
                div.removeClass("icon-red");
                $(this).children().eq(1).addClass("hidden");
            }
        }); //eo text-left click

        $(".delete").on("click", function(e) {
            var groupId = $(this).parent().attr("id");
            var defer = _confirm("Do you want to delete " + $(this).parent().children().eq(0).children().eq(1).html() + " from your default list?");
            defer.done(function() {
                var obj = $(this);
                obj.parent().animate({
                    "opacity": 0
                }, 1000, function() {
                    obj.parent().remove();
                });
                var UserCustomList = Parse.Object.extend("UserCustomList", {}, {
                  query: function(){
                    return new Parse.Query(this.className);
                  }
                });
                var query = UserCustomList.query();
                query.equalTo("objectId", groupId);
                query.find({
                    success: function(results) {
                        for (var i = 0; i < results.length; i++) {
                            var group = results[i];
                            group.destroy();
                        }
                        Chaplin.utils.redirectTo({
                            name: 'setting-user-home'
                        });
                    },
                    error: function(error) {
                        //Todo: show error message
                        console.log(error);
                        Chaplin.utils.redirectTo({
                            name: 'setting-user-home'
                        });
                    }
                }); //eo query.find
            }); //eo defer
        }); //eo delete click

        $("#doneBtn").on("click", function(e) {
            if (selectedGroupIdArray.length == 0) {
                Chaplin.utils.redirectTo({
                    name: 'setting-user-home'
                });
            } else {
                var groupId = $(this).parent().attr("id");
                var defer = _confirm("Do you want to delete these groups?");
                defer.done(function() {
                    //Get list of UserCustomLists that belong to the selected organization
                    var UserCustomList = Parse.Object.extend("UserCustomList", {}, {
                      query: function(){
                        return new Parse.Query(this.className);
                      }
                    });
                    var query = UserCustomList.query();
                    query.containedIn("objectId", selectedGroupIdArray);
                    query.find({
                        success: function(results) {
                            var groupIdArray = [];
                            for (var i = 0; i < results.length; i++) {
                                var group = results[i];
                                group.destroy();
                            }
                            Chaplin.utils.redirectTo({
                                name: 'setting-user-home'
                            });
                        },
                        error: function(error) {
                            //Todo: show error message
                            console.log(error);
                            redirect();
                        }
                    }); //eo query.find
                }); //eo defer.done
            } //eo else
        }); //eo doneBtn click

        initButtonEvents();
        spinner.stop();
        //$("#custom-list").removeClass("hidden");
        $("#doneBtn").removeClass("hidden");
    }; //eo sortAndDisplayAllGroups

    var compareStrings = function(a, b) {
        // Assuming you want case-insensitive comparison
        a = a.get("name").toLowerCase();
        b = b.get("name").toLowerCase();

        return (a < b) ? -1 : (a > b) ? 1 : 0;
    }

    //when the DOM has been updated let gumby reinitialize UI modules
    var addedToDOM = function() {
        initData();
        loadGroups();

    }; //eo AddedToDOM
    var __id = 'setting-user-default-list-view';
    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: __id,
        className: 'view-container',
        containerMethod: "prepend",
        listen: {
            addedToDOM: addedToDOM
        },
        initialize: function(options) {
            _setCurrentView(_view.SEND_TO, __id);
            Chaplin.View.prototype.initialize.call(this, arguments);
        }
    }); //eo View.extend

    return View;
});
