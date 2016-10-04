define([
    'chaplin',
    'views/base/view',
    'text!templates/create/custom-list-mygroups-view.hbs',
    'jquery',
    'parse',
    'spinner'
], function(Chaplin, View, Template, $, Parse, midSpinner) {
    'use strict';

    var user;
    var spinner;

    var selectedMyGroupId;
    var userCustomGroupData;
    var userCustomGroupIdIndex;
    var selectedCustomGroupId;

    var initData = function() {
        user = JSON.parse(localStorage.getItem("user"));
        spinner = _createSpinner('spinner');

        selectedMyGroupId = null;
        userCustomGroupData = [];
        userCustomGroupIdIndex = [];
        selectedCustomGroupId = null;

        //$("#orgName").html(user.customList.selectedName);
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

    var loadUserCustomGroups = function() {
        var UserCustomGroup = Parse.Object.extend("UserCustomGroup", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserCustomGroup.query();
        query.equalTo("userId", user.id);
        query.ascending("name");
        query.find({
            success: function(results) {
                userCustomGroupData = results;
                var userCustomGroupIdArray = [];
                for (var i = 0; i < userCustomGroupData.length; i++) {
                    userCustomGroupIdArray.push(userCustomGroupData[i].id);
                }
                isCustomListExist(userCustomGroupIdArray);
            }, //eo success
            error: function(error) {
                spinner.stop();
                console.log(error);
            }
        }); //eo query.find
    }; //eo loadUserCustomGroups

    var isCustomListExist = function(userCustomGroupIdArray) {
        var UserCustomList = Parse.Object.extend("UserCustomList", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserCustomList.query();
        query.containedIn("groupId", userCustomGroupIdArray);
        query.equalTo("ownerId", user.id);
        query.find({
            success: function(results) {
                var existingCustomListArray = [];
                for (var i = 0; i < results.length; i++) {
                    var custom = results[i];
                    existingCustomListArray.push(custom.get("groupId"));

                }
                displayCustomGroup(existingCustomListArray);
            },
            error: function(error) {
                spinner.stop();
            }
        })
    }; //eo isCustomListExist

    var displayCustomGroup = function(existingCustomListArray) {
        $("#content").empty();
        var userCustomGroupsShow = jQuery.grep(userCustomGroupData, function(n){
            return existingCustomListArray.indexOf(n.id) == -1;
        });
        var group;
        for (var i = 0; i < userCustomGroupsShow.length; i++) {
            group = userCustomGroupsShow[i];
            $("#content").append(
                '<div class="item-list" id="' + group.id + '">' + '<div class="icon-wrapper" id="' + group.id + '" groupName="' + group.get("name") + '"><i class="icon-fontello-circle icon-grey"></i></div>' + '<div class="name-wrapper pointer" id="' + group.id + '" groupId="' + group.id + '" groupName="' + group.get("name") + '">' + group.get("name")
                //Do not DELETE this, we will need it in the next version
                /*+ '<div class="icon-right"><i class="icon-right-open"></i>'*/
                + '</div>' + '</div>' + '</div>'
            );

            userCustomGroupIdIndex.push(group.id);
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

            selectedMyGroupId = user.customList.selectedCustomListData.groupId;
            var div = $("#" + selectedMyGroupId);

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
    }

    var initSearch = function() {
        var doSearch = function() {
            var targetGroupArray = [];
            var str = $("#searchTxt").val().toLowerCase();
            //Find matches
            var group, name, index;
            for (var i = 0; i < userCustomGroupData.length; i++) {
                group = userCustomGroupData[i];
                name = group.get("name");

                index = -1;
                index = name.toLowerCase().indexOf(str);
                if (index != -1) {
                    targetGroupArray.push(userCustomGroupData[i]);
                }
            } //eo for

            //Reset selected students for deletion
            //selectedStudentIdArray = [];
            //Display search results
            $("#content").empty();

            for (var i = 0; i < targetGroupArray.length; i++) {
                group = targetGroupArray[i];

                if (selectedMyGroupId == group.id) {
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
            if (selectedMyGroupId) {
                // if (user.customList.isEdit) {
                //     //If in edit mode, we update the current custom list
                //     //If not in edit mode, we create a new custom list
                //     var name = prompt("You may edit the name of this custom list", user.customList.selectedCustomListData.name);
                //     if (name != null && name != "" && name.replace(/ /g, "") != "") {
                //         updateCusomList(name);
                //     } else {
                //         _confirm("You enter an invalid name, please try again");
                //     }
                // } else {
                //     //If not in edit mode, we create a new custom list
                //     var name = prompt("Please enter custom list name", "");
                //     if (name != null && name != "" && name.replace(/ /g, "") != "") {

                //     } else {
                //         _confirm("You enter an invalid name, please try again");
                //     }
                // }
                //createCustomListFromMyGroup();
                createRecipientList();
            }
        }); //eo on click
    }; //eo onDone

    var createRecipientList = function() {
        midSpinner.show();

        var recipientList = [];
        var parentIndex = [];
        var contactIdArray = userCustomGroupData[0].attributes.userContactId;

        //Find all students of the selected group
        // var UserCustomGroup = Parse.Object.extend("UserCustomGroup");
        // var query = new Parse.Query(UserCustomGroup);
        // query.equalTo("objectId", selectedMyGroupId);
        // //query.equalTo("relationType", "student");
        // query.find({
        //     success: function(results) {

                //Collect user id of these students
                //var contactIdArray = results[0].get("userContactId");
                // var studentRelation;
                // for (var i = 0; i < results.length; i++) {
                //     studentRelation = results[i];
                //     studentUserIdArray.push(studentRelation.get("userId"));
                // }


                //Find parents of these students
                var UserParentRelation = Parse.Object.extend("UserParentRelation", {}, {
                  query: function(){
                    return new Parse.Query(this.className);
                  }
                });
                var query = UserParentRelation.query();
                query.containedIn("childId", contactIdArray);
                query.find({
                    success: function(results) {

                        //Create json object that contains parent-children information
                        var studentUserIdArray = [];
                        var relation;
                        for (var i = 0; i < results.length; i++) {
                            relation = results[i];
                            studentUserIdArray.push(relation.get("childId"));

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
                        for (var i = 0; i < contactIdArray.length; i++) {
                            if (studentUserIdArray.indexOf(contactIdArray[i]) == -1) {
                                var json = {};
                                json.parent = contactIdArray[i];
                                json.children = [];
                                recipientList.push(json);
                            }
                        }
                        //Check results
                        //console.log(recipientList);
                        //createCustomListFromOrgGroup(recipientList);
                        createCustomListFromMyGroup(recipientList, parentIndex);
                    }, //eo success
                    error: function(error) {
                        spinner.stop();
                        console.log(error);
                    }

                }); //eo query.find

        //     }, //eo success
        //     error: function(error) {
        //         spinner.stop();
        //         console.log(error);
        //     }

        // }); //eo query.find
    }; //eo createRecipientList

    var createCustomListFromMyGroup = function(recipientList) {
        midSpinner.show();

        var selectedCustomGroupData = userCustomGroupData[userCustomGroupIdIndex.indexOf(selectedMyGroupId)];

        var UserCustomList = Parse.Object.extend("UserCustomList");
        var customList = new UserCustomList();
        customList.set("type", "MyGroup");
        customList.set("organizationId", "jXkZjUzi9T");
        customList.set("groupId", selectedCustomGroupData.id);
        customList.set("groupType", selectedCustomGroupData.get("type").toLowerCase());
        customList.set("name", selectedCustomGroupData.get("name"));
        customList.set("ownerId", user.id);
        customList.set("nonUserContactEmail", selectedCustomGroupData.get("nonUserContactEmail"));
        customList.set("userContactEmail", selectedCustomGroupData.get("userContactEmail"));
        // customList.set("userContactId", selectedCustomGroupData.get("userContactId"));
        customList.set("userContactId", []); //using recipientList, so leave empty for now
        customList.set("recipientList", recipientList); //Only use for custom list created from org groups
        customList.save(null, {
            success: function(customList) {
                // Execute any logic that should take place after the object is saved.
                //_confirm('New object created with objectId: ' + relation.id);
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
                    //_confirm('Failed to add child to organization: ' + error.message);
                    _confirm("Error, could not create a new custom list!");
                    spinner.hide();
                } //eo error
        }); //eo customList.save
    }

    var updateCusomList = function(name) {
        /*if (selectedMyGroupId == user.customList.selectedCustomListData.groupId) {
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
                var selectedCustomGroupData = userCustomGroupData[userCustomGroupIdIndex.indexOf(selectedMyGroupId)];
                customList.set("type", "MyGroup");
                customList.set("organizationId", "jXkZjUzi9T");
                customList.set("groupId", selectedCustomGroupData.id);
                customList.set("groupType", selectedCustomGroupData.get("type").toLowerCase());
                customList.set("name", name); //Name could still be different even though the group is the same as previous
                customList.set("ownerId", user.id);
                customList.set("nonUserContactEmail", selectedCustomGroupData.get("nonUserContactEmail"));
                customList.set("userContactEmail", selectedCustomGroupData.get("userContactEmail"));
                customList.set("userContactId", selectedCustomGroupData.get("userContactId"));
                customList.set("recipientList", []); //Only use for custom list created from org groups
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
        loadUserCustomGroups();

    };

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        className: 'view-container custom-list-mygroups-view',
        id: 'custom-list-mygroups-view',
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
