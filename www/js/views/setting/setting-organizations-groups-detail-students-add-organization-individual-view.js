define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-organizations-groups-detail-students-add-organization-individual-view.hbs',
    'jquery',
    'parse'
], function(Chaplin, View, Template, $, Parse) {
    'use strict';

    var selectedStudentIdArray;
    var studentNameArray;
    var organizationGroupRelationData;
    var allStudentIdArray;

    var loadStudents = function() {
        var user = JSON.parse(localStorage.getItem("user"));
        var selectedOrgId = user.setting.selectedOrgId;
        var selectedGroupId = user.setting.addStudent.selectedGroupId;
        var selectedGroupName = user.setting.addStudent.selectedGroupName;
        var query;
        $("#groupTitle").html(selectedGroupName);
        //Get org groups
        var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var UserOrganizationRelation = Parse.Object.extend("UserOrganizationRelation", {}, {
          query: function(){
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
            query.equalTo("organizationGroupId", selectedGroupId);
            query.equalTo("relationType", "student");
        }; //eo isOrgGroup
        selectedOrgId == selectedGroupId ?  isOrg() : isOrgGroup();
        query.ascending("firstName");
        spinner = _createSpinner('spinner');
        query.find({
            success: function(results) {
                organizationGroupRelationData = results;
                var groupIdArray = user.setting.addStudent.groupIdArray;
                var index = groupIdArray.indexOf(selectedGroupId);
                var selectedGroupIdArray = user.setting.addStudent.selectedGroupIdArray;
                $("#content").empty();
                if (results.length == 0) {
                    $("#content").html('<div style="text-align:center; padding:0 10px;">No student found</div>');
                } else {
                    var index = selectedGroupIdArray.indexOf(selectedGroupId);
                    if (index == -1) {
                        for (var i = 0; i < results.length; i++) {
                            var student = results[i];
                            var name = student.get("firstName") + ' ' + student.get("lastName");
                            $("#content").append('<div id="' + student.get("userId") + '" class="menu-item">   \
                                <div class="text-left"><div class="circle-icon-wrapper"><i class="icon-fontello-circle icon-grey ic"></i></div> ' + name + '</div> \
                            </div>');
                            studentNameArray.push(name);
                            allStudentIdArray.push(student.get("userId"));
                        }
                    } else {
                        var wholeGroupSelectedFlagArray = user.setting.addStudent.wholeGroupSelectedFlagArray;
                        if (wholeGroupSelectedFlagArray[index]) {
                            for (var i = 0; i < results.length; i++) {
                                var student = results[i];
                                var name = student.get("firstName") + ' ' + student.get("lastName");
                                $("#content").append('<div id="' + student.get("userId") + '" class="menu-item">   \
                                    <div class="text-left"><div class="circle-icon-wrapper"><i class="icon-fontello-ok-circled icon-p2-green ic"></i></div> ' + name + '</div> \
                                </div>');
                                selectedStudentIdArray.push(student.get("userId"));
                                studentNameArray.push(name);
                                allStudentIdArray.push(student.get("userId"));
                            }
                        } else {
                            var customSelectedStudentIdArray = user.setting.addStudent.customSelectedStudentIdArray;
                            selectedStudentIdArray = customSelectedStudentIdArray[index];
                            for (var i = 0; i < results.length; i++) {
                                var student = results[i];
                                var name = student.get("firstName") + ' ' + student.get("lastName");
                                if (selectedStudentIdArray.indexOf(student.get("userId")) != -1) {
                                    $("#content").append('<div id="' + student.get("userId") + '" class="menu-item">   \
                                        <div class="text-left"><div class="circle-icon-wrapper"><i class="icon-fontello-ok-circled icon-p2-green ic"></i></div> ' + name + '</div> \
                                    </div>');
                                } else {
                                    $("#content").append('<div id="' + student.get("userId") + '" class="menu-item">   \
                                        <div class="text-left"><div class="circle-icon-wrapper"><i class="icon-fontello-circle icon-grey ic"></i></div> ' + name + '</div> \
                                    </div>');
                                }
                                studentNameArray.push(name);
                                allStudentIdArray.push(student.get("userId"));
                            }
                        }
                    }
                    initEvents();
                    initSearch();
                    $("#doneBtn").removeClass("hidden");
                }
                //Show results
                $(".upper-area").removeClass("hidden");
                $(".lower-area").removeClass("hidden");
                $("#doneBtn").removeClass("hidden");
                spinner.stop();
            },
            error: function(error) {
                //Todo: show error message
                console.log("Could not load org groups: " + error);
                $(".upper-area").removeClass("hidden");
                $(".lower-area").removeClass("hidden");
                spinner.stop();
            }
        });
        initEvents();
    }; //eo loadStudents

    var initButtons = function() {
        $("#backBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-organizations-groups-detail-students-add-organization'
            });
        });
        $("#selectAll").on("click", function(e) {
            selectedStudentIdArray = null;
            selectedStudentIdArray = allStudentIdArray.slice(0);
            var div = $(".ic");
            div.removeClass("icon-fontello-circle");
            div.removeClass("icon-grey");
            div.addClass("icon-fontello-ok-circled");
            div.addClass("icon-p2-green");
        });
        $("#selectNone").on("click", function(e) {
            selectedStudentIdArray = [];
            var div = $(".ic");
            div.addClass("icon-fontello-circle");
            div.addClass("icon-grey");
            div.removeClass("icon-fontello-ok-circled");
            div.removeClass("icon-p2-green");
        });
        $("#doneBtn").on('click', function(e) {
            var user = JSON.parse(localStorage.getItem("user"));
            var selectedGroupId = user.setting.addStudent.selectedGroupId;
            //Replace data
            //Save selected student ids
            var groupIdArray = user.setting.addStudent.groupIdArray;
            var customSelectedStudentIdArray = user.setting.addStudent.customSelectedStudentIdArray;    //customSelectedStudentIdArray  matches all groups
            var index = groupIdArray.indexOf(selectedGroupId);
            if (selectedStudentIdArray.length != 0) {
                customSelectedStudentIdArray[index] = selectedStudentIdArray;
            } else {
                customSelectedStudentIdArray[index] = [];
            }
            //Set whether or not the whole group is selected
            //DO THIS BEFORE YOU PROCESS selectedGroupIdArray
            var selectedGroupIdArray = user.setting.addStudent.selectedGroupIdArray;
            var wholeGroupSelectedFlagArray = user.setting.addStudent.wholeGroupSelectedFlagArray;
            if (selectedStudentIdArray.length != 0) {
                var index = selectedGroupIdArray.indexOf(selectedGroupId);
                var flag = wholeGroupSelectedFlagArray[index];
                //Check if flag exists, if not, it means that this group was not selected before
                if(typeof flag === 'undefined'){
                    if (selectedStudentIdArray.length == organizationGroupRelationData.length) {
                        wholeGroupSelectedFlagArray.push(true);
                    } else {
                        wholeGroupSelectedFlagArray.push(false);
                    }
                }else{
                    if (selectedStudentIdArray.length == organizationGroupRelationData.length) {
                        wholeGroupSelectedFlagArray[index] = true;
                    } else {
                        wholeGroupSelectedFlagArray[index] = false;
                    }
                }
            } else {
                var index = selectedGroupIdArray.indexOf(selectedGroupId);
                var flag = wholeGroupSelectedFlagArray[index];
                if(typeof flag === 'undefined'){
                    //Do nothing
                }else{
                    //If this group was selected before, then we remove it from the array
                    wholeGroupSelectedFlagArray.splice(index, 1);
                }
            }
            //Save selected group id (if it was not selected)
            if (selectedStudentIdArray.length != 0) {
                var index = selectedGroupIdArray.indexOf(selectedGroupId);
                //If it was not selected before, we add this group id to the selected group list
                if(index == -1){
                    selectedGroupIdArray.push(selectedGroupId);
                }
                //If it was, then we do nothing
                //...
            } else {
                var index = selectedGroupIdArray.indexOf(selectedGroupId);
                //If this group was selected before, then we remove it from the array
                if (index != -1) {
                    selectedGroupIdArray.splice(index, 1);
                }
            }
            user.setting.addStudent.selectedGroupIdArray = selectedGroupIdArray;
            //Save
            user.setting.addStudent.customSelectedStudentIdArray = customSelectedStudentIdArray;
            localStorage.setItem("user", JSON.stringify(user));
            //Return
            Chaplin.utils.redirectTo({
                name: 'setting-organizations-groups-detail-students-add-organization'
            });
        });
    }; //eo initButtons

    var initEvents = function() {
        $(".menu-item").on("click", function(e) {
            var studentId = $(this).attr("id"); //student's id = Kid's id
            var index = selectedStudentIdArray.indexOf(studentId);
            var div = $(this).children().children().children().eq(0);
            if (index == -1) {
                selectedStudentIdArray.push(studentId);
                div.removeClass("icon-fontello-circle");
                div.removeClass("icon-grey");
                div.addClass("icon-fontello-ok-circled");
                div.addClass("icon-p2-green");
            } else {
                selectedStudentIdArray.splice(index, 1);
                div.addClass("icon-fontello-circle");
                div.addClass("icon-grey");
                div.removeClass("icon-fontello-ok-circled");
                div.removeClass("icon-p2-green");
            } //eo else
        }); //eo menu-item click
    }; //eo initEvents

    var initSearch = function() {
        var doSearch = function() {
            var targetStudentDataArray = [];
            var str = $("#searchTxt").val().toLowerCase();
            for (var i = 0; i < studentNameArray.length; i++) {
                var studentName = studentNameArray[i];
                if (studentName.toLowerCase().indexOf(str) != -1) {
                    targetStudentDataArray.push(organizationGroupRelationData[i]);
                }
            }
            $("#content").empty();
            for (var i = 0; i < targetStudentDataArray.length; i++) {
                var student = targetStudentDataArray[i];
                var name = student.get("firstName") + ' ' + student.get("lastName")
                if (selectedStudentIdArray.indexOf(student.get("userId")) != -1) {
                    $("#content").append('<div id="' + student.get("userId") + '" class="menu-item">   \
                            <div class="text-left"><div class="circle-icon-wrapper"><i class="icon-fontello-ok-circled icon-p2-green ic"></i></div> ' + name + '</div> \
                        </div>');
                } else {
                    $("#content").append('<div id="' + student.get("userId") + '" class="menu-item">   \
                            <div class="text-left"><div class="circle-icon-wrapper"><i class="icon-fontello-circle icon-grey ic"></i></div> ' + name + '</div> \
                        </div>');
                }
            } //eo for
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
            }

        }); //eo keyup

        $("#searchBtn").on('click', function() {
            doSearch();
        });
    }; //eo initSearch

    var spinner = null;
    var addedToDOM = function() {
        selectedStudentIdArray = [];
        studentNameArray = [];
        allStudentIdArray = [];
        initButtons();
        loadStudents();
    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: 'setting-organizations-groups-detail-students-add-organization-individual-view',
        className: 'view-container',
        listen: {
            addedToDOM: addedToDOM
        },
        initialize: function(options) {
            //Reset footer
            $("#footer-toolbar > li").removeClass("active");
            Chaplin.View.prototype.initialize.call(this, arguments);
        }
    }); //eo addedToDOM

    return View;
});
