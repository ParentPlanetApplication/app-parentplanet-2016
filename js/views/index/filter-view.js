define([
    'chaplin',
    'views/base/view',
    'text!templates/index/filter-view.hbs',
    'jquery',
    'parse'

], function(Chaplin, View, Template, $, Parse) {
    'use strict';
    //view scope vars
    var spinner = null;
    var unselectedKidIdList;
    var unselectedActivityIdList;
    var user;

    var initData = function() {
        unselectedKidIdList = _unselectedKidIdList.slice();
        unselectedActivityIdList = _unselectedActivityIdList.slice();
        user = JSON.parse(_ls.getItem("user"));
    }; //eo initData

    var initButtons = function() {
        var goToPreviousPage = function() { //backBtn handler
            switch (_view.previousView) {
                case _view.HOME:
                    _setPreviousView();
                    Chaplin.utils.redirectTo({    name: 'home'    });
                break;
                case _view.SCHEDULE_INDEX:
                    _setPreviousView();
                    Chaplin.utils.redirectTo({   name: 'calendar'    });
                break;
                case _view.MESSAGES_INDEX:
                    _setPreviousView();
                    Chaplin.utils.redirectTo({    name: 'message'    });
                break;
                case _view.HOMEWORK_INDEX:
                    _setPreviousView();
                    Chaplin.utils.redirectTo({    name: 'homework'    });
                break;
                case _view.CONTACTS_INDEX:
                    _setPreviousView();
                    Chaplin.utils.redirectTo({    name: 'contacts'    });
                break;
                default:
                    _setPreviousView();
                    Chaplin.utils.redirectTo({    name: 'home'    });
                break;
            } //eo switch
        }; //eo goToPreviousPage
        $("#cancelBtn").on('click', function(e) {    goToPreviousPage();    });
        $("#doneBtn").on('click', function(e) {
            _unselectedKidIdList = unselectedKidIdList.slice();
            _unselectedActivityIdList = unselectedActivityIdList.slice();
            goToPreviousPage();
        }); //eo doneBtn
        $("#filter").on('click', function() {
            _setPreviousView();
            Chaplin.utils.redirectTo({    name: 'filter'    });
        }); //eo filter
        $("#search").on('click', function() {
            _setPreviousView();
            Chaplin.utils.redirectTo({    name: 'search'    });
        }); //eo search
        $("#select-all").on('click', function(e) {
            $(".circle-icon-wrapper").children("i").removeClass("icon-fontello-circle");
            $(".circle-icon-wrapper").children("i").removeClass("icon-grey");
            $(".circle-icon-wrapper").children("i").addClass("icon-fontello-ok-circled");
            $(".circle-icon-wrapper").children("i").addClass("icon-p2-green");
            unselectedKidIdList = [];
            unselectedActivityIdList = [];
        }); //eo select-all
        $("#clear-all").on('click', function(e) {
            $(".circle-icon-wrapper").children("i").addClass("icon-fontello-circle");
            $(".circle-icon-wrapper").children("i").addClass("icon-grey");
            $(".circle-icon-wrapper").children("i").removeClass("icon-fontello-ok-circled");
            $(".circle-icon-wrapper").children("i").removeClass("icon-p2-green");
            unselectedKidIdList = [];
            unselectedActivityIdList = [];
            $("#kidList > .kid-menu").each(function() {
                unselectedKidIdList.push($(this).attr("uid"));
            });
            $("#actList > .act-menu").each(function() {
                unselectedActivityIdList.push($(this).attr("uid"));
            });
        }); //eo clear-all
    }; //eo initButtons

    var loadFilterList = function() {
        var changeToUnselectedIcon = function(div) {
            $(div).children(".text-left").children(".circle-icon-wrapper").children("i").addClass("icon-fontello-circle");
            $(div).children(".text-left").children(".circle-icon-wrapper").children("i").addClass("icon-grey");
            $(div).children(".text-left").children(".circle-icon-wrapper").children("i").removeClass("icon-fontello-ok-circled");
            $(div).children(".text-left").children(".circle-icon-wrapper").children("i").removeClass("icon-p2-green");
        };
        var changeToSelectedIcon = function(div) {
            $(div).children(".text-left").children(".circle-icon-wrapper").children("i").removeClass("icon-fontello-circle");
            $(div).children(".text-left").children(".circle-icon-wrapper").children("i").removeClass("icon-grey");
            $(div).children(".text-left").children(".circle-icon-wrapper").children("i").addClass("icon-fontello-ok-circled");
            $(div).children(".text-left").children(".circle-icon-wrapper").children("i").addClass("icon-p2-green");
        };
        //Load kids
        var children = user.children;
        if (children.length == 0) {
            $("#kidList").append('No children found');
        } else {
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                if (unselectedKidIdList.indexOf(child.id) == -1) {
                    $("#kidList").append(
                        '<div class="menu-item kid-menu" uid="' + child.id + '">   \
                        <div class="text-left"> \
                        <div class="circle-icon-wrapper"><i class="icon-fontello-ok-circled icon-p2-green"></i></div>' + child.firstName + '</div>    \
                        </div>'
                    );
                } else {
                    $("#kidList").append(
                        '<div class="menu-item kid-menu" uid="' + child.id + '">   \
                        <div class="text-left"> \
                        <div class="circle-icon-wrapper"><i class="icon-fontello-circle icon-grey"></i></div>' + child.firstName + '</div>    \
                        </div>'
                    );
                } //eo else
            } //eo for children.length
        } //eo else children.length
        //Init events
        $(".kid-menu").on('click', function(e) {
            var id = $(this).attr("uid");
            if (unselectedKidIdList.indexOf(id) == -1) {
                unselectedKidIdList.push(id);
                changeToUnselectedIcon(this);
            } else {
                unselectedKidIdList.splice(unselectedKidIdList.indexOf(id), 1);
                changeToSelectedIcon(this);
            }
        });
        //Load activities (Get org IDs)
        var orgIdArray = [];
        // Fix by phuongnh@vinasource.com
        // Filter button not work in case data not already
        console.log(user);
        if(user.data.messages != undefined) {
            for (var i = 0; i < user.data.messages.length; i++) {
                var message = user.data.messages[i];
                var orgId = message.orgIdForThisObject;
                if (orgIdArray.indexOf(orgId) == -1) {
                    orgIdArray.push(orgId);
                }
            } //eo for user.data.messages.length
        }
        if(user.data.events != undefined) {
            for (var i = 0; i < user.data.events.length; i++) {
                var event = user.data.events[i];
                var orgId = event.orgIdForThisObject;

                if (orgIdArray.indexOf(orgId) == -1) {
                    orgIdArray.push(orgId);
                }
            } //eo for user.data.events.length
        }
        if(user.data.homework != undefined) {
            for (var i = 0; i < user.data.homework.length; i++) {
                var homework = user.data.homework[i];
                var orgId = homework.orgIdForThisObject;
                if (orgIdArray.indexOf(orgId) == -1) {    orgIdArray.push(orgId);    }
            } //eo for user.data.homework.length
        }
        var activityNameList = [];
        var activityIdList = [];
        //Gather all customListId(s) then link them with orgGroupId (activities)
        var childIdArray = [];
        for (var i = 0; i < user.children.length; i++) {
            var child = user.children[i];
            childIdArray.push(child.id);
        } //eo for user.children.length

        var Organization = Parse.Object.extend("Organization", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = Organization.query();
        var adminOrg = [] //ids of orgs user is an admin of to find associated orgGroups
        query.equalTo("adminIdList", user.id);
        spinner = _createSpinner("spinner");
        query.find({
            success: function(results) {
                for (var i = 0; i < results.length; i++) {
                    var org = results[i];
                    if (adminOrg.indexOf(org.id) == -1) {
                        adminOrg.push(org.id);
                    }
                }
                getOrgGroups(adminOrg);
            },
            error: function(err) {
                $(".filter-top, .filter-bottom").removeClass("hidden");
                spinner.stop();
            }
        }); //eo query.find
        var getOrgGroups = function(adminOrg) {
            var OrganizationGroup = Parse.Object.extend("OrganizationGroup", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var query = new Parse.Query('OrganizationGroup');
            var groupAdminArray = [];
            query.containedIn("organizationId", adminOrg);
            query.find({
                success: function(results) {
                    for (var i = 0; i < results.length; i++) {
                        var group = results[i];
                        if (groupAdminArray.indexOf(group.id) == -1) {
                            groupAdminArray.push(group.id);
                        }
                    }
                    loadOrgGroups(groupAdminArray);
                },
                error: function(err) {
                    $(".filter-top, .filter-bottom").removeClass("hidden");
                    spinner.stop();
                }
            });
        }
        var loadOrgGroups = function(groupAdminArray) {
            var orgRelationArray = childIdArray.concat([user.id]); //get groups User is an admin of
            var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var relationArray = UserOrganizationGroupRelation.query();
            relationArray.containedIn("userId", orgRelationArray);
            var orgArray = UserOrganizationGroupRelation.query();
            orgArray.containedIn("organizationGroupId", groupAdminArray);
            var query = Parse.Query.or(relationArray, orgArray);
            query.ascending("groupName");
            //spinner = _createSpinner("spinner");
            query.find({ //get the organization data from Parse
                success: function(results) {
                    // if (results.length == 0) {
                    //     $("#actList").append('No activity found');
                    // } else {
                        //sort array by name
                        for (var i = 0; i < results.length; i++) {
                            var relation = results[i];
                            if (activityIdList.indexOf(relation.get("organizationGroupId")) == -1) {
                                activityIdList.push(relation.get("organizationGroupId"));
                                activityNameList.push(relation.get("groupName"));
                            }
                        }
                        loadMyGroups(activityIdList, activityNameList);
                    //     for (var i = 0; i < activityIdList.length; i++) {
                    //         var actId = activityIdList[i];
                    //         var actName = activityNameList[i];

                    //         if (unselectedActivityIdList.indexOf(actId) == -1) {
                    //             $("#actList").append(
                    //                 '<div class="menu-item act-menu" uid="' + actId + '">   \
                    //                         <div class="text-left"> \
                    //                         <div class="circle-icon-wrapper"><i class="icon-fontello-ok-circled icon-p2-green"></i></div>' + actName + '</div>    \
                    //                         </div>'
                    //             );
                    //         } else {
                    //             $("#actList").append(
                    //                 '<div class="menu-item act-menu" uid="' + actId + '">   \
                    //                         <div class="text-left"> \
                    //                         <div class="circle-icon-wrapper"><i class="icon-fontello-circle icon-grey"></i></div>' + actName + '</div>    \
                    //                         </div>'
                    //             );
                    //         }
                    //     }
                    // } //eo for results.length
                    //     $(".act-menu").on('click', function(e) {
                    //         var id = $(this).attr("uid");
                    //         if (unselectedActivityIdList.indexOf(id) == -1) {
                    //             unselectedActivityIdList.push(id);
                    //             changeToUnselectedIcon(this);
                    //         } else {
                    //             unselectedActivityIdList.splice(unselectedActivityIdList.indexOf(id), 1);
                    //             changeToSelectedIcon(this);
                    //         }
                    //     }); //eo act-menu click
                    // $(".filter-top, .filter-bottom").removeClass("hidden");
                    // spinner.stop();
                }, //eo success find
                error: function(error) {
                    $(".filter-top, .filter-bottom").removeClass("hidden");
                    spinner.stop();
                }
            }); //eo query.find
        }; //eo loadOrgGroups
        var loadMyGroups = function(activityIdList, activityNameList) {
            var UserCustomGroup = Parse.Object.extend("UserCustomGroup", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var query = UserCustomGroup.query();
            query.containedIn("userId", user.userAcctAccessIds);
            query.ascending("name");
            //spinner = _createSpinner("spinner");
            query.find({ //get the organization data from Parse
                success: function(results) {
                    //sort array by name
                    for (var i = 0; i < results.length; i++) {
                        var relation = results[i];
                        if (activityIdList.indexOf(relation.id) == -1) {
                            activityIdList.push(relation.id);
                            activityNameList.push(relation.get("name"));
                        }
                    }
                    if (activityIdList.length == 0) {
                        $("#actList").append('No activity found');
                    } else {
                        for (var i = 0; i < activityIdList.length; i++) {
                            var actId = activityIdList[i];
                            var actName = activityNameList[i];

                            if (unselectedActivityIdList.indexOf(actId) == -1) {
                                $("#actList").append(
                                    '<div class="menu-item act-menu" uid="' + actId + '">   \
                                            <div class="text-left"> \
                                            <div class="circle-icon-wrapper"><i class="icon-fontello-ok-circled icon-p2-green"></i></div>' + actName + '</div>    \
                                            </div>'
                                );
                            } else {
                                $("#actList").append(
                                    '<div class="menu-item act-menu" uid="' + actId + '">   \
                                            <div class="text-left"> \
                                            <div class="circle-icon-wrapper"><i class="icon-fontello-circle icon-grey"></i></div>' + actName + '</div>    \
                                            </div>'
                                );
                            }
                        }

                        $(".act-menu").on('click', function(e) {
                            var id = $(this).attr("uid");
                            if (unselectedActivityIdList.indexOf(id) == -1) {
                                unselectedActivityIdList.push(id);
                                changeToUnselectedIcon(this);
                            } else {
                                unselectedActivityIdList.splice(unselectedActivityIdList.indexOf(id), 1);
                                changeToSelectedIcon(this);
                            }
                        }); //eo act-menu click
                    } //eo else
                    $(".filter-top, .filter-bottom").removeClass("hidden");
                    spinner.stop();
                }, //eo success find
                error: function(error) {
                    $(".filter-top, .filter-bottom").removeClass("hidden");
                    spinner.stop();
                }
            }); //eo query.find
        }; //eo loadMyGroups
    }; //eo loadFilterList

    var loadInfo = function(unselectedKidIdList, unselectedActivityIdList) {
        //Load kids
        var cache = JSON.parse(_ls.getItem("user"));
        var children = cache.children;
        if (children.length == 0) {
            $("#kidList").append('You have no children');
        } else {
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                if (unselectedKidIdList.indexOf(child.id) == -1) {
                    $("#kidList").append(
                        '<div class="menu-item kid-menu" uid="' + child.id + '">   \
                        <div class="text-left"> \
                        <div class="circle-icon-wrapper"><i class="icon-fontello-ok-circled icon-p2-green"></i></div>' + child.firstName + '</div>    \
                        </div>'
                    );
                } else {
                    $("#kidList").append(
                        '<div class="menu-item kid-menu" uid="' + child.id + '">   \
                        <div class="text-left"> \
                        <div class="circle-icon-wrapper"><i class="icon-fontello-circle icon-grey"></i></div>' + child.firstName + '</div>    \
                        </div>'
                    );
                } //eo else
            } //eo for children.length
        } //eo else children.length

        //Load activities associated with kids
        var activityNameList = [];
        var activityIdList = [];
        //Gather all customListId(s) then link them with orgGroupId (activities)
        /*
        for(var i=0; i<cache.data.messages; i++){

        }*/
        var user = Parse.User.current();
        var childIdArray = [];
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            childIdArray.push(child.id);
        }

        var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserOrganizationGroupRelation.query();
        query.containedIn("userId", childIdArray);
        query.ascending("groupName");
        spinner = _createSpinner("spinner");
        query.find({
            success: function(results) {
                for (var i = 0; i < results.length; i++) {
                    var relation = results[i];
                    if (activityIdList.indexOf(relation.get("organizationGroupId")) == -1) {
                        activityIdList.push(relation.get("organizationGroupId"));
                        activityNameList.push(relation.get("groupName"));
                    }
                }
                if (activityIdList.length == 0) {
                    $("#actList").append('No activity found for your children');
                } else {
                    //sort array by name
                    for (var i = 0; i < activityIdList.length; i++) {
                        var actId = activityIdList[i];
                        var actName = activityNameList[i];

                        if (unselectedActivityIdList.indexOf(actId) == -1) {
                            $("#actList").append(
                                '<div class="menu-item act-menu" uid="' + actId + '">   \
                                        <div class="text-left"> \
                                        <div class="circle-icon-wrapper"><i class="icon-fontello-ok-circled icon-p2-green"></i></div>' + actName + '</div>    \
                                        </div>'
                            );
                        } else {
                            $("#actList").append(
                                '<div class="menu-item act-menu" uid="' + actId + '">   \
                                        <div class="text-left"> \
                                        <div class="circle-icon-wrapper"><i class="icon-fontello-circle icon-grey"></i></div>' + actName + '</div>    \
                                        </div>'
                            );
                        }
                    }
                    var changeToUnselectedIcon = function(div) {
                        $(div).children(".text-left").children(".circle-icon-wrapper").children("i").addClass("icon-fontello-circle");
                        $(div).children(".text-left").children(".circle-icon-wrapper").children("i").addClass("icon-grey");
                        $(div).children(".text-left").children(".circle-icon-wrapper").children("i").removeClass("icon-fontello-ok-circled");
                        $(div).children(".text-left").children(".circle-icon-wrapper").children("i").removeClass("icon-p2-green");
                    };
                    var changeToSelectedIcon = function(div) {
                        $(div).children(".text-left").children(".circle-icon-wrapper").children("i").removeClass("icon-fontello-circle");
                        $(div).children(".text-left").children(".circle-icon-wrapper").children("i").removeClass("icon-grey");
                        $(div).children(".text-left").children(".circle-icon-wrapper").children("i").addClass("icon-fontello-ok-circled");
                        $(div).children(".text-left").children(".circle-icon-wrapper").children("i").addClass("icon-p2-green");
                    };
                    //Init events
                    $(".kid-menu").on('click', function(e) {
                        var id = $(this).attr("uid");
                        if (unselectedKidIdList.indexOf(id) == -1) {
                            unselectedKidIdList.push(id);
                            changeToUnselectedIcon(this);
                        } else {
                            unselectedKidIdList.splice(unselectedKidIdList.indexOf(id), 1);
                            changeToSelectedIcon(this);
                        }
                    });
                    $(".act-menu").on('click', function(e) {
                        var id = $(this).attr("uid");

                        if (unselectedActivityIdList.indexOf(id) == -1) {
                            unselectedActivityIdList.push(id);
                            changeToUnselectedIcon(this);
                        } else {
                            unselectedActivityIdList.splice(unselectedActivityIdList.indexOf(id), 1);
                            changeToSelectedIcon(this);
                        }
                    });
                }
                $(".filter-top, .filter-bottom").removeClass("hidden");
                spinner.stop();
            },
            error: function(error) {
                spinner.stop();
            }
        }); //eo query.find
    }; //eo loadInfo

    var addedToDOM = function() {
        initData(); //initialize
        initButtons(); //bind btn clicks
        loadFilterList(); //get the list data
    }; //eo addedToDOM
    var __id = 'filter-view';
    var View = View.extend({ //define the filter view and then load it into the DOM
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: __id,
        className: 'view-container',
        listen: {    addedToDOM: addedToDOM    },
        initialize: function(options) {
            _setCurrentView(_view.FILTER, __id);
            //Reset footer
            $("#footer-toolbar > li").removeClass("active");
            Chaplin.View.prototype.initialize.call(this, arguments);
        }
    }); //eo View.extend

    return View;
});
