define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-organizations-detail-students-view.hbs',
    'jquery',
    'spinner',
    'parse'
], function(Chaplin, View, Template, $, midSpinner, Parse) {
    'use strict';

    var user;
    var spinner = null;
    var selectedStudentIdArray;
    var userStudentIdFromRelationArray;
    var userOrganizationRelation;
    var studentIdArray;
    var studentId;
    var studentDataArray;
    var studentNameArray;
    var selectedOrgId;

    var initData = function() {
        user = JSON.parse(localStorage.getItem("user"));
        selectedOrgId = user.setting.selectedOrgId;

        selectedStudentIdArray = [];
        userStudentIdFromRelationArray = [];
        studentIdArray = [];
        studentNameArray = [];
    }

    /*var checkPermissons = function() {
        if (user.isAdmin || user.setting.permissonOfSelectedOrg == "faculty" || user.setting.permissonOfSelectedOrg == "admin") {
            $("#addNewStaffBtn").removeClass("hidden");
        }
    }*/

    var loadStudents = function() {
        var spinner = _createSpinner('spinner');

        //Load relations
        var UserOrganizationRelation = Parse.Object.extend("UserOrganizationRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserOrganizationRelation.query();
        query.equalTo("organizationId", selectedOrgId);
        query.equalTo("relation", "student");

        query.find({
            success: function(results) {
                userOrganizationRelation = results;
                //Save data for use in M8
                user.setting.selectedOrgGroupStudentRelationData = results;
                localStorage.setItem("user", JSON.stringify(user));
                if (results.length == 0) {
                    $("#content").html('<div class="results-not-found">No student found in this organization</div>');
                    $(".upper-area").removeClass("hidden");
                    $(".lower-area").removeClass("hidden");
                    $("#doneBtn").removeClass("hidden");
                    spinner.stop();
                } else {
                    var childIdArray = [];
                    for (var i = 0; i < results.length; i++) {
                        var relation = results[i];
                        childIdArray.push(relation.get("userId"))
                        userStudentIdFromRelationArray.push(relation.get("userId")); //For deleteing student-orgGroup relation
                    }

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
                                for (var i = 0; i < results.length; i++) {
                                    var child = results[i];
                                    $("#content").append('<div id="' + child.id + '" class="menu-item">   \
                                        <div class="text-left" style="width:74%;"><div class="circle-icon-wrapper"><i class="icon-fontello-circle icon-grey"></i></div> <span>' + child.get("firstName") + " " + child.get("lastName") + '</span></div> \
                                        <div class="delete hidden">Delete</div>    \
                                    </div>');
                                    studentIdArray.push(child.id);
                                    studentNameArray.push(child.get("firstName") + " " + child.get("lastName"));
                                }
                                //ToDo init events
                                initEvents();
                                initDoneBtn();
                            }
                            $(".upper-area").removeClass("hidden");
                            $(".lower-area").removeClass("hidden");
                            $("#doneBtn").removeClass("hidden");
                            spinner.stop();
                        },
                        error: function(error) {
                            spinner.stop();
                            //Todo: show error message
                            console.log(error);
                        }
                    }); //eo query.find
                } //eo else results.length
            }, //eo success
            error: function(error) {
                //Todo: show error message
                console.log(error);
                spinner.stop();
            }
        }); //eo query.find
    }; //eo loadStudents

    var initEvents = function() {
        $(".text-left").off("click");
        $(".delete").off("click");
        $(".text-left").on("click", function(e) {
            var that = $(this);
            var parent = that.parent();
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
            defer.done(function() {
                var obj = $(this);
                obj.parent().animate({
                    "opacity": 0
                }, 1000, function() {
                    obj.parent().remove();
                });
                var OrganizationGroup = Parse.Object.extend("OrganizationGroup", {}, {
                  query: function(){
                    return new Parse.Query(this.className);
                  }
                });
                    var query = OrganizationGroup.query();
                    query.equalTo("organizationId", selectedOrgId);
                    query.find({
                        success: function(results) {
                            var groupIdArray = [];
                            for (var i = 0; i < results.length; i++) {
                                var group = results[i];
                                groupIdArray.push(group.id);
                            }
                            deleteStudent(studentId);
                            deleteStudentFromCustomListSingle(groupIdArray, studentId);
                            deleteUserOrganizationGroupRelationSingle(groupIdArray, studentId);
                            deleteUserEventRelations(selectedOrgId, studentId);
                            deleteUserHomeworkRelations(selectedOrgId, studentId);
                            deleteUserMessageRelations(selectedOrgId, studentId);
                            group.remove("studentIdList", studentId);
                            group.save();
                        },
                        error: function(error) {
                            //Todo: show error message
                            console.log(error);
                            redirect();
                        }
                    }); //eo query.find
            }); //eo defer
        }); //eo delete click
    }; //eo initEvents

    var deleteStudent = function(studentId) {
        var index = userStudentIdFromRelationArray.indexOf(studentId);
        var object = userOrganizationRelation[index];
        //Delete UserOrganizationRelation locally
        selectedStudentIdArray.splice(selectedStudentIdArray.indexOf(studentId), 1);
        userStudentIdFromRelationArray.splice(index, 1);
        userOrganizationRelation.splice(index, 1);
        //Delete UserOrganizationRelation object on Parse
        //ToDo: Test this part!!!
        if (object) {
            object.destroy();
        }
    }; //eo deleteStudent

    var deleteStudentFromCustomListSingle = function(groupIdArray, studentId) {
        var UserCustomList = Parse.Object.extend("UserCustomList", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserCustomList.query();
        query.containedIn("groupId", groupIdArray);
        query.find({
            success: function(results) {
                for (var i = 0; i < results.length; i++) {
                    var customList = results[i];
                    var recipientList = customList.get("recipientList");
                    var recipientArray = jQuery.grep(recipientList, function(n) {
                        return n.children.indexOf(studentId) != -1;
                    });
                    for (var j = 0; j < recipientArray.length; j++) {
                        var recipient = recipientArray[j];
                        if (recipient.children.length == 1) {
                            var parent = recipient.parent;
                            deleteFromUserContactEmail(parent, customList);
                            customList.remove("recipientList", recipient);
                            customList.save();
                        } else {
                            var newList = jQuery.grep(recipient.children, function(n) {
                                return n != studentId;
                            });
                            recipient.children = newList;
                            customList.save();
                        }
                    }
                }
            },
            error: function(error) {
                console.log(error);
                redirect();
            }
        }); //eo query.find
    }; //eo deleteStudentFromCustomListSingle

    var deleteFromUserContactEmail = function(parent, customList) {
        var query = new Parse.Query(Parse.User);
        query.equalTo("objectId", parent);
        query.find({
            success: function(results) {
                var parentUser = results[0];
                var parentEmail = parentUser.get("email");
                customList.remove("userContactEmail", parentEmail);
                customList.save();
            },
            error: function(error) {
                console.log('Error: '+JSON.stringify(error));
            }
        });
    }; //eo deleteFromUserContactEmail

    var deleteUserOrganizationGroupRelationSingle = function(groupIdArray, studentId) {
        //Delete UserOrganizationGroupRelation
        var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserOrganizationGroupRelation.query();
        query.equalTo("userId", studentId);
        query.containedIn("organizationGroupId", groupIdArray);
        query.find({
            success: function(results) {
                for (var i = 0; i < results.length; i++) {
                    var object = results[i];
                    object.destroy();
                }
                redirect();
            },
            error: function(error) {
                //Todo: show error message
                console.log(error);
                redirect();
            }
        }); //eo query.find
    }; //eo deleteUserOrganizationGroupRelationSingle

    var deleteUserEventRelations = function(organizationId, studentId, selectedStudentIdArrayCopy) {
        var UserEventRelation = Parse.Object.extend("UserEventRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserEventRelation.query();
        var selectedStudentIdArrayCopy = selectedStudentIdArrayCopy ? selectedStudentIdArrayCopy : [];
        query.equalTo("childIdList", studentId);
        query.equalTo("organizationId", organizationId);
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
            error: function(error) {
                console.log('Error: '+JSON.stringify(error));
            }
        });
    }; //eo deleteUserEventRelations

    var deleteUserHomeworkRelations = function(organizationId, studentId, selectedStudentIdArrayCopy) {
        var UserHomeworkRelation = Parse.Object.extend("UserHomeworkRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserHomeworkRelation.query();
        var selectedStudentIdArrayCopy = selectedStudentIdArrayCopy ? selectedStudentIdArrayCopy : [];
        query.equalTo("childIdList", studentId);
        query.equalTo("organizationId", organizationId);
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
            error: function(error) {
                console.log('Error: '+JSON.stringify(error));
            }
        });
    }; //eo deleteUserHomeworkRelations

    var deleteUserMessageRelations = function(organizationId, studentId, selectedStudentIdArrayCopy) {
        var UserMessageRelation = Parse.Object.extend("UserMessageRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserMessageRelation.query();
        var selectedStudentIdArrayCopy = selectedStudentIdArrayCopy ? selectedStudentIdArrayCopy : [];
        query.equalTo("childIdList", studentId);
        query.equalTo("organizationId", organizationId);
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
            error: function(error) {
                console.log('Error: '+JSON.stringify(error));
            }
        });
    }; //eo deleteUserMessageRelations

    var initSearch = function() {
        var doSearch = function() {
            var targetStudentDataArray = [];
            var str = $("#searchTxt").val().toLowerCase();
            //Find matches
            for (var i = 0; i < studentNameArray.length; i++) {
                var name = studentNameArray[i];
                var index = name.toLowerCase().indexOf(str);
                //console.log(name.toLowerCase() + "   " + str)
                if (index != -1) {
                    targetStudentDataArray.push(studentDataArray[i]);
                }
            }
            //Reset selected students for deletion
            //selectedStudentIdArray = [];
            //Display search results
            $("#content").empty();
            for (var i = 0; i < targetStudentDataArray.length; i++) {
                var child = targetStudentDataArray[i];
                if (selectedStudentIdArray.indexOf(child.id) != -1) {
                    $("#content").append('<div id="' + child.id + '" class="menu-item">   \
                        <div class="text-left" style="width:74%;"><div class="circle-icon-wrapper"><i class="icon-fontello-ok-circled icon-red"></i></div> <span>' + child.get("firstName") + " " + child.get("lastName") + '</span></div> \
                        <div class="delete hidden">Delete</div>    \
                    </div>');
                } else {
                    $("#content").append('<div id="' + child.id + '" class="menu-item">   \
                        <div class="text-left" style="width:74%;"><div class="circle-icon-wrapper"><i class="icon-fontello-circle icon-grey"></i></div> <span>' + child.get("firstName") + " " + child.get("lastName") + '</span></div> \
                        <div class="delete hidden">Delete</div>    \
                    </div>');
                } //eo else
            } //eo for
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
        }); //eo keyup

        $("#searchBtn").on('click', function() {
            doSearch();
        });
    }; //eo initSearch

    var initDoneBtn = function() {

        $("#doneBtn").on("click", function(e) {
            if (selectedStudentIdArray.length == 0) {
                redirect();
            } else {
                var studentId = $(this).parent().attr("id");
                var defer = _confirm("Do you want to delete?");
                defer.done(function() {
                    midSpinner.show();

                    //Get list of group that belong to the selected organization
                    var OrganizationGroup = Parse.Object.extend("OrganizationGroup", {}, {
                      query: function(){
                        return new Parse.Query(this.className);
                      }
                    });
                    var query = OrganizationGroup.query();
                    query.equalTo("organizationId", selectedOrgId);
                    query.find({
                        success: function(results) {
                            var groupIdArray = [];
                            for (var i = 0; i < results.length; i++) {
                                var group = results[i];
                                groupIdArray.push(group.id);
                                for (var j = 0; j < selectedStudentIdArray.length; j++) {
                                    var student = selectedStudentIdArray[j];
                                    group.remove("studentIdList", student);
                                    group.save();
                                }
                            }
                            deleteUserOrganizationGroupRelation(groupIdArray);
                            //Delete selected students
                            var numSelectedStudents = selectedStudentIdArray.length;
                            var selectedStudentIdArrayCopy = selectedStudentIdArray.slice();
                            for (var i = 0; i < numSelectedStudents; i++) {
                                var studentId = selectedStudentIdArrayCopy[i];
                                deleteStudentFromCustomList(groupIdArray, studentId, selectedStudentIdArrayCopy);
                                deleteStudent(studentId);
                                deleteUserEventRelations(selectedOrgId, studentId, selectedStudentIdArrayCopy);
                                deleteUserHomeworkRelations(selectedOrgId, studentId, selectedStudentIdArrayCopy);
                                deleteUserMessageRelations(selectedOrgId, studentId, selectedStudentIdArrayCopy);
                            }
                        },
                        error: function(error) {
                            //Todo: show error message
                            console.log(error);
                            redirect();
                        }
                    }); //eo query.find

                    var deleteStudentFromCustomList = function(groupIdArray, studentId, selectedStudentIdArrayCopy) {
                        var UserCustomList = Parse.Object.extend("UserCustomList", {}, {
                          query: function(){
                            return new Parse.Query(this.className);
                          }
                        });
                        var query = UserCustomList.query();
                        query.containedIn("groupId", groupIdArray);
                        query.find({
                            success: function(results) {
                                for (var i = 0; i < results.length; i++) {
                                    var customList = results[i];
                                    var recipientList = customList.get("recipientList");
                                    var recipientArray = jQuery.grep(recipientList, function(n) {
                                        return n.children.indexOf(studentId) != -1;
                                    });
                                    for (var j = 0; j < recipientArray.length; j++) {
                                        var recipient = recipientArray[j];
                                        if (recipient.children.length == 1) {
                                            var parent = recipient.parent;
                                            deleteFromUserContactEmail(parent, customList);
                                            customList.remove("recipientList", recipient);
                                            customList.save();
                                        } else {
                                            var newList = jQuery.grep(recipient.children, function(n) {
                                                return n != studentId;
                                            });
                                            var allDeletedList = jQuery.grep(newList, function(n) {
                                                return selectedStudentIdArrayCopy.indexOf(n) == -1
                                            });
                                            if (allDeletedList.length == 0) {
                                                var parent = recipient.parent;
                                                deleteFromUserContactEmail(parent, customList);
                                                customList.remove("recipientList", recipient);
                                            } else {
                                                recipient.children = newList;
                                            }
                                            customList.save();
                                        }
                                    }
                                }
                            },
                            error: function(error) {
                                console.log(error);
                                redirect();
                            }
                        }); //eo query.find
                    }; //eo deleteStudentFromCustomList

                    var deleteFromUserContactEmail = function(parent, customList) {
                        var query = new Parse.Query(Parse.User);
                        query.equalTo("objectId", parent);
                        query.find({
                            success: function(results) {
                                var parentUser = results[0];
                                var parentEmail = parentUser.get("email");
                                customList.remove("userContactEmail", parentEmail);
                                customList.save();
                            },
                            error: function(error) {
                                console.log('Error: '+JSON.stringify(error));
                            }
                        });
                    }; //eo deleteFromUserContactEmail

                    var deleteUserOrganizationGroupRelation = function(groupIdArray) {
                        //Delete UserOrganizationGroupRelation
                        var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation", {}, {
                          query: function(){
                            return new Parse.Query(this.className);
                          }
                        });
                        var query = UserOrganizationGroupRelation.query();
                        query.containedIn("userId", selectedStudentIdArray);
                        query.containedIn("organizationGroupId", groupIdArray);

                        query.find({
                            success: function(results) {
                                for (var i = 0; i < results.length; i++) {
                                    var object = results[i];
                                    object.destroy();
                                }
                                redirect();
                            },
                            error: function(error) {
                                //Todo: show error message
                                console.log(error);
                                redirect();
                            }
                        }); //eo query.find
                    }; //eo deleteUserOrganizationGroupRelation
                }); //eo defer.done
            } //eo else
        }); //eo doneBtn click
    }; //eo initDoneBtn

    var redirect = function() {
        midSpinner.hide();
        //Redirect back to previous page
        Chaplin.utils.redirectTo({
            name: 'setting-organizations-detail'
        });
    }; //eo redirect

    var initButtons = function() {
        //Init buttons
        $("#addStudentBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-organizations-detail-students-add'
            });
        });
        $("#cancelBtn").on('click', function(e) {
            redirect();
        });
    }; //eo initButtons

    var addedToDOM = function() {
        initData();
        initEvents();
        loadStudents();
        initSearch();
        initButtons();
    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: 'setting-organizations-detail-students-view',
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
