define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-organizations-groups-detail-students-add-organization-view.hbs',
    'jquery',
    'spinner',
    'parse'
], function(Chaplin, View, Template, $, spinner, Parse) {
    'use strict';

    /*
        Umm...I just realized after this is done, using json is propably easier. This module should be re-written. .... Chanat
    */

    var user;
    var selectedGroupIdArray; //List of selected group id from M8 and M9
    var wholeGroupSelectedFlagArray; //Contain flags that determines whether or not we should add the whole group to selected group
    var customSelectedStudentIdArray; //Contain selected student id when selects from M9
    var groupIdArray;
    var orgGroupNameArray;
    var orgGroupDataArray;
    var parentId;
    var selectedOrgId;
    var selectedOrgGroupId;
    var hashEmails = {};
    var dataObj = undefined;

    var buildEmails = function() {
        console.log('Start build email at: ' + new Date());
        console.log(hashEmails);

        var getContent = function(data, type) {
            if (type === 'event') {
                return {
                    "allDay": data.get("isAllDay"),
                    "end": data.get("endDateTime"),
                    "location": data.get("location"),
                    "note": data.get("note"),
                    "repeat": data.get("repeat"),
                    "start": data.get("startDateTime"),
                    "title": data.get("title"),
                    "until": data.get("repeat") == "Never" ? undefined : data.get("untilDate")
                };
            }
            return {
                "due": data.get("dueDate"),
                "note": data.get("note"),
                "repeat": data.get("repeat"),
                "assigned": data.get("assignedDate"),
                "title": data.get("title")
            };
        }

        var createEmails = function(type, selectedOrgId, groupId, datas, customListId, customListName, recipients) {
            console.log('Start createEmails for <' + type + '> at: ' + new Date());
            var content;

            var emails = [];
            $.each(Object.keys(datas), function(i, item) {
                var Email = Parse.Object.extend('Email');
                var email = new Email();
                email.set("data", getContent(datas[item], type));
                email.set("organizationId", selectedOrgId);
                email.set("groupId", groupId);
                email.set("recipientAddress", recipients);
                email.set("type", type);
                email.set("customListId", customListId);
                email.set("customListName", customListName);
                emails.push(email);
            });


            Parse.Object.saveAll(emails, {
                success: function(d) {
                    console.log('End createEmails for <' + type + '> at: ' + new Date());
                },
                error: function(err) {
                    _alert('Internal Error: Error while saving emails:' + err);
                }
            });
        }

        var processingHashEmails = hashEmails;
        hashEmails = {}; // Reset this global variable to be ready for next use;

        var keys = Object.keys(processingHashEmails);
        var emailList = [];
        $.each(keys, function(i, key) {
            var dataObj = processingHashEmails[key];
            var parentIds = Object.keys(dataObj.parentId);
            var query = new Parse.Query(Parse.User);
            query.containedIn('objectId', parentIds);
            query.find({
                success: function(results) {
                    $.each(results, function(index, result) {
                        if (result.get('isEmailDelivery')) {
                            emailList.push(result.get('email'));
                        }
                    });
                },
                error: function(error) {
                    console.log(error);
                }
            }).then(function() {
                var UserAcctAccess = Parse.Object.extend("UserAcctAccess", {}, {
                    query: function() {
                        return new Parse.Query(this.className);
                    }
                });

                var query = UserAcctAccess.query();
                query.containedIn('parentId', parentIds);
                query.find({
                    success: function(results) {
                        $.each(results, function(index, result) {
                            var email = result.get('givenAccessUserEmail');
                            if (email && emailList.indexOf(email) === -1) {
                                emailList.push(email);
                            }
                        });
                    },
                    error: function(error) {
                        console.log(error);
                    }
                }).then(function() {
                    _updateInfoCustomListToEmail(dataObj.groupId).then(function(d) {
                        if (d != undefined) {
                            createEmails(dataObj.type, dataObj.selectedOrgId, dataObj.groupId, dataObj.dataId, d[0].customListId, d[0].customListName, emailList);
                        }
                    }); // get information user custom list
                });
            });
        });
    };

    var loadOrganizationGroups = function() {
        selectedOrgId = user.setting.selectedOrgId;
        selectedOrgGroupId = user.setting.selectedOrgGroupId;
        //Get org groups
        var OrganizationGroup = Parse.Object.extend("OrganizationGroup", {}, {
            query: function() {
                return new Parse.Query(this.className);
            }
        });
        var query = OrganizationGroup.query();
        query.equalTo("organizationId", selectedOrgId);
        query.ascending("name");
        var spinner = _createSpinner('spinner');
        query.find({
            success: function(results) {
                $("#content").empty();
                orgGroupDataArray = results;

                if (results.length == 0) {
                    // $("#content").html('<div style="text-align:center; padding:0 10px;">No group found</div>');
                    var initGroupIdArray = groupIdArray.length == 0 ? true : false;
                    var initCustomSelectedStudentIdArray = customSelectedStudentIdArray.length == 0 ? true : false;
                    if (selectedGroupIdArray.indexOf(selectedOrgId) != -1) {
                        $("#content").append('<div id="' + selectedOrgId + '" class="menu-item">   \
                                    <div class="text-left"><div class="circle-icon-wrapper"><i class="icon-fontello-ok-circled icon-p2-green"></i></div> <span>All ' + user.setting.selectedOrgData.name + ' Students</span></div> \
                                    <div class="icon-right big"><i class="icon-right-open"></i></div>   \
                                </div>');
                    } else {
                        $("#content").append('<div id="' + selectedOrgId + '" class="menu-item">   \
                                    <div class="text-left"><div class="circle-icon-wrapper"><i class="icon-fontello-circle icon-grey"></i></div> <span>All ' + user.setting.selectedOrgData.name + ' Students</span></div> \
                                    <div class="icon-right big"><i class="icon-right-open"></i></div>   \
                                </div>');
                    }
                    var initGroupIdArray = groupIdArray.length == 0 ? true : false;
                    var initCustomSelectedStudentIdArray = customSelectedStudentIdArray.length == 0 ? true : false;
                    orgGroupNameArray.push(user.setting.selectedOrgData.name);
                    if (initGroupIdArray) {
                        groupIdArray.push(selectedOrgId);
                    }
                    if (initCustomSelectedStudentIdArray) {
                        customSelectedStudentIdArray.push([]);
                    }
                } else {
                    var initGroupIdArray = groupIdArray.length == 0 ? true : false;
                    var initCustomSelectedStudentIdArray = customSelectedStudentIdArray.length == 0 ? true : false;
                    if (selectedGroupIdArray.indexOf(selectedOrgId) != -1) {
                        $("#content").append('<div id="' + selectedOrgId + '" class="menu-item">   \
                                <div class="text-left"><div class="circle-icon-wrapper"><i class="icon-fontello-ok-circled icon-p2-green"></i></div> <span>All ' + user.setting.selectedOrgData.name + ' Students</span></div> \
                                <div class="icon-right big"><i class="icon-right-open"></i></div>   \
                            </div>');
                    } else {
                        $("#content").append('<div id="' + selectedOrgId + '" class="menu-item">   \
                                <div class="text-left"><div class="circle-icon-wrapper"><i class="icon-fontello-circle icon-grey"></i></div> <span>All ' + user.setting.selectedOrgData.name + ' Students</span></div> \
                                <div class="icon-right big"><i class="icon-right-open"></i></div>   \
                            </div>');
                    }
                    orgGroupNameArray.push(user.setting.selectedOrgData.name);
                    if (initGroupIdArray) {
                        groupIdArray.push(selectedOrgId);
                    }
                    if (initCustomSelectedStudentIdArray) {
                        customSelectedStudentIdArray.push([]);
                    }
                    for (var i = 0; i < results.length; i++) {
                        var group = results[i];
                        //Check if all/some students in this group are selected
                        if (selectedGroupIdArray.indexOf(group.id) != -1) {
                            $("#content").append('<div id="' + group.id + '" class="menu-item">   \
                                <div class="text-left"><div class="circle-icon-wrapper"><i class="icon-fontello-ok-circled icon-p2-green"></i></div> <span>' + group.get("name") + '</span></div> \
                                <div class="icon-right big"><i class="icon-right-open"></i></div>   \
                            </div>');
                        } else {
                            $("#content").append('<div id="' + group.id + '" class="menu-item">   \
                                <div class="text-left"><div class="circle-icon-wrapper"><i class="icon-fontello-circle icon-grey"></i></div> <span>' + group.get("name") + '</span></div> \
                                <div class="icon-right big"><i class="icon-right-open"></i></div>   \
                            </div>');
                        }
                        orgGroupNameArray.push(group.get("name"));
                        if (initGroupIdArray) {
                            groupIdArray.push(group.id);
                        }
                        if (initCustomSelectedStudentIdArray) {
                            customSelectedStudentIdArray.push([]);
                        }
                    } //eo for results.length
                    initEvents();
                    initSearch();
                    $("#doneBtn").removeClass("hidden");
                }
                //Show results
                $(".upper-area").removeClass("hidden");
                $(".lower-area").removeClass("hidden");
                spinner.stop();
            },
            error: function(error) {
                    //Todo: show error message
                    console.log("Could not load org groups: " + error);
                    $(".upper-area").removeClass("hidden");
                    $(".lower-area").removeClass("hidden");
                    spinner.stop();
                } //eo error
        }); //eo query.find
    }; //eo loadOrganizationGroups

    var initSearch = function() {
        var doSearch = function() {
            var targetGroupDataArray = [];
            var str = $("#searchTxt").val().toLowerCase();
            for (var i = 0; i < orgGroupNameArray.length; i++) {
                var groupName = orgGroupNameArray[i];
                if (groupName.toLowerCase().indexOf(str) != -1) {
                    targetGroupDataArray.push(orgGroupDataArray[i]);
                }
            }
            $("#content").empty();
            for (var i = 0; i < targetGroupDataArray.length; i++) {
                var group = targetGroupDataArray[i];

                if (selectedGroupIdArray.indexOf(group.id) != -1) {
                    $("#content").append('<div id="' + group.id + '" class="menu-item">   \
                        <div class="text-left"><div class="circle-icon-wrapper"><i class="icon-fontello-ok-circled icon-p2-green"></i></div> <span>' + group.get("name") + '</span></div> \
                        <div class="icon-right big"><i class="icon-right-open"></i></div>   \
                    </div>');
                } else {
                    $("#content").append('<div id="' + group.id + '" class="menu-item">   \
                        <div class="text-left"><div class="circle-icon-wrapper"><i class="icon-fontello-circle icon-grey"></i></div> <span>' + group.get("name") + '</span></div> \
                        <div class="icon-right big"><i class="icon-right-open"></i></div>   \
                    </div>');
                }
            }
            initEvents();
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
            } //eo swithc keyCode
        }); //eo keyup
        $("#searchBtn").on('click', function() {
            doSearch();
        });
    }; //eo initSearch

    var initButtons = function() {
        $("#backBtn").on('click', function(e) {
            //Reset data
            user.setting.addStudent = null;
            localStorage.setItem("user", JSON.stringify(user));
            Chaplin.utils.redirectTo({
                name: 'setting-organizations-groups-detail-students-add'
            });
        }); //eo initButtons

        var onClick = function(e) {
            console.log('Start adding Students to group at: ' + new Date());

            var totalRequest = 0;
            var totalResponse = 0;
            var query;

            for (var i = 0; i < selectedGroupIdArray.length; i++) {
                var groupId = selectedGroupIdArray[i];
                var flag = wholeGroupSelectedFlagArray[i];
                //If true, select all student in this group
                if (flag) {
                    totalRequest++;
                    //Get org groups
                    var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation", {}, {
                        query: function() {
                            return new Parse.Query(this.className);
                        }
                    });
                    var UserOrganizationRelation = Parse.Object.extend("UserOrganizationRelation", {}, {
                        query: function() {
                            return new Parse.Query(this.className);
                        }
                    });
                    var isOrg = function() {
                        query = UserOrganizationRelation.query();
                        query.equalTo("organizationId", selectedOrgId);
                        query.equalTo("relation", "student");
                    }; //eo isOrg
                    var isOrgGroup = function() {
                        query = UserOrganizationGroupRelation.query();
                        query.equalTo("organizationGroupId", groupId);
                        query.equalTo("relationType", "student");
                    }; //eo isOrgGroup
                    selectedOrgId == groupId ? isOrg() : isOrgGroup();
                    var spinner = _createSpinner('spinner');
                    query.find({
                        success: function(results) {
                            if (results.length > 0) {
                                var studentIdArray = [];
                                for (var i = 0; i < results.length; i++) {
                                    var relation = results[i];
                                    studentIdArray.push(relation.get("userId"));
                                }
                                var index = selectedOrgId == groupId ? groupIdArray.indexOf(results[0].get("organizationId")) : groupIdArray.indexOf(results[0].get("organizationGroupId"));
                                customSelectedStudentIdArray[index] = studentIdArray;
                            }
                            totalResponse++;
                            if (totalResponse == totalRequest) {
                                processResponses();
                            }
                            spinner.stop();
                        },
                        error: function(error) {
                                _confirm("Error, there was a problem conntecting to server");
                                spinner.stop();
                                Chaplin.utils.redirectTo({
                                    name: 'setting-organizations-groups-detail-students'
                                }); //eo redirect
                            } //eo error
                    }); //eo query find
                } //eo if flag
            } //eo for
            //If no whole group is selected
            if (totalResponse == totalRequest) {
                processResponses();
            }
            // clear selected group in user settings
            user.setting.addStudent.selectedGroupIdArray = [];
            user.setting.addStudent.wholeGroupSelectedFlagArray = [];
            user.setting.addStudent.customSelectedStudentIdArray = [];
            user.setting.addStudent.groupIdArray = [];
            localStorage.setItem("user", JSON.stringify(user));
        };

        $("#doneBtn").on("click", function(e) {
            onClick(e);
        }); //eo doneBtn click
    }; //eo initButtons

    var processResponses = function() {
        var allStudentIdArray = [];
        var parentIdArray = [];
        for (var i = 0; i < selectedGroupIdArray.length; i++) {
            var groupId = selectedGroupIdArray[i];
            var index = groupIdArray.indexOf(groupId);
            var selectedStudentsFromGroup = customSelectedStudentIdArray[index];
            for (var j = 0; j < selectedStudentsFromGroup.length; j++) {
                var studentId = selectedStudentsFromGroup[j];
                if (allStudentIdArray.indexOf(studentId) == -1) {
                    allStudentIdArray.push(studentId);
                }
            } //eo for j
        } //eo for i
        //Filter, take only students that are not in this group yet
        var data = user.setting.selectedOrgGroupStudentRelationData;
        for (var i = 0; i < data.length; i++) {
            var relation = data[i];
            var index = allStudentIdArray.indexOf(relation.userId);
            if (index != -1) {
                allStudentIdArray.splice(index, 1);
            }
        } //eo for data.length
        //console.log(allStudentIdArray);
        //Save data
        //Create relation, no need to check if relation is exist because we have filtered it.
        var totalRequest = 0;
        var totalResponese = 0;
        var redirect = function() {
            Chaplin.utils.redirectTo({
                name: 'setting-organizations-groups-detail-students'
            });
        }; //eo redirect
        //Get student name, we need this data (its easy to do it right here)
        var Child = Parse.Object.extend("Child", {}, {
            query: function() {
                return new Parse.Query(this.className);
            }
        });
        var query = Child.query();
        query.containedIn("objectId", allStudentIdArray);
        var createdSpinner = _createSpinner('spinner'); //needs to be different than spinner variable for spinner.hide
        query.find({
            success: function(results) {
                if (results.length == 0) {
                    _confirm("Error, there was an internal error, please contact the admin");
                    Chaplin.utils.redirectTo({
                        name: 'setting-organizations-groups-detail-students'
                    });
                } else {
                    getParent(results);
                    addToOrgGroup(results);
                    createRelation(results);
                }
                createdSpinner.stop();
            },
            error: function(error) {
                _confirm("Error, there was a problem connecting to server");
                createdSpinner.stop();
                Chaplin.utils.redirectTo({
                    name: 'setting-organizations-groups-detail-students'
                });
            }
        }); //eo query.find

        var createRelation = function(allStudentData) {
            var selectedOrgGroupId = user.setting.selectedOrgGroupId;
            var selectedOrgGroupData = user.setting.selectedOrgGroupData;
            for (var i = 0; i < allStudentData.length; i++) {
                totalRequest++;
                var student = allStudentData[i];
                var studentId = student.id;
                var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation");
                var relation = new UserOrganizationGroupRelation();
                relation.set("organizationGroupId", selectedOrgGroupId);
                relation.set("userId", studentId);
                relation.set("relationType", "student");
                relation.set("position", "Student");
                relation.set("groupName", selectedOrgGroupData.name);
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
                relation.set("firstName", student.get("firstName"));
                relation.set("lastName", student.get("lastName"));
                var createdSpinner = _createSpinner('spinner');
                relation.save(null, {
                    success: function(relation) {
                        // Execute any logic that should take place after the object is saved.
                        //alert('New object created with objectId: ' + relation.id);
                        totalResponese++;
                        if (totalRequest == totalResponese) {
                            spinner.hide();
                            redirect();
                        }
                        createdSpinner.stop();
                    },
                    error: function(relation, error) {
                            // Execute any logic that should take place if the save fails.
                            // error is a Parse.Error with an error code and message.
                            console.log('Failed to create new object, with error code: ' + error.message);
                            totalResponese++;
                            if (totalRequest == totalResponese) {
                                spinner.hide();
                                redirect();
                            } //eo if totalRequest
                            createdSpinner.stop();
                        } //eo error
                }); //eo relation.save
            } //eo allStudentData.length
        }; //eo createRelation

        var getParent = function(allStudentData) {
            var selectedOrgGroupId = user.setting.selectedOrgGroupId;
            var parentObjectArray = {};

            var studentIds = [];
            allStudentData.forEach(function(student) {
                studentIds.push(student.id);
            })

            var UserParentRelation = Parse.Object.extend("UserParentRelation", {}, {
                query: function() {
                    return new Parse.Query(this.className);
                }
            });
            var query = UserParentRelation.query();
            query.containedIn("childId", studentIds);
            query.find({
                success: function(results) {
                    for (var j = 0; j < results.length; j++) {
                        var parent = results[j];
                        parentId = parent.get("parentId");
                        var childId = parent.get("childId");
                        if (parentIdArray.indexOf(parentId) < 0) {
                            parentIdArray.push(parentId);
                            parentObjectArray[parentId] = {
                                parent: parentId,
                                children: [childId]
                            };
                        } else {
                            parentObjectArray[parentId].children.push(childId);
                        }
                    }
                },
                error: function(error) {
                    console.log(error);
                }
            }).then(function() {
                for (var k = 0; k < parentIdArray.length; k++) {
                    var parentIdToAdd = parentIdArray[k];
                    _addParentEmail(parentIdToAdd, user.setting.selectedOrgGroupId);
                }

                setTimeout(function() {
                    addToCustomList(parentObjectArray, parentIdArray);
                }, 2000);
            });
        }; //eo getParent

        var getParentEmail = function(customGroup, parentId) {
            var parentEmail;
            var query = new Parse.Query(Parse.User);
            query.equalTo("objectId", parentId);
            query.find({
                success: function(results) {
                    var parentUser = results[0];
                    var isEmailDelivery = parentUser.get("isEmailDelivery");
                    if (isEmailDelivery) {
                        parentEmail = parentUser.get("email");
                        customGroup.addUnique("userContactEmail", parentEmail);
                    }
                    customGroup.save();
                },
                error: function(error) {

                }
            });
        }; //eo getParentEmail

        var addToCustomList = function(parentObjectArray, parentIdArray) {
            var selectedOrgGroupId = user.setting.selectedOrgGroupId;
            var UserCustomList = Parse.Object.extend("UserCustomList", {}, {
                query: function() {
                    return new Parse.Query(this.className);
                }
            });
            var query = UserCustomList.query();
            query.equalTo("groupId", selectedOrgGroupId);
            query.find({
                success: function(results) {
                    for (var i = 0; i < results.length; i++) {
                        var customGroup = results[i];
                        var recipientList = customGroup.get("recipientList");
                        for (var j = 0; j < parentIdArray.length; j++) {
                            parentId = parentIdArray[j];
                            getParentEmail(customGroup, parentId);
                            var recipient = jQuery.grep(recipientList, function(n) {
                                return n.parent == parentId;
                            });
                            if (recipient.length == 0) {
                                recipientList.push(parentObjectArray[parentId]);
                            } else {
                                for (var m = 0; m < parentObjectArray[parentId].children.length; m++) {
                                    var childId = parentObjectArray[parentId].children[m];
                                    if (recipient[0].children.indexOf(childId) == -1) {
                                        recipient[0].children.push(childId);
                                    }
                                }
                            }
                        } //eo parentIdArray for loop
                        customGroup.save();
                    } //eo results for loop
                },
                error: function(error) {
                    console.log(error);
                }
            }).then(function() {
                var internalDeferreds = [
                    addOldEvents(selectedOrgGroupId, parentIdArray, parentObjectArray),
                    addOldHomework(selectedOrgGroupId, parentIdArray, parentObjectArray)
                ];

                $.when.apply(this, internalDeferreds).then(buildEmails);
            })
        }; //eo addToCustomList

        var addOldEvents = function(groupId, parentIdArray, parentObjectArray) {
            var deferred = $.Deferred();
            var Today = new Date();
            var Event = Parse.Object.extend("Event", {}, {
                query: function() {
                    return new Parse.Query(this.className);
                }
            });
            var queryRootRepeatingEvents = Event.query();
            queryRootRepeatingEvents.equalTo("orgIdForThisObject", groupId);
            queryRootRepeatingEvents.greaterThan("untilDate", new Date());
            queryRootRepeatingEvents.endsWith("repeatId", "-0");

            var querySingleEvents = Event.query();
            querySingleEvents.equalTo("orgIdForThisObject", groupId); //orgIdForThisObject is now groupId
            querySingleEvents.greaterThanOrEqualTo("endDateTime", Today); //no events from the past
            querySingleEvents.containedIn("repeatId", ["", null]);

            var queryRepeatedEventInstance = Event.query();
            queryRepeatedEventInstance.equalTo("orgIdForThisObject", groupId);
            queryRepeatedEventInstance.notContainedIn("repeatId", ["", null]);
            queryRepeatedEventInstance.equalTo("isModifySingleEvent", true);
            queryRepeatedEventInstance.greaterThan("endDateTime", new Date());

            var mainQuery = Parse.Query.or(queryRootRepeatingEvents, querySingleEvents, queryRepeatedEventInstance);

            mainQuery.limit(500);
            mainQuery.find({
                success: function(results) {
                    function appendToEmailHash() {
                        $.each(results, function(i, event) {
                            for (var m = 0; m < parentIdArray.length; m++) {
                                var parentId = parentIdArray[m];
                                var key = selectedOrgId + '_' + groupId + '_event';

                                if (hashEmails[key]) {
                                    if (!hashEmails[key][event.id]) {
                                        hashEmails[key].dataId[event.id] = event;
                                    }
                                    hashEmails[key].parentId[parentId] = parentId;
                                } else {
                                    hashEmails[key] = {
                                        dataId: {},
                                        parentId: {},
                                        type: 'event',
                                        selectedOrgId: selectedOrgId,
                                        groupId: groupId
                                    };
                                    hashEmails[key].dataId[event.id] = event;
                                    hashEmails[key].parentId[parentId] = parentId;
                                }
                            }
                        });
                    }

                    function addUserEventRelations(parentIdArray, parentObjectDict, eventId, groupType, groupId) {
                        var UserEventRelation = Parse.Object.extend("UserEventRelation", {}, {
                            query: function() {
                                return new Parse.Query(this.className);
                            }
                        });
                        var query = UserEventRelation.query();
                        query.containedIn("parentId", parentIdArray);
                        query.equalTo("eventId", eventId);
                        query.find({
                            success: function(results) {
                                function buildParentIdToRelationDictionary() {
                                    var dict = {};
                                    results.forEach(function(relation) {
                                        dict[relation.get("parentId")] = relation;
                                    });

                                    return dict;
                                }

                                function createUserEventRelation(parentId, childIdList, eventId, groupType, groupId) {
                                    var UserEventRelation = Parse.Object.extend("UserEventRelation");
                                    var relation = new UserEventRelation();
                                    relation.set("childIdList", childIdList);
                                    relation.set("eventId", eventId);
                                    relation.set("groupType", groupType);
                                    relation.set("isRead", false);
                                    relation.set("isUpdated", false);
                                    relation.set("parentId", parentId);
                                    relation.set("organizationId", selectedOrgId);
                                    relation.set("groupId", groupId);
                                    return relation;
                                };

                                var allEventRelations = [];
                                var existingRelationDict = buildParentIdToRelationDictionary(results);
                                parentIdArray.forEach(function(parentId) {
                                    var eventRelation = existingRelationDict[parentId];
                                    var childIdList = parentObjectDict[parentId].children;

                                    if (eventRelation) {
                                        for (var i = 0; i < childIdList.length; i++) {
                                            var childId = childIdList[i];
                                            eventRelation.addUnique("childIdList", childId);
                                        }
                                        eventRelation.set("organizationId", selectedOrgId);
                                        if (!eventRelation.get('groupId')) {
                                            eventRelation.set("groupId", groupId);
                                        }
                                        allEventRelations.push(eventRelation);
                                    } else {
                                        allEventRelations.push(createUserEventRelation(parentId, childIdList, eventId, groupType, groupId));
                                    }
                                });

                                Parse.Object.saveAll(allEventRelations, {
                                    success: function(d) {
                                        console.log('End addUserEventRelation for eventId<' + eventId + '> at: ' + new Date());
                                    },
                                    error: function(err) {
                                        _alert('Internal Error: Error while saving event relations:' + err);
                                    }
                                });
                            },
                            error: function(error) {
                                alert('Error: ' + JSON.stringify(error));
                            }
                        }); //eo query.find
                    }; //eo addUserEventRelation					

                    appendToEmailHash();
                    results.forEach(function(event) {
                        addUserEventRelations(parentIdArray, parentObjectArray, event.id, event.get("groupType"), groupId);
                    });

                    deferred.resolve();
                },
                error: function(error) {
                    alert('Error: ' + JSON.stringify(error));
                    deferred.reject();
                }
            });





            return deferred;
        }; //eo addOldEvents

        var addOldHomework = function(groupId, parentIdArray, parentObjectArray, childIdList, parentId) {
            var deferred = $.Deferred();
            var parentId = parentId;
            var childIdList = childIdList;
            var Today = new Date();
            var Homework = Parse.Object.extend("Homework", {}, {
                query: function() {
                    return new Parse.Query(this.className);
                }
            });
            var query = Homework.query();
            query.equalTo("orgIdForThisObject", groupId); //orgIdForThisObject is now groupId
            query.greaterThanOrEqualTo("dueDate", Today); //no homeworks from the past
            query.find({
                success: function(results) {
                    for (var i = 0; i < results.length; i++) {
                        for (var m = 0; m < parentIdArray.length; m++) {
                            var parentId = parentIdArray[m];
                            var childIdList = parentObjectArray[m].children;

                            var homework = results[i];
                            var homeworkId = homework.id;
                            var groupType = homework.get("groupType");
                            isUserHomeworkRelationExist(parentId, childIdList, homeworkId, groupType);

                            var key = selectedOrgId + '_' + groupId + '_homework';

                            if (hashEmails[key]) {
                                if (!hashEmails[key][homework.id]) {
                                    hashEmails[key].dataId[homework.id] = homework;
                                }
                                hashEmails[key].parentId[parentId] = parentId;
                            } else {
                                hashEmails[key] = {
                                    dataId: {},
                                    parentId: {},
                                    type: 'homework',
                                    selectedOrgId: selectedOrgId,
                                    groupId: groupId
                                };
                                hashEmails[key].dataId[homework.id] = homework;
                                hashEmails[key].parentId[parentId] = parentId;
                            }
                        }
                    }

                    deferred.resolve();
                },
                error: function(error) {
                    console.log('Error: ' + JSON.stringify(error));
                    deferred.reject();
                }
            });
            var createUserHomeworkRelation = function(parentId, childIdList, homeworkId, groupType) {
                var UserHomeworkRelation = Parse.Object.extend("UserHomeworkRelation");
                var relation = new UserHomeworkRelation();
                relation.set("childIdList", childIdList);
                relation.set("homeworkId", homeworkId);
                relation.set("groupType", groupType);
                relation.set("isRead", false);
                relation.set("isUpdated", false);
                relation.set("parentId", parentId);
                relation.save();
            }; //eo createUserHomeworkRelation
            var isUserHomeworkRelationExist = function(parentId, childIdList, homeworkId, groupType) {
                var UserHomeworkRelation = Parse.Object.extend("UserHomeworkRelation", {}, {
                    query: function() {
                        return new Parse.Query(this.className);
                    }
                });
                var query = UserHomeworkRelation.query();
                query.equalTo("parentId", parentId);
                query.equalTo("homeworkId", homeworkId);
                query.find({
                    success: function(results) {
                        if (results.length > 0) {
                            var homeworkRelation = results[0];
                            for (var i = 0; i < childIdList.length; i++) {
                                var childId = childIdList[i];
                                homeworkRelation.addUnique("childIdList", childId);
                            }
                            homeworkRelation.save();
                        } else {
                            createUserHomeworkRelation(parentId, childIdList, homeworkId, groupType);
                        }
                    },
                    error: function(error) {
                        console.log('Error: ' + JSON.stringify(error));
                    }
                }); //eo query.find
            }; //eo isUserHomeworkRelationExist

            return deferred;
        }; //eo addOldHomework

        var addToOrgGroup = function(allStudentData) {
            var selectedOrgGroupId = user.setting.selectedOrgGroupId;
            /*
              Change code by phuongnh@vinasource.com
              We only find OrganizationGroup if exists then addToOrgGroup
            */
            var OrganizationGroup = Parse.Object.extend("OrganizationGroup", {}, {
                query: function() {
                    return new Parse.Query(this.className);
                }
            });
            var query = OrganizationGroup.query();
            query.equalTo("objectId", selectedOrgGroupId);
            query.find({
                success: function(results) {
                    if (results.length == 0) {
                        _confirm("There was an error finding group");
                        spinner.hide();
                    } else {
                        var orgGroup = results[0];
                        console.log('results = ' + results.length);
                        console.log('allStudentData = ' + allStudentData.length);
                        for (var i = 0; i < allStudentData.length; i++) {
                            var studentId = allStudentData[i].id;
                            console.log('studentId:' + studentId);
                            orgGroup.addUnique("studentIdList", studentId);
                            orgGroup.save();

                        }
                    }
                },
                error: function(error) {
                    console.log(error);
                    _confirm("There was an error connecting to the server, please try again");
                }
            });
            // for ( var i = 0; i < allStudentData.length; i++ ) {
            // 	var student = allStudentData[ i ];
            // 	var studentId = student.id;
            // 	var OrganizationGroup = Parse.Object.extend( "OrganizationGroup", {}, {
            // 		query: function () {
            // 			return new Parse.Query( this.className );
            // 		}
            // 	} );
            // 	var query = OrganizationGroup.query();
            // 	query.equalTo( "objectId", selectedOrgGroupId );
            // 	query.find( {
            // 		success: function ( results ) {
            // 			if ( results.length == 0 ) {
            // 				_confirm( "There was an error finding group" );
            // 				spinner.hide();
            // 			} else {
            // 				//Add child to organization
            // 				var orgGroup = results[ 0 ];
            // 				orgGroup.addUnique( "studentIdList", studentId );
            // 				orgGroup.save();
            //
            // 			}
            // 		},
            // 		error: function ( error ) {
            // 			console.log( error );
            // 			_confirm( "There was an error connecting to the server, please try again" );
            // 		}
            // 	} );
            // }
        }; //eo addToOrgGroup
        //spinner.hide();
    }; //eo processResponses

    var initEvents = function() {
        $(".text-left").off("click");
        $(".text-left").on("click", function(e) {
            var groupId = $(this).parent().attr("id"); //student's id = Kid's id
            var index = selectedGroupIdArray.indexOf(groupId);
            var div = $(this).parent().children().children().children().eq(0);
            if (index == -1) {
                selectedGroupIdArray.push(groupId);
                wholeGroupSelectedFlagArray.push(true);
                div.removeClass("icon-fontello-circle");
                div.removeClass("icon-grey");
                div.addClass("icon-fontello-ok-circled");
                div.addClass("icon-p2-green");
            } else {
                selectedGroupIdArray.splice(index, 1);
                wholeGroupSelectedFlagArray.splice(index, 1);
                div.addClass("icon-fontello-circle");
                div.addClass("icon-grey");
                div.removeClass("icon-fontello-ok-circled");
                div.removeClass("icon-p2-green");
            } //eo if index
        }); //eo text-left click
        //Select individual students
        $(".icon-right").off('click');
        $(".icon-right").on('click', function(e) {
            $(this).parent().addClass("bg-highlight-grey");
            //Save selected groups in cache
            user.setting.addStudent.selectedGroupId = $(this).parent().attr("id");
            user.setting.addStudent.selectedGroupName = $(this).parent().children().eq(0).children().eq(1).html();
            user.setting.addStudent.selectedGroupIdArray = selectedGroupIdArray;
            user.setting.addStudent.wholeGroupSelectedFlagArray = wholeGroupSelectedFlagArray;
            user.setting.addStudent.customSelectedStudentIdArray = customSelectedStudentIdArray;
            user.setting.addStudent.groupIdArray = groupIdArray;
            localStorage.setItem("user", JSON.stringify(user));
            setTimeout(function() {
                Chaplin.utils.redirectTo({
                    name: 'setting-organizations-groups-detail-students-add-organization-individual'
                });
            }, DEFAULT_ANIMATION_DELAY);

        });
    }; //eo initEvents

    //var spinner = null;
    var addedToDOM = function() {
        //Load saved data & reset some values
        //=============================================================
        user = JSON.parse(localStorage.getItem("user"));
        if (typeof user.setting.addStudent === 'undefined' || user.setting.addStudent == null) {
            user.setting.addStudent = {};
        }
        if (typeof user.setting.addStudent.selectedGroupIdArray === 'undefined' || user.setting.addStudent.selectedGroupIdArray == null) {
            selectedGroupIdArray = [];
        } else {
            selectedGroupIdArray = user.setting.addStudent.selectedGroupIdArray;
        }
        if (typeof user.setting.addStudent.wholeGroupSelectedFlagArray === 'undefined' || user.setting.addStudent.wholeGroupSelectedFlagArray == null) {
            wholeGroupSelectedFlagArray = [];
        } else {
            wholeGroupSelectedFlagArray = user.setting.addStudent.wholeGroupSelectedFlagArray;
        }
        if (typeof user.setting.addStudent.orgGroupNameArray === 'undefined' || user.setting.addStudent.orgGroupNameArray == null) {
            orgGroupNameArray = [];
        } else {
            orgGroupNameArray = user.setting.addStudent.orgGroupNameArray;
        }
        if (typeof user.setting.addStudent.customSelectedStudentIdArray === 'undefined' || user.setting.addStudent.customSelectedStudentIdArray == null) {
            customSelectedStudentIdArray = [];
        } else {
            customSelectedStudentIdArray = user.setting.addStudent.customSelectedStudentIdArray;
        }
        if (typeof user.setting.addStudent.groupIdArray === 'undefined' || user.setting.addStudent.groupIdArray == null) {
            groupIdArray = [];
        } else {
            groupIdArray = user.setting.addStudent.groupIdArray;
        }
        //=============================================================
        initButtons();
        loadOrganizationGroups();
    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: 'setting-organizations-groups-detail-students-add-organization-view',
        className: 'view-container',
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