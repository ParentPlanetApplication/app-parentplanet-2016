define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-organizations-groups-detail-groupclassparent-add-fromorg-view.hbs',
    'jquery',
    'spinner',
    'parse'
], function(Chaplin, View, Template, $, mindSpinner, Parse) {
    'use strict';

    var user;
    var selectedOrgId;
    var selectedGroupId;
    var selectedGroupData;
    var relationDataArray;

    var currentStaffRelationDataArray;
    var staffIdArray;
    var staffNameArray;
    var selectedStaffIdArray;

    var initData = function() {
        user = JSON.parse(localStorage.getItem("user"));
        selectedOrgId = user.setting.selectedOrgId;
        selectedGroupId = user.setting.selectedOrgGroupId;
        selectedGroupData = user.setting.selectedOrgGroupData;
        relationDataArray = user.setting.addStaff.relationDataArray;
        staffIdArray = [];
        staffNameArray = [];
        selectedStaffIdArray = [];
    }; 

    var initButtons = function() {
        $("#cancelBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-organizations-groups-detail-groupclassparent'
            });
        });
    }; 

    var loadStaffs = function() {
        var existingStaffsIdArray = [];
        for (var i = 0; i < relationDataArray.length; i++) {
            existingStaffsIdArray.push(relationDataArray[i].userId);
        }

        var spinner = _createSpinner('spinner');
        var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation", {}, {
            query: function () {
                return new Parse.Query(this.className);
            }
        });
        var query = UserOrganizationGroupRelation.query();
        query.equalTo("organizationGroupId", selectedGroupId);
        query.equalTo("relationType", "student");
        query.find({
            success: function(results) {
                if (results.length > 0) {
                    var childIds = [];
                    for (var i = 0; i < results.length; i++) {
                        childIds.push(results[i].get("userId"));
                    };

                    var UserParentRelation = Parse.Object.extend("UserParentRelation", {}, {
                        query: function () {
                            return new Parse.Query(this.className);
                        }
                    });
                    var query2 = UserParentRelation.query();
                    query2.containedIn("childId", childIds);
                    query2.find({
                        success: function (results2) {
                            if (results2.length > 0) {
                                var parentIds = [];
                                for (var i = 0; i < results2.length; i++) {
                                    var parentId = results2[i].get("parentId");
                                    if (parentIds.indexOf(parentId) < 0 && existingStaffsIdArray.indexOf(parentId) < 0) {
                                        parentIds.push(results2[i].get("parentId"));
                                    }
                                };

                                var Users = Parse.Object.extend("User", {}, {
                                    query: function () {
                                        return new Parse.Query(this.className);
                                    }
                                });
                                var query3 = Users.query();
                                query3.containedIn("objectId", parentIds);
                                query3.ascending("firstName");
                                query3.find({
                                    success: function (results3) {
                                        currentStaffRelationDataArray = results3;
                                        if (results3.length > 0) {
                                            for (var i = 0; i < results3.length; i++) {
                                                var firstName = results3[i].get("firstName");
                                                var lastName = results3[i].get("lastName");
                                                if (!firstName && !lastName) {
                                                    firstName = results3[i].get("email");
                                                    lastName = "";
                                                }

                                                var name = firstName + " " + lastName;
                                                $("#content").append('<div id="' + results3[i].id + '" class="menu-item">  \
<div class="text-left"><div class="circle-icon-wrapper"><i class="icon-fontello-circle icon-grey"></i></div> <span>' + name + '</span></div>   \
</div>');
                                                staffIdArray.push(results3[i].id);
                                                staffNameArray.push(name);
                                            };

                                            initEvents();
                                            initSearch();
                                            initDoneBtn();
                                        } else {
                                            $("#content").append('<div style="text-align:center;padding: 5px 10px 0 10px;">No parent found</div>');
                                        }
                                    },
                                    error: function (error) {
                                        $(".lower-area").removeClass("hidden");
                                        $(".upper-area").removeClass("hidden");
                                        spinner.stop();
                                    }
                                });
                            }
                        },
                        error: function (error) {
                            $(".lower-area").removeClass("hidden");
                            $(".upper-area").removeClass("hidden");
                            spinner.stop();
                        }
                    });
                }
                $(".lower-area").removeClass("hidden");
                $(".upper-area").removeClass("hidden");
                $("#doneBtn").removeClass("hidden");
                spinner.stop();
            },
            error: function(error) {
                $(".lower-area").removeClass("hidden");
                $(".upper-area").removeClass("hidden");
                spinner.stop();
            }
        });
    }; 

    var initEvents = function() {
        $(".menu-item").off("click");
        $(".menu-item").on("click", function(e) {
            var staffId = $(this).attr("id"); //student's id = Kid's id
            var index = selectedStaffIdArray.indexOf(staffId);
            var div = $(this).find("i");
            if (index == -1) {
                selectedStaffIdArray.push(staffId);
                div.removeClass("icon-fontello-circle");
                div.removeClass("icon-grey");
                div.addClass("icon-fontello-ok-circled");
                div.addClass("icon-p2-green");
            } else {
                selectedStaffIdArray.splice(index, 1);
                div.addClass("icon-fontello-circle");
                div.addClass("icon-grey");
                div.removeClass("icon-fontello-ok-circled");
                div.removeClass("icon-p2-green");
            }
        }); //eo menu-item click
    }; 

    var initDoneBtn = function() {
        $("#doneBtn").off("click");
        $("#doneBtn").on("click", function(e) {
            mindSpinner.show();

            var totalResponse = 0;
            //Add staff to the selected group
            for (var i = 0; i < selectedStaffIdArray.length; i++) {
                var staffId = selectedStaffIdArray[i];
                var index = staffIdArray.indexOf(staffId);
                var staffRelationData = currentStaffRelationDataArray[index];
                var selectedOrgId = user.setting.selectedOrgId;

                //var UserOrganizationRelation = Parse.Object.extend("UserOrganizationRelation", {}, {
                //    query: function () {
                //        return new Parse.Query(this.className);
                //    }
                //});
                //var query = UserOrganizationRelation.query();
                //query.equalTo("organizationId", selectedOrgId);
                //query.equalTo("userId", staffId);
                //query.equalTo("relation", "class parent");
                //query.find({
                //    success: function (results) {
                //        if (results.length == 0) {
                //            var UserOrganizationRelation = Parse.Object.extend("UserOrganizationRelation");
                //            var relation = new UserOrganizationRelation();
                //            relation.set("userId", staffId);
                //            relation.set("organizationId", selectedOrgId);
                //            relation.set("relation", "class parent");
                //            relation.set("permission", "class parent");
                //            relation.save();
                //        }
                //    },
                //    error: function (error) {
                //    }
                //});

                var createRecipientList = function (staffId) {
                    var recipientList = [];
                    var parentIndex = [];

                    //Find all students of the selected group
                    var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation", {}, {
                        query: function () {
                            return new Parse.Query(this.className);
                        }
                    });
                    var query = UserOrganizationGroupRelation.query();
                    query.equalTo("organizationGroupId", selectedGroupId);
                    query.equalTo("relationType", "student");
                    query.find({
                        success: function (results) {
                            //Collect user id of these students
                            var studentUserIdArray = [];
                            var studentRelation;
                            for (var i = 0; i < results.length; i++) {
                                studentRelation = results[i];
                                studentUserIdArray.push(studentRelation.get("userId"));
                            }

                            //Find parents of these students
                            var UserParentRelation = Parse.Object.extend("UserParentRelation", {}, {
                                query: function () {
                                    return new Parse.Query(this.className);
                                }
                            });
                            var query = UserParentRelation.query();
                            query.containedIn("childId", studentUserIdArray);
                            query.find({
                                success: function (results) {
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

                                    createUserContactEmailList(staffId, recipientList, parentIndex);
                                }, //eo success
                                error: function (error) {
                                    spinner.stop();
                                    console.log(error);
                                }
                            }); 

                        }, //eo success
                        error: function (error) {
                            spinner.stop();
                            console.log(error);
                        }

                    }); //eo query.find
                }; 
                var createUserContactEmailList = function (staffId, recipientList, parentIndex) {
                    var userContactEmail = [];
                    var query = new Parse.Query(Parse.User);
                    query.containedIn("objectId", parentIndex);
                    query.find({
                        success: function (results) {
                            for (var i = 0; i < results.length; i++) {
                                var parent = results[i];
                                var parentEmail = parent.get("email");
                                if (parent.get("isEmailDelivery") && userContactEmail.indexOf(parent.id) == -1) {
                                    userContactEmail.push(parentEmail);
                                }
                            }
                            createCustomList(staffId, recipientList, userContactEmail);
                        },
                        error: function (error) {
                            console.log('Error: ' + JSON.stringify(error));
                        }
                    });
                };
                var createCustomList = function (staffId, recipientList, userContactEmail) {
                    var UserCustomList = Parse.Object.extend("UserCustomList", {}, {
                        query: function () {
                            return new Parse.Query(this.className);
                        }
                    });
                    var query = UserCustomList.query();
                    query.equalTo("groupId", selectedGroupId);
                    query.equalTo("ownerId", staffId);
                    query.find({
                        success: function (results) {
                            if (results.length == 0) { //if UserCustomList doesn't already exist
                                var customList = new UserCustomList();
                                customList.set("type", "OrganizationGroup");
                                customList.set("organizationId", selectedOrgId);
                                customList.set("groupId", selectedGroupId);
                                customList.set("groupType", selectedGroupData.groupType);
                                customList.set("name", selectedGroupData.name);
                                customList.set("ownerId", staffId);
                                customList.set("nonUserContactEmail", []); //Only use for custom list created from my groups
                                customList.set("userContactId", []); //Only use for custom list created from my groups
                                customList.set("userContactEmail", userContactEmail);
                                customList.set("recipientList", recipientList);
                                customList.save(null, {
                                    success: function (customList) {
                                        // Execute any logic that should take place after the object is saved.
                                        //alert('New object created with objectId: ' + relation.id);
                                        /*if (user.setting == null) {
                                            user.setting = {};
                                        }
                                        user.setting.selectedMyGroupId = group.id;
                                        user.setting.selectedMyGroupData = group;
                                        localStorage.setItem("user", JSON.stringify(user));*/
                                    },
                                    error: function (customList, error) {
                                        // Execute any logic that should take place if the save fails.
                                        // error is a Parse.Error with an error code and message.
                                        //alert('Failed to add child to organization: ' + error.message);
                                        _confirm("Error, could not create a new custom list!");
                                        spinner.hide();
                                    } //eo error
                                }); //eo customList.save
                            } //eo if results.length == 0
                        },
                        error: function (error) {
                            console.log('Error: ' + error);
                        }
                    });

                };

                var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation");
                var relation = new UserOrganizationGroupRelation();
                var position = relation.get("position") ? relation.get("position") : "";
                relation.set("organizationGroupId", selectedGroupId);
                relation.set("userId", staffId);
                relation.set("relationType", "class parent");
                relation.set("position", position);
                relation.set("groupName", selectedGroupData.name);
                relation.set("calendarAutoSync", false);
                relation.set("alert", true);
                relation.set("showParentFirstName", true);
                relation.set("showParentLastName", true);
                relation.set("showChildFirstName", true);
                relation.set("showChildLastName", true);
                relation.set("showEmail", true);
                relation.set("showHomePhone", true);
                relation.set("showMobilePhone", true);
                relation.set("showWorkPhone", true);
                relation.set("showAddress", true);
                relation.set("firstName", staffRelationData.get("firstName"));
                relation.set("lastName", staffRelationData.get("lastName"));
                var spinner = _createSpinner('spinner');
                relation.save(null, {
                    success: function(relation) {
                        createRecipientList(staffId);
                        totalResponse++;
                        redirect();
                    },
                    error: function(relation, error) {
                        totalResponse++;
                        mindSpinner.hide();
                        _alert('Error: '+error);
                    }
                });
            } // eo for loop
            var redirect = function() {
                mindSpinner.hide();
                if (totalResponse == selectedStaffIdArray.length) {
                    Chaplin.utils.redirectTo({
                        name: 'setting-organizations-groups-detail-groupclassparent'
                    });
                }
            }; //eo redirect
        }); //eo doneBtn click
    }; 

    var initSearch = function() {
        var doSearch = function() {
            var targetStaffRelationDataArray = [];
            var str = $("#searchTxt").val().toLowerCase();
            //Find matches
            for (var i = 0; i < staffNameArray.length; i++) {
                var name = staffNameArray[i];
                var index = name.toLowerCase().indexOf(str);
                //console.log(name.toLowerCase() + "   " + str)
                if (index != -1) {
                    targetStaffRelationDataArray.push(currentStaffRelationDataArray[i]);
                }
            }
            //Display search results
            $("#content").empty();
            for (var i = 0; i < targetStaffRelationDataArray.length; i++) {
                var relation = targetStaffRelationDataArray[i];
                var name = relation.get("firstName") + " " + relation.get("lastName");
                var id = relation.get("userId");

                if (selectedStaffIdArray.indexOf(id) != -1) {
                    $("#content").append('<div id="' + relation.get("userId") + '" class="menu-item">  \
                        <div class="text-left"><div class="circle-icon-wrapper"><i class="icon-fontello-ok-circled icon-p2-green"></i></div> <span>' + name + '</span></div>   \
                    </div>');
                } else {
                    $("#content").append('<div id="' + relation.get("userId") + '" class="menu-item">  \
                        <div class="text-left"><div class="circle-icon-wrapper"><i class="icon-fontello-circle icon-grey"></i></div> <span>' + name + '</span></div>   \
                    </div>');
                }
            }
            //ToDo init events
            initEvents();
        }; //eo initSearch

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
            }
        }); //eo keyup

        $("#searchBtn").on('click', function() {
            doSearch();
        });
    }
    var spinner = null;
    var addedToDOM = function() {
        initData();
        initButtons();
        loadStaffs();
    };

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: 'setting-organizations-groups-detail-groupadmin-add-fromorg-view',
        className: 'view-container',
        listen: {
            addedToDOM: addedToDOM
        },
        initialize: function(options) {
            $("#footer-toolbar > li").removeClass("active");
            Chaplin.View.prototype.initialize.call(this, arguments);
        },
    });

    return View;
});
