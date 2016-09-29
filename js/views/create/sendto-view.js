define([
    'chaplin',
    'views/base/view',
    'text!templates/create/sendto-template.hbs',
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
    var selectedGroupIdArray = [];

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
            switch (_view.afterSendToView) {
                case _view.SCHEDULE_CREATION:
                    Chaplin.utils.redirectTo({
                        name: 'create-event'
                    });
                    break;
                case _view.MESSAGE_CREATION:
                    Chaplin.utils.redirectTo({
                        name: 'create-message'
                    });
                    break;
                case _view.HOMEWORK_CREATION:
                    Chaplin.utils.redirectTo({
                        name: 'create-homework'
                    });
                    break;
            }
        });

        $("#editBtn").on('click', function(e) {
            if (!isEdit) {
                isEdit = true;
                $(this).html("Done");
                //Show edit icons
                $(".name-wrapper").css("left", "12%");
                $(".icon-wrapper").removeClass("hidden-important");
                $("#custom-list").removeClass("hidden");
            } else if (selectedGroupIdArray.length == 0) {
                isEdit = false;
                $("#editBtn").html("Edit");
                //Show edit icons
                $(".name-wrapper").css("left", "2%");
                $(".icon-wrapper").addClass("hidden-important");
                $("#custom-list").addClass("hidden");
            }
        });

        $("#mylists").off("click");
        $("#custom-list").off("click");

        $("#custom-list").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");

            //Remember the current view
            user.view.beforeCustomListView = "create-sendto";
            localStorage.setItem("user", JSON.stringify(user));

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

    //Do not delete this, the function will be used in the next version
    /*var loadMyGroups = function() {
        var UserCustomList = Parse.Object.extend("UserCustomGroup");
        var query = new Parse.Query(UserCustomList);
        query.equalTo("userId", user.id);
        query.ascending("name");
        query.find({
            success: function(results) {
                mygroups = results;
                sortAndDisplayAllGroups();
            }, //eo success
            error: function(error) {
                    sortAndDisplayAllGroups();
                } //eo error
        }); //eo query.find
    }*/

    var sortAndDisplayAllGroups = function() {
        allgroups = customList.concat(mygroups);
        allgroups.sort(compareStrings);

        var group, groupType;
        for (var i = 0; i < allgroups.length; i++) {
            group = allgroups[i];
            //console.log(group.get("name"));
            //If a group has organization id attached to it, then it is a custom list

            if (group.get("organizationId") == null || group.get("organizationId") == "") {
                groupType = "mygroups";
            } else {
                groupType = "org";
            }
            $("#content").append('<div class="item-list" id="' + group.id + '" groupType="' + groupType + '"><div class="text-left" style="width:74%;">' + '<div class="icon-wrapper hidden-important" id="' + group.id + '" groupName="' + group.get("name") + '"><i class="icon-fontello-circle icon-grey"></i></div>' + '<div class="name-wrapper pointer" style="left:2%;" id="' + group.id + '" groupId="' + group.id + '" groupName="' + group.get("name") + '">' + group.get("name")
                //Do not DELETE this, we will need it in the next version
                /*+ '<div class="icon-right"><i class="icon-right-open"></i>'*/
                + '</div>' + '</div>' + '<div class="delete hidden">Delete</div> </div>');

                // '<div id="' + group.id + '" groupType="' + groupType + '"  class="create-menu-item"><div class="text">' + '<i class="icon-fontello-circle icon-grey hidden-important" style="width:74%;"></i>' + group.get("name") + '</div>' + '</div>');
        }

        //Init events
        $(".item-list").on('click', function(e) {
            //var groupType = $(this).attr("groupType");
            //console.log(groupType);
            var id = $(this).attr("id");
            _selectedCustomListId = id;
            //_selectedCustomListName = $(this).html();

            var index = customListId.indexOf(id);
            var object = customList[index];

            //Save locally
            user.customList.selectedCustomListData = object;
            localStorage.setItem("user", JSON.stringify(user)); //Save data locally


            if (isEdit) {
                //If Edit is enabled, we then go to custom-list-groups page to let user changes group

                selectedGroupIdArray = [];
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
                        $('#'+groupId).addClass("hidden");
                        var index = selectedGroupIdArray.indexOf(groupId);
                        selectedGroupIdArray.splice(index, 1);
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
                            },
                            error: function(error) {
                                //Todo: show error message
                                console.log(error);
                            }
                        }); //eo query.find
                    }); //eo defer
                }); //eo delete click


                $("#editBtn").on("click", function(e) {
                    if (selectedGroupIdArray.length > 0) {
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
                                        $('#'+group.id).addClass("hidden");
                                        group.destroy();
                                    }
                                },
                                error: function(error) {
                                    //Todo: show error message
                                    console.log(error);
                                    redirect();
                                }
                            }); //eo query.find
                            selectedGroupIdArray = [];
                            isEdit = false;
                            $("#editBtn").html("Edit");
                            //Show edit icons
                            $(".name-wrapper").css("left", "2%");
                            $(".icon-wrapper").addClass("hidden-important");
                            $("#custom-list").addClass("hidden");
                        }); //eo defer.done
                    } //eo if
                }); //eo doneBtn click

                // user.customList.isEdit = true;

                // //Remember the current view
                // user.view.beforeCustomListView = "create-sendto";
                // localStorage.setItem("user", JSON.stringify(user));

                // var groupType = $(this).attr("grouptype");

                // setTimeout(function() {
                //     if (groupType == "org") {
                //         Chaplin.utils.redirectTo({
                //             name: 'custom-list-org'
                //         });
                //     } else {
                //         Chaplin.utils.redirectTo({
                //             name: 'custom-list-mygroups'
                //         });
                //     }
                // }, DEFAULT_ANIMATION_DELAY);
            } else {

                $(this).addClass("bg-highlight-grey");
                setTimeout(function() {
                    switch (_view.afterSendToView) {
                        case _view.SCHEDULE_CREATION:
                            Chaplin.utils.redirectTo({
                                name: 'create-event'
                            });
                            break;
                        case _view.MESSAGE_CREATION:
                            Chaplin.utils.redirectTo({
                                name: 'create-message'
                            });
                            break;
                        case _view.HOMEWORK_CREATION:
                            Chaplin.utils.redirectTo({
                                name: 'create-homework'
                            });
                            break;
                    }
                }, DEFAULT_ANIMATION_DELAY);
            }
        });

        initButtonEvents();
        spinner.stop();
        //$("#custom-list").removeClass("hidden");
        $("#editBtn").removeClass("hidden");
    }

    var compareStrings = function(a, b) {
        // Assuming you want case-insensitive comparison
        a = a.get("name").toLowerCase();
        b = b.get("name").toLowerCase();

        return (a < b) ? -1 : (a > b) ? 1 : 0;
    }

    /*var loadCustomList2 = function() {
        var user = Parse.User.current();
        var UserCustomList = Parse.Object.extend("UserCustomList");
        var query = new Parse.Query(UserCustomList);
        query.equalTo("ownerId", user.id);
        query.ascending("name");
        spinner = _createSpinner('spinner');
        query.find({
            success: function(results) {
                if (results.length == 0) {
                    $("#innerview").append('<div class="text-center">You have no custom list.</div>');
                } else {
                    //Collect list of message ids
                    for (var i = 0; i < results.length; i++) {
                        var customList = results[i];
                        $("#innerview").append('<div customListId="' + customList.id + '" class="create-menu-item"><div class="text">' + customList.get("name") + '</div></div>');
                    }
                } //eo results.length
                $(".create-menu-item").on('click', function(e) {
                    _selectedCustomListId = $(this).attr("customListId");
                    _selectedCustomListName = $(this).html();
                    $(this).addClass("bg-highlight-grey");
                    setTimeout(function() {
                        switch (_view.afterSendToView) {
                            case _view.SCHEDULE_CREATION:
                                Chaplin.utils.redirectTo({
                                    name: 'create-event'
                                });
                                break;
                            case _view.MESSAGE_CREATION:
                                Chaplin.utils.redirectTo({
                                    name: 'create-message'
                                });
                                break;
                            case _view.HOMEWORK_CREATION:
                                Chaplin.utils.redirectTo({
                                    name: 'create-homework'
                                });
                                break;
                        }
                    }, DEFAULT_ANIMATION_DELAY);
                });
                $("#mylists").off("click");
                spinner.stop();
            }, //eo success
            error: function(error) {
                    if (callback) {
                        callback();
                    }
                    spinner.stop();
                } //eo error
        }); //eo query.find

    }*/

    //when the DOM has been updated let gumby reinitialize UI modules
    var addedToDOM = function() {
        initData();
        loadGroups();

    }; //eo AddedToDOM
    var __id = 'sendto-view';
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
