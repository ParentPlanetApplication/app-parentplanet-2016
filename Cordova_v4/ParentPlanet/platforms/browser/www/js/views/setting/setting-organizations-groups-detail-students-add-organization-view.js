define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-organizations-groups-detail-students-add-organization-view.hbs',
    'jquery',
    'spinner',
    'parse',
    'groupService'
], function(Chaplin, View, Template, $, spinner, Parse, groupService) {
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
    var dataObj = undefined;

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
            },
            error: function(error) {
                    //Todo: show error message
                    console.log("Could not load org groups: " + error);
                    $(".upper-area").removeClass("hidden");
                    $(".lower-area").removeClass("hidden");
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
                        },
                        error: function(error) {
                                _confirm("Error, there was a problem conntecting to server");
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

        var redirect = function() {
            Chaplin.utils.redirectTo({
                name: 'setting-organizations-groups-detail-students'
            });
        }; //eo redirect

        if (allStudentIdArray.length == 0) {
            _alert("All students in selected group(s) are already added");
            return;
        }

        spinner.show();
        groupService
            .addStudentsToGroup(
                allStudentIdArray, user.setting.selectedOrgId,
                user.setting.selectedOrgGroupId, user.setting.selectedOrgGroupData.name, redirect)
            .then(function() { _alert('Students were successfully added to group'); })
            .always(function() {
                spinner.hide();
            });
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