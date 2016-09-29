define([
    'chaplin',
    'views/base/view',
    'text!templates/create/custom-list-groups-view.hbs',
    'jquery',
    'parse',
    'spinner'
], function(Chaplin, View, Template, $, Parse, midSpinner) {
    'use strict';

    var user;
    var spinner;
    var userOrgGroupRelations;
    var userOrgGroups;
    var userOrgGroupIdArray;
    var selectedGroupId;

    var initData = function() {
        user = JSON.parse(localStorage.getItem("user"));
        spinner = _createSpinner('spinner');
        userOrgGroupRelations = [];
        userOrgGroups = [];
        userOrgGroupIdArray = [];
        selectedGroupId = null;

        if (user.customList.selectedGroupType == "org") {
            $("#orgName").html(user.customList.selectedName);
        } else {
            $("#orgName").html("My Groups");
        }
    }; //eo initData

    var initButtonEvents = function() {
        $("#cancelBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'custom-list'
            });
        });
    }; //eo initButtonEvents

    var loadOrgGroupRelations = function() {
        var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation", {}, {
          query: function() {
            return new Parse.Query(this.className);
          }
        });
        var query = UserOrganizationGroupRelation.query();
        if (user.setting.permissonOfSelectedOrg == "teacher" || user.setting.permissonOfSelectedOrg == "class parent" || user.setting.permissonOfSelectedOrg == "admin") {
            query.equalTo("userId", user.id);
        }
        //query.equalTo("relationType", "staff");
        query.find({
            success: function(results) {
                userOrgGroupRelations = results;
                loadOrgGroups();
            }, //eo success
            error: function(error) {
                spinner.stop();
                console.log(error);
            }
        }); //eo query.find
    }

    var loadOrgGroups = function() {
        var orgGroupIdArray = [];
        for (var i = 0; i < userOrgGroupRelations.length; i++) {
            orgGroupIdArray.push(userOrgGroupRelations[i].get("organizationGroupId"));
        }
        //console.log(orgGroupIdArray)
        var OrganizationGroup = Parse.Object.extend("OrganizationGroup", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = OrganizationGroup.query();
        query.containedIn("objectId", orgGroupIdArray);
        query.ascending("name");
        query.find({
            success: function(results) {
                userOrgGroups = results;
                //Build id index for future use in createCustomListFromOrgGroup()
                var group;
                for (var i = 0; i < userOrgGroups.length; i++) {
                    group = userOrgGroups[i];
                    userOrgGroupIdArray.push(group.id);
                }
                displayOrgGroups();
            }, //eo success
            error: function(error) {
                spinner.stop();
                console.log(error);
            }
        }); //eo query.find
    }; //eo loadOrgGroups

    var displayOrgGroups = function() {
        $("#content").empty();
        var group;
        $.each(userOrgGroups, function(i, group) {
            $("#content").append(
                '<div class="item-list" id="' + group.id + '">' + '<div class="icon-wrapper" id="' + group.id + '" groupName="' + group.get("name") + '"><i class="icon-fontello-circle icon-grey"></i></div>' + '<div class="name-wrapper pointer" id="' + group.id + '" groupId="' + group.id + '" groupName="' + group.get("name") + '">' + group.get("name")
                //Do not DELETE this, we will need it in the next version
                /*+ '<div class="icon-right"><i class="icon-right-open"></i>'*/
                + '</div>' + '</div>' + '</div>'
            );
        });
        initItemEvents();
        initSearch();
        onDone();
        spinner.stop();
        $(".lower-area").removeClass("hidden");
        $(".upper-area").removeClass("hidden");
    }; //eo displayOrgGroups

    var initItemEvents = function() {
        $(".item-list").off('click');
        $(".item-list").on('click', function(e) {
            var div = $(this);
            //Reset selected-ok-icon
            if (selectedMyGroupId) {
                var currectSelectedItem = $("#" + selectedMyGroupId).children(".icon-wrapper").eq(0).children("i").eq(0);
                currectSelectedItem.removeClass("icon-fontello-ok-circled");
                currectSelectedItem.removeClass("icon-p2-green");
                currectSelectedItem.addClass("icon-fontello-circle");
                currectSelectedItem.addClass("icon-grey");
            }
            div.children(".icon-wrapper").eq(0).children("i").eq(0).removeClass("icon-p2-green");
            div.children(".icon-wrapper").eq(0).children("i").eq(0).removeClass("icon-fontello-circle");
            div.children(".icon-wrapper").eq(0).children("i").eq(0).addClass("icon-fontello-ok-circled");
            div.children(".icon-wrapper").eq(0).children("i").eq(0).addClass("icon-p2-green");
            selectedMyGroupId = div.attr("id");
            //console.log(selectedGroupId);
        });
    }; //eo initItemEvents

    var initSearch = function() {
        var doSearch = function() {
            var targetGroupArray = [];
            var str = $("#searchTxt").val().toLowerCase();
            //Find matches
            var group, name, index;
            $.each(userOrgGroups, function(i, group) {
                name = group.get("name");
                index = -1;
                index = name.toLowerCase().indexOf(str);
                if (index !== -1) {    targetGroupArray.push(userOrgGroups[i]);    }
            }); //eo each
            //Reset selected students for deletion
            //selectedStudentIdArray = [];
            //Display search results
            $("#content").empty();
            $.each(targetGroupArray, function(i, group) {
                if (selectedGroupId == group.id) {
                    $("#content").append(
                        '<div class="item-list" id="' + group.id + '">' + '<div class="icon-wrapper" id="' + group.id + '" groupName="' + group.get("name") + '"><i class="icon-fontello-ok-circled icon-p2-green"></i></div>' + '<div class="name-wrapper pointer" id="' + group.id + '" groupId="' + group.id + '" groupName="' + group.get("name") + '">' + group.get("name")
                        //Do not DELETE this, we will need it in the next version
                        /*+ '<div class="icon-right"><i class="icon-right-open"></i>'*/
                        + '</div>' + '</div>' + '</div>'
                    );
                } else {
                    $("#content").append(
                        '<div class="item-list" id="' + group.id + '">' + '<div class="icon-wrapper" id="' + group.id + '" groupName="' + group.get("name") + '"><i class="icon-fontello-circle icon-grey"></i></div>' + '<div class="name-wrapper pointer" id="' + group.id + '" groupId="' + group.id + '" groupName="' + group.get("name") + '">' + group.get("name")
                        //Do not DELETE this, we will need it in the next version
                        /*+ '<div class="icon-right"><i class="icon-right-open"></i>'*/
                        + '</div>' + '</div>' + '</div>'
                    );

                }
            }); //eo each
            initItemEvents();
        }; //eo doSearch

        $("#searchTxt").keyup(function(e) {
            switch (e.keyCode) {
                case 8: // Backspace
                    var str = $("#searchTxt").val().toLowerCase();
                    $("#searchTxt").val(str.substring(0, str.length));
                    doSearch();
                break;
                case 9:  doSearch();    break; // Tab
                case 13: doSearch();    break; // Enter
                case 37: doSearch();    break; // Left
                case 38: doSearch();    break; // Up
                case 39: doSearch();    break; // Right
                case 40: doSearch();    break; // Down
                default:
                    doSearch();
            } //eo switch
        }); //eo searchTxt keyup
        $("#searchBtn").on('click', function() {    doSearch();    }); //searchBtn click
    };

    var onDone = function() {
        $("#doneBtn").on('click', function(e) {
            if (selectedGroupId) {
                var name = prompt("Please enter custom list name", "");
                if (name != null && name != "" && name.replace(/ /g, "") != "") {
                    createRecipientList(name);
                } else {
                    alert("You enter an invalid name, please try again");
                }
            }
        });
    }; //eo onDone

    var createRecipientList = function(name) {
        midSpinner.show();
        var recipientList = [];
        var parentIndex = [];
        //Find all students of the selected group
        var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserOrganizationGroupRelation.query();
        query.equalTo("organizationGroupId", selectedGroupId);
        query.equalTo("relationType", "student");
        query.find({
            success: function(results) {
                //Collect user id of these students
                var studentUserIdArray = [];
                var studentRelation;
                for (var i = 0; i < results.length; i++) {
                    studentRelation = results[i];
                    studentUserIdArray.push(studentRelation.get("userId"));
                }
                //Find parents of these students
                var UserParentRelation = Parse.Object.extend("UserParentRelation", {}, {
                  query: function(){
                    return new Parse.Query(this.className);
                  }
                });
                var query = UserParentRelation.query();
                query.containedIn("childId", studentUserIdArray);
                query.find({
                    success: function(results) {

                        //Create json object that contains parent-children information
                        var relation;
                        $.each(results, function(i, relation) {
                            if (parentIndex.indexOf(relation.get("parentId")) === -1) {
                                parentIndex.push(relation.get("parentId"));
                                var json = {};
                                json.parent = relation.get("parentId");
                                json.children = [];
                                json.children.push(relation.get("childId"));
                                recipientList.push(json);
                            } else {
                                var index = parentIndex.indexOf(relation.get("parentId"));
                                var json = recipientList[index];
                                if (json.children.indexOf(relation.get("childId")) === -1) {
                                    json.children.push(relation.get("childId"));
                                }
                            }
                        }); //eo each

                        //Check results
                        //console.log(recipientList);
                        createUserContactEmailList(name, recipientList, parentIndex);
                        //createCustomListFromOrgGroup(name, recipientList);
                    }, //eo success
                    error: function(error) {
                        spinner.stop();
                        console.log(error);
                    }
                }); //eo query.find
            }, //eo success
            error: function(error) {
                spinner.stop();
                console.log(error);
            }
        }); //eo query.find
    }; //eo createRecipientList

    var createUserContactEmailList = function(name, recipientList, parentIndex) {
        var userContactEmail = [];
        var query = new Parse.Query(Parse.User);
        query.containedIn("objectId", parentIndex);
        query.find({
            success: function(results) {
                $.each(results, function(i, parent) {
                    var parentEmail = parent.get("email");
                    if (parent.get("isEmailDelivery") && userContactEmail.indexOf(parent.id) == -1) {
                        userContactEmail.push(parentEmail);
                    }
                });
                createCustomListFromOrgGroup(name, recipientList, userContactEmail);
            },
            error: function(error) {
                console.log('Error: '+JSON.stringify(error));
            }
        });
    }; //eo createUserContactEmailList

    var createCustomListFromOrgGroup = function(name, recipientList, userContactEmail) {
        var selectedOrgGroupData = userOrgGroups[userOrgGroupIdArray.indexOf(selectedGroupId)];
        var UserCustomList = Parse.Object.extend("UserCustomList");
        var group = new UserCustomList();
        group.set("type", "OrganizationGroup");
        group.set("organizationId", user.customList.selectedId);
        group.set("groupId", selectedOrgGroupData.id);
        group.set("groupType", selectedOrgGroupData.get("groupType"));
        group.set("name", name);
        group.set("ownerId", user.id);
        group.set("nonUserContactEmail", []); //Only use for custom list created from my groups
        group.set("userContactEmail", userContactEmail); //for users who want emails
        group.set("userContactId", []); //Only use for custom list created from my groups
        group.set("studentIdList", []);
        group.set("recipientList", recipientList);
        group.save(null, {
            success: function(group) {
                // Execute any logic that should take place after the object is saved.
                //alert('New object created with objectId: ' + relation.id);
                /*if (user.setting == null) {
                    user.setting = {};
                }
                user.setting.selectedMyGroupId = group.id;
                user.setting.selectedMyGroupData = group;
                localStorage.setItem("user", JSON.stringify(user));*/
                redirect();
            },
            error: function(group, error) {
                    // Execute any logic that should take place if the save fails.
                    // error is a Parse.Error with an error code and message.
                    //alert('Failed to add child to organization: ' + error.message);
                    alert("Error, could not create a new group!");
                    spinner.hide();
                } //eo error
        }); //eo group.save
    }; //eo createCustomListFromOrgGroup

    var redirect = function() {
        midSpinner.hide();
        Chaplin.utils.redirectTo({
            name: 'create-sendto'
        });
    }

    //when the DOM has been updated let gumby reinitialize UI modules
    var addedToDOM = function() {
        initData();
        initButtonEvents();
    };

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        className: 'view-container custom-list-org-view',
        id: 'custom-list-org-view',
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
