define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-organizations-groups-detail-students-view.hbs',
    'jquery',
    'spinner',
    'parse'
], function(Chaplin, View, Template, $, spinner, Parse) {
    'use strict';
    var user;
    var selectedStudentIdArray;
    var userStudentIdFromRelationArray;
    var userOrganizationGroupRelation;
    var selectedOrgId;
    var selectedOrgData;
    var studentIdArray;
    var studentDataArray;
    var studentNameArray;
    var selectedOrgGroupId;
    var selectedOrgGroupData;
    var spinner = null;
    var deferred;
    var initData = function() {
        selectedStudentIdArray = [];
        userStudentIdFromRelationArray = [];
        studentIdArray = [];
        studentNameArray = [];
        user = _getUserData();
        selectedOrgId = user.setting.selectedOrgId;
        selectedOrgData = user.setting.selectedOrgData;
        selectedOrgGroupId = user.setting.selectedOrgGroupId;
        selectedOrgGroupData = user.setting.selectedOrgGroupData;
    }; //eo initData
    var error = function(err) {
        console.log('Error: setting-organizations-groups-detail-students:'+err.code+' '+err.message);
        deferred ? deferred.resolve() : $.noop();
    }; //eo top-scope error function
    var redirect = function() {
        Chaplin.utils.redirectTo({    name: 'setting-organizations-groups-detail'    });
    };
    var initButtons = function() { //Init buttons
        $("#backBtn").on('click', function(e) { redirect(); });
        $("#addStudentBtn").on('click', function(e) {  //add student
            Chaplin.utils.redirectTo({    name: 'setting-organizations-groups-detail-students-add'    });
        });
    }; //eo initButtons
    var loadStudents = function() {
        //Load relations
        var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserOrganizationGroupRelation.query();
        spinner = _createSpinner('spinner');
        deferred = $.Deferred();
        query.equalTo("organizationGroupId", selectedOrgGroupId);
        query.equalTo("relationType", "student");
        query.find({
            success: function(results) {
                function noResults() {
                    $("#content").html('<div class="results-not-found">No students found in this group</div>');
                    deferred.resolve();
                };
                function hasResults() {
                    var childIdArray = [];
                    $.each(results, function(i, relation) {
                        childIdArray.push(relation.get("userId"))
                        userStudentIdFromRelationArray.push(relation.get("userId")); //For deleteing student-orgGroup relation
                    });
                    //Load students
                    var Child = Parse.Object.extend("Child", {}, {
                      query: function(){
                        return new Parse.Query(this.className);
                      }
                    });
                    var query = Child.query();
                    query.containedIn("objectId", childIdArray);
                    query.ascending("firstName");
                    query.find({
                        success: function(results) {
                            studentDataArray = results;
                            if (results.length == 0) {
                                $("#content").html('<div style="text-align:center;padding:0 10px;">No student found</div>');
                            } else {
                                $("#content").empty();
                                $.each(results, function(i, child) {
                                    $("#content").append('<div id="'
                                        + child.id
                                        + '" class="menu-item full-width"><div class="text-left" style="width:74%;"><div class="circle-icon-wrapper"><i class="icon-fontello-circle icon-grey"></i></div><span>'
                                        + child.get("firstName") + " " + child.get("lastName")
                                        + '</span></div><div class="delete hidden">Delete</div></div>');
                                    studentIdArray.push(child.id);
                                    studentNameArray.push(child.get("firstName") + " " + child.get("lastName"));
                                });
                            }
                            $("#doneBtn").removeClass("hidden");
                            deferred.resolve();
                        },
                        error: error
                    }); //eo query.find
                }; //eo hasResults
                userOrganizationGroupRelation = results;
                //Save data for use in M8
                user.setting.selectedOrgGroupStudentRelationData = results;
                _setUserData(user);
                results.length > 0 ? hasResults() : noResults();
                spinner.stop();
            },
            error: error
        }); //eo query.find
        return deferred;
    }; //eo loadStudents
    var deleteStudent = function(studentId, selectedStudentIdArrayCopy) {
        var i = userStudentIdFromRelationArray.indexOf(studentId);
        var o = userOrganizationGroupRelation[i];
        //Delete locally
        selectedStudentIdArray.splice(selectedStudentIdArray.indexOf(studentId), 1);
        userStudentIdFromRelationArray.splice(i, 1);
        userOrganizationGroupRelation.splice(i, 1);
        //Delete on Parse
        //ToDo: Test this part!!!
        if (o) {
            var groupId = o.get("organizationGroupId");
            o.destroy({
                success: function(myObject) {
                    var deleteFromLists = function(arr) {
                        var promises = [];
                        deferred = deleteStudentFromOrganizationGroup(groupId, studentId);
                        promises.push(deferred);
                        deferred = deleteStudentFromCustomList(groupId, studentId, arr);
                        promises.push(deferred);
                        deferred = deleteUserEventRelations(groupId, studentId, arr);
                        promises.push(deferred);
                        deferred = deleteUserHomeworkRelations(groupId, studentId, arr);
                        promises.push(deferred);
                        deferred = deleteUserMessageRelations(groupId, studentId, arr);
                        promises.push(deferred);
                        $.when.apply($,promises).then(function() {
                            console.log("Successfully remove student from a group: " + groupId);
                        });
                    }; //eo deleteFromLists
                    selectedStudentIdArrayCopy ? deleteFromLists(selectedStudentIdArrayCopy) : deleteFromLists(null);
                    // The object was deleted from the Parse Cloud.
                },
                error: error
            });
        }
    }; //eo deleteStudent
    var deleteStudentFromOrganizationGroup = function(groupId, studentId) { //delete student from studentIdList array in OrganizationGroup
        var OrganizationGroup = Parse.Object.extend("OrganizationGroup", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = OrganizationGroup.query();
        var deferred = $.Deferred();
        query.equalTo("objectId", groupId);
        query.find({
            success: function(results) {
                var group = results[0];
                var studentIdList = group.get("studentIdList");
                var index = studentIdList.indexOf(studentId);
                if (index !== -1) {    studentIdList.splice(index, 1);    }
                group.save();
                deferred.resolve();
            },
            error: error
        });
        return deferred;
    }; //eo deleteStudentFromOrganizationGroup
    var deleteStudentFromCustomList = function(groupId, studentId, selectedStudentIdArrayCopy) {
        var UserCustomList = Parse.Object.extend("UserCustomList", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserCustomList.query();
        var deferred = $.Deferred();
        query.equalTo("groupId", groupId);
        query.find({
            success: function(results) {
                var recipientList, recipientArray;
                function deleteFromRecipeintArray(customList) {
                    $.each(recipientArray, function(j, recipient) {
                        var oneChild = function() {
                            var parent = recipient.parent;
                            _deleteParentEmail(parent, customList, selectedOrgGroupId);
                            customList.remove("recipientList", recipient);
                            customList.save();
                            deferred.resolve();
                        }; //eo oneChild
                        var moreChildren = function() {
                            var newList = jQuery.grep(recipient.children, function(n) {    return n != studentId;    });
                            var hasArrayCopy = function() {
                                var allDeletedList = jQuery.grep(newList, function(n) {    return selectedStudentIdArrayCopy.indexOf(n) == -1    });
                                if (allDeletedList.length === 0) {
                                    var parent = recipient.parent;
                                    _deleteParentEmail(parent, customList, selectedOrgGroupId);
                                    customList.remove("recipientList", recipient);
                                } else {
                                    recipient.children = newList;
                                }
                                customList.save();
                            };
                            var noArrayCopy = function() {
                                recipient.children = newList;
                                customList.save();
                            };
                            selectedStudentIdArrayCopy ? hasArrayCopy() : noArrayCopy();
                            deferred.resolve();
                        }; //eo moreChildren
                        recipient.children.length === 1 ? oneChild(deferred) : moreChildren(deferred);
                    }); //eo each recipientArray
                }; //eo deleteFromRecipeintArray
                $.each(results, function(i, customList) {
                    recipientList = customList.get("recipientList");
                    recipientArray = jQuery.grep(recipientList, function(n) {
                        return n.children.indexOf(studentId) != -1;
                    });
                    deleteFromRecipeintArray(customList);
                });
            }, //eo success
            error: error
        });
        return deferred;
    }; //eo deleteStudentFromCustomList
    var deleteUserEventRelations = function(groupId, studentId, selectedStudentIdArrayCopy) {
        var UserEventRelation = Parse.Object.extend("UserEventRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserEventRelation.query();
        var selectedStudentIdArrayCopy = selectedStudentIdArrayCopy ? selectedStudentIdArrayCopy : [];
        var deferred = $.Deferred();
        query.equalTo("childIdList", studentId);
        query.equalTo("groupId", groupId);
        query.find({
            success: function(results) {
                $.each(results, function(i, relation){
                    var childIdList = relation.get("childIdList");
                    var allDeletedList = jQuery.grep(childIdList, function(n) {
                        return selectedStudentIdArrayCopy.indexOf(n) != -1
                    });
                    if (childIdList.length == 1 || allDeletedList.length === childIdList.length) {
                        relation.destroy();
                    } else {
                        relation.remove("childIdList", studentId);
                        relation.save();
                    }
                }); //eo .each results
                deferred.resolve();
            },
            error: error
        });
        return deferred;
    }; //eo deleteUserEventRelations
    var deleteUserHomeworkRelations = function(groupId, studentId, selectedStudentIdArrayCopy) {
        var UserHomeworkRelation = Parse.Object.extend("UserHomeworkRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserHomeworkRelation.query();
        var selectedStudentIdArrayCopy = selectedStudentIdArrayCopy ? selectedStudentIdArrayCopy : [];
        var deferred = $.Deferred();
        query.equalTo("childIdList", studentId);
        query.equalTo("groupId", groupId);
        query.find({
            success: function(results) {
                $.each(results, function(i, relation){
                    var childIdList = relation.get("childIdList");
                    var allDeletedList = jQuery.grep(childIdList, function(n) {
                        return selectedStudentIdArrayCopy.indexOf(n) != -1
                    });
                    if (childIdList.length == 1 || allDeletedList.length == childIdList.length) {
                        relation.destroy();
                    } else {
                        relation.remove("childIdList", studentId);
                        relation.save();
                    }
                }); //eo .each results
                deferred.resolve();
            },
            error: error
        });
        return deferred;
    }; //eo deleteUserHomeworkRelations

    var deleteUserMessageRelations = function(groupId, studentId, selectedStudentIdArrayCopy) {
        var UserMessageRelation = Parse.Object.extend("UserMessageRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserMessageRelation.query();
        var selectedStudentIdArrayCopy = selectedStudentIdArrayCopy ? selectedStudentIdArrayCopy : [];
        query.equalTo("childIdList", studentId);
        query.equalTo("groupId", groupId);
        query.find({
            success: function(results) {
                $.each(results, function(i, relation){
                    var childIdList = relation.get("childIdList");
                    var allDeletedList = jQuery.grep(childIdList, function(n) {
                        return selectedStudentIdArrayCopy.indexOf(n) != -1
                    });
                    if (childIdList.length == 1 || allDeletedList.length == childIdList.length) {
                        relation.destroy();
                    } else {
                        relation.remove("childIdList", studentId);
                        relation.save();
                    }
                }); //eo .each results
            },
            error: error
        });
    }; //eo deleteUserMessageRelations

    var initEvents = function() {
        $(".text-left").off("click");
        $(".delete").off("click");
        $(".text-left").on("click", function(e) {
            var that = $(this); //must be first to flow through
            var parent = that.parent(); //watch the ordering here!
            var studentId = parent.attr("id"); //student's id = Kid's id
            var index = selectedStudentIdArray.indexOf(studentId);
            var div = parent.children().children().children().eq(0);
            var enableDelete = function() {
                selectedStudentIdArray.push(studentId);
                div.removeClass("icon-fontello-circle");
                div.removeClass("icon-grey");
                div.addClass("icon-fontello-ok-circled");
                div.addClass("icon-red");
                parent.children().eq(1).removeClass("hidden");
            };
            var disableDelete = function() {
                selectedStudentIdArray.splice(index, 1);
                div.addClass("icon-fontello-circle");
                div.addClass("icon-grey");
                div.removeClass("icon-fontello-ok-circled");
                div.removeClass("icon-red");
                parent.children().eq(1).addClass("hidden");
            };
            index === -1 ? enableDelete() : disableDelete();
        }); //eo text-left click
        $(".delete").on("click", function(e) {
            var studentId = $(this).parent().attr("id");
            var defer = _confirm("Do you want to delete " + $(this).parent().children().eq(0).children().eq(1).html() + " ?");
            defer.done(function() { //use .done instead of .then because we only have a resolve case
                $(this).parent().animate({
                    "opacity": 0
                }, 1000, function() {
                    $(this).remove();
                });
                $('#'+studentId).addClass("hidden");
                deleteStudent(studentId);
            });
        });
    }; //eo initEvents
    var initSearch = function() {
        var doSearch = function() {
            var targetStudentDataArray = [];
            var str = $("#searchTxt").val().toLowerCase();
            //Find matches
            $.each(studentNameArray, function(i, name) {
                var index = name.toLowerCase().indexOf(str);
                //console.log(name.toLowerCase() + "   " + str)
                index === -1 ? $.noop() : targetStudentDataArray.push(studentDataArray[i]);
            });
            //Reset selected students for deletion
            //selectedStudentIdArray = [];
            //Display search results
            $("#content").empty();
            $.each(targetStudentDataArray, function(i, child) {
                var append = function(cls) {
                    $("#content").append('<div id="'
                        + child.id
                        + '" class="menu-item"><div class="text-left" style="width:74%;"><div class="circle-icon-wrapper"><i class="icon-fontello-ok-circled '
                        +cls
                        +'"></i></div> <span>'
                        + child.get("firstName") + " " + child.get("lastName")
                        + '</span></div><div class="delete hidden">Delete</div></div>');
                };
                selectedStudentIdArray.indexOf(child.id) != -1 ? append('icon-red') : append('icon-grey');
            });
            //ToDo init events
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
                case 13: // Enter
                case 37: // Left
                case 38: // Up
                case 39: // Right
                case 40: // Down
                    doSearch();
                break;
                default:
                    doSearch();
            } //eo switch
        }); //eo searchTxt keyup
        $("#searchBtn").on('click', function() {    doSearch();    }); //searchBtn click
    }; //eo initSearch
    var initDoneBtn = function() {
        $("#doneBtn").on("click", function(e) {
            var hasSelected = function() {
                var studentId = $(this).parent().attr("id");
                var defer = _confirm("Do you want to delete these students?");
                defer.done(function(){
                    //Delete selected students
                    var selectedStudentIdArrayCopy = selectedStudentIdArray.slice();
                    $.each(selectedStudentIdArrayCopy, function(i, studentId) {
                        deleteStudent(studentId, selectedStudentIdArrayCopy);
                    });
                    setTimeout(function() { redirect(); }, 1000);
                }); //eo defer
            };
            selectedStudentIdArray.length > 0 ? hasSelected() : redirect();
        }); //eo doneBtn click
    }; //eo initDoneBtn
    var addedToDOM = function() {
        initData();
        loadStudents()
        .then(function() {
            $(".upper-area").removeClass("hidden");
            $(".lower-area").removeClass("hidden");
            initEvents();
            initSearch();
            initButtons();
            initDoneBtn();
        });

    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: 'setting-organizations-groups-detail-students-view',
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
