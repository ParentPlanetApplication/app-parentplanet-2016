define([
    'chaplin',
    'views/base/view',
    'text!templates/create/custom-list-org-view.hbs',
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

        $("#orgName").html(user.customList.selectedName);

        if (user.customList.isEdit) {
            $("#pageTitle").html("Edit List");
        }
    }

    var initButtonEvents = function() {
        $("#cancelBtn").on('click', function(e) {
            if (user.customList.isEdit) {
                /*
                Chaplin.utils.redirectTo({
                    name: 'create-sendto'
                });
                */
                Chaplin.utils.redirectTo({
                    name: user.view.beforeCustomListView
                });
            } else {
                Chaplin.utils.redirectTo({
                    name: 'custom-list'
                });
            }
        });
    }

    var loadOrgGroupRelations = function() {
        var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation", {}, {
          query: function(){
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
        query.equalTo("organizationId", user.customList.selectedId);
        if (!user.isAdmin) {
            query.equalTo("adminIdList", user.id);
        }
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

                isCustomListExist();
            }, //eo success
            error: function(error) {
                spinner.stop();
                console.log(error);
            }

        }); //eo query.find
    }

    var isCustomListExist = function() {
        var UserCustomList = Parse.Object.extend("UserCustomList", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserCustomList.query();
        query.containedIn("groupId", userOrgGroupIdArray);
        query.equalTo("ownerId", user.id);
        query.find({
            success: function(results) {
                var existingCustomListArray = [];
                for (var i = 0; i < results.length; i++) {
                    var custom = results[i];
                    existingCustomListArray.push(custom.get("groupId"));

                }
                displayOrgGroups(existingCustomListArray);
            },
            error: function(error) {
                spinner.stop();
            }
        })
    }; //eo isCustomListExist

    var displayOrgGroups = function(existingCustomListArray) {
        $("#content").empty();
        var userOrgGroupsShow = jQuery.grep(userOrgGroups, function(n){
            return existingCustomListArray.indexOf(n.id) == -1;
        });
        var group;
        for (var i = 0; i < userOrgGroupsShow.length; i++) {
            group = userOrgGroupsShow[i];
            $("#content").append(
                '<div class="item-list" id="' + group.id + '">' + '<div class="icon-wrapper" id="' + group.id + '" groupName="' + group.get("name") + '"><i class="icon-fontello-circle icon-grey"></i></div>' + '<div class="name-wrapper pointer" id="' + group.id + '" groupId="' + group.id + '" groupName="' + group.get("name") + '">' + group.get("name")
                //Do not DELETE this, we will need it in the next version
                /*+ '<div class="icon-right"><i class="icon-right-open"></i>'*/
                + '</div>' + '</div>' + '</div>'
            );
        }
        if (user.customList.isEdit) {
            $("#pageTitle").html("Edit List");
        }

        initItemEvents();
        initSearch();
        onDone();
        spinner.stop();
        $(".lower-area").removeClass("hidden");
        $(".upper-area").removeClass("hidden");

        //Highlight current selected group if in Edit mode
        if (user.customList.isEdit) {
            addDeleteButtonInEditMode();

            selectedGroupId = user.customList.selectedCustomListData.groupId;
            var div = $("#" + selectedGroupId);

            //Add green circled icon
            div.children(".icon-wrapper").eq(0).children("i").eq(0).removeClass("icon-p2-green");
            div.children(".icon-wrapper").eq(0).children("i").eq(0).removeClass("icon-fontello-circle");
            div.children(".icon-wrapper").eq(0).children("i").eq(0).addClass("icon-fontello-ok-circled");
            div.children(".icon-wrapper").eq(0).children("i").eq(0).addClass("icon-p2-green");
        }
    }

    var initItemEvents = function() {
        $(".item-list").off('click');
        $(".item-list").on('click', function(e) {
            var div = $(this);

            //Reset selected-ok-icon
            if (selectedGroupId) {
                var currectSelectedItem = $("#" + selectedGroupId).children(".icon-wrapper").eq(0).children("i").eq(0);
                currectSelectedItem.removeClass("icon-fontello-ok-circled");
                currectSelectedItem.removeClass("icon-p2-green");
                currectSelectedItem.addClass("icon-fontello-circle");
                currectSelectedItem.addClass("icon-grey");
            }
            div.children(".icon-wrapper").eq(0).children("i").eq(0).removeClass("icon-p2-green");
            div.children(".icon-wrapper").eq(0).children("i").eq(0).removeClass("icon-fontello-circle");
            div.children(".icon-wrapper").eq(0).children("i").eq(0).addClass("icon-fontello-ok-circled");
            div.children(".icon-wrapper").eq(0).children("i").eq(0).addClass("icon-p2-green");

            selectedGroupId = div.attr("id");
            //console.log(selectedGroupId);
        });
    }

    var initSearch = function() {
        var doSearch = function() {
            var targetGroupArray = [];
            var str = $("#searchTxt").val().toLowerCase();
            //Find matches
            var group, name, index;
            for (var i = 0; i < userOrgGroups.length; i++) {
                group = userOrgGroups[i];
                name = group.get("name");

                index = -1;
                index = name.toLowerCase().indexOf(str);
                if (index != -1) {
                    targetGroupArray.push(userOrgGroups[i]);
                }
            } //eo for

            //Reset selected students for deletion
            //selectedStudentIdArray = [];
            //Display search results
            $("#content").empty();

            for (var i = 0; i < targetGroupArray.length; i++) {
                group = targetGroupArray[i];

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

            } //eo for

            initItemEvents();
        }; //eo doSearch

        $("#searchTxt").keyup(function(e) {
            switch (e.keyCode) {
                case 8: // Backspace
                    var str = $("#searchTxt").val().toLowerCase();
                    $("#searchTxt").val(str.substring(0, str.length));
                    doSearch();
                    break;
                case 9: // Tab
                    doSearch();
                    break;
                case 13: // Enter
                    doSearch();
                    break;
                case 37: // Left
                    doSearch();
                    break;
                case 38: // Up
                    doSearch();
                    break;
                case 39: // Right
                    doSearch();
                    break;
                case 40: // Down
                    doSearch();
                    break;
                default:
                    doSearch();
            } //eo switch
        }); //eo searchTxt keyup

        $("#searchBtn").on('click', function() {
            doSearch();
        }); //searchBtn click
    }

    var onDone = function() {

        $("#doneBtn").on('click', function(e) {
            if (selectedGroupId) {
                createRecipientList();
            } else {
                redirect();
            }
        });
    };

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
                        for (var i = 0; i < results.length; i++) {
                            relation = results[i];

                            if (parentIndex.indexOf(relation.get("parentId")) == -1) {
                                parentIndex.push(relation.get("parentId"));
                                var json = {};
                                json.parent = relation.get("parentId");
                                json.children = [];
                                json.children.push(relation.get("childId"));
                                recipientList.push(json);
                            } else {
                                var index = parentIndex.indexOf(relation.get("parentId"));
                                var json = recipientList[index];
                                if (json.children.indexOf(relation.get("childId")) == -1) {
                                    json.children.push(relation.get("childId"));
                                }
                            }
                        }

                        //Check results
                        //console.log(recipientList);
                        //createCustomListFromOrgGroup(recipientList);
                        createUserContactEmailList(recipientList, parentIndex);
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

    var createUserContactEmailList = function(recipientList, parentIndex) {
        var userContactEmail = [];
        var query = new Parse.Query(Parse.User);
        query.containedIn("objectId", parentIndex);
        query.find({
            success: function(results) {
                for (var i = 0; i < results.length; i++) {
                    var parent = results[i];
                    var parentEmail = parent.get("email");
                    if (parent.get("isEmailDelivery") && userContactEmail.indexOf(parent.id) == -1) {
                        userContactEmail.push(parentEmail);
                    }
                }
                createCustomListFromOrgGroup(recipientList, userContactEmail);
            },
            error: function(error) {
                console.log('Error: '+JSON.stringify(error));
            }
        });
    };

    var createCustomListFromOrgGroup = function(recipientList, userContactEmail) {
        var selectedOrgGroupData = userOrgGroups[userOrgGroupIdArray.indexOf(selectedGroupId)];

        var UserCustomList = Parse.Object.extend("UserCustomList");
        var customList = new UserCustomList();
        customList.set("type", "OrganizationGroup");
        customList.set("organizationId", user.customList.selectedId);
        customList.set("groupId", selectedOrgGroupData.id);
        customList.set("groupType", selectedOrgGroupData.get("groupType"));
        customList.set("name", selectedOrgGroupData.get("name"));
        customList.set("ownerId", user.id);
        customList.set("nonUserContactEmail", []); //Only use for custom list created from my groups
        customList.set("userContactEmail", userContactEmail);
        customList.set("userContactId", []); //Only use for custom list created from my groups
        customList.set("recipientList", recipientList);
        customList.save(null, {
            success: function(customList) {
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
            error: function(customList, error) {
                    // Execute any logic that should take place if the save fails.
                    // error is a Parse.Error with an error code and message.
                    //alert('Failed to add child to organization: ' + error.message);
                    _confirm("Error, could not create a new custom list!");
                    spinner.hide();
                } //eo error
        }); //eo customList.save
    }; //eo createCustomListFromOrgGroup

    var updateCusomList = function(name) {
        /*if (selectedGroupId == user.customList.selectedCustomListData.groupId) {
            //We do nothing since it is the same group
            redirect();
        } else {*/
        //If not, we have to update the data and then reset the user.customList.selectedCustomListData because the data on the server and the data on the local will be different
        midSpinner.show();
        var UserCustomList = Parse.Object.extend("UserCustomList", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserCustomList.query();
        query.get(user.customList.selectedCustomListData.objectId, {
            success: function(customList) {
                // The object was retrieved successfully.

                //Update data on this object
                var selectedOrgGroupData = userOrgGroups[userOrgGroupIdArray.indexOf(selectedGroupId)];
                customList.set("type", "OrganizationGroup");
                customList.set("organizationId", user.customList.selectedId);
                customList.set("groupId", selectedOrgGroupData.id);
                customList.set("groupType", selectedOrgGroupData.get("groupType"));
                customList.set("name", name); //Name could still be different even though the group is the same as previous
                customList.set("ownerId", user.id);
                customList.set("nonUserContactEmail", []); //Only use for custom list created from my groups
                customList.set("userContactId", []); //Only use for custom list created from my groups
                //customList.set("recipientList", recipientList);
                customList.save(null, {
                    success: function(customList) {
                        //Update custom list data locally
                        user.customList.selectedCustomListData = customList;
                        localStorage.setItem("user", JSON.stringify(user));

                        redirect();
                    },
                    error: function(customList, error) {
                        redirect();
                    }
                });
            },
            error: function(customList, error) {
                // The object was not retrieved successfully.
                // error is a Parse.Error with an error code and message.
                redirect();
            }
        });
        //}
    }

    var addDeleteButtonInEditMode = function() {
        $("#content").append(
            '<div id="delBtn" class="delete">Delete</div>'
        );

        var deleteCustomList = function() {
            midSpinner.show();

            var UserCustomList = Parse.Object.extend("UserCustomList", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var query = UserCustomList.query();
            query.get(user.customList.selectedCustomListData.objectId, {
                success: function(customList) {
                    // The object was retrieved successfully.
                    //Delete this object
                    customList.destroy({
                        success: function(myObject) {
                            // The object was deleted from the Parse Cloud.

                            //Update custom list data locally
                            user.customList.selectedCustomListData = null;
                            localStorage.setItem("user", JSON.stringify(user));

                            redirect();
                        },
                        error: function(myObject, error) {
                            // The delete failed.
                            // error is a Parse.Error with an error code and message.
                            redirect();
                        }
                    });

                },
                error: function(object, error) {
                    // The object was not retrieved successfully.
                    // error is a Parse.Error with an error code and message.
                    redirect();
                }
            });

        }

        $("#delBtn").on("click", function(e) {
            var defer = _confirm("Are you sure you want to delete this Custom List?");
            defer.then(function() {
                deleteCustomList();
            }, function() {
                console.log('delBtn rejected');
            });
        });
    }

    var redirect = function() {
        midSpinner.hide();
        /*
        Chaplin.utils.redirectTo({
            name: 'create-sendto'
        });
        */
        Chaplin.utils.redirectTo({
            name: user.view.beforeCustomListView
        });
    }

    //when the DOM has been updated let gumby reinitialize UI modules
    var addedToDOM = function() {

        initData();
        initButtonEvents();
        loadOrgGroupRelations();
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
