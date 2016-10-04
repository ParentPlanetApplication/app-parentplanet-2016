define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-mygroups-detail-contacts-view.hbs',
    'jquery',
    'spinner',
    'parse'
], function(Chaplin, View, Template, $, spinner, Parse) {
    'use strict';

    var selectedStudentIdArray;
    var userStudentIdFromRelationArray;
    var userOrganizationGroupRelation;
    var studentIdArray;
    var studentDataArray;
    var studentNameArray;
    var user;
    var selectedMyGroupId;
    var selectedMyGroupData;
    var nonUserContactEmail;
    var userContacts;
    var contactNameArray;
    var userNameArray;
    var selectedContactIdArray;
    var redirect = function() {
        spinner.hide();
        setTimeout(function() { //Redirect back to previous page
            Chaplin.utils.redirectTo({    name: 'setting-mygroups-detail'    });  },
        DEFAULT_ANIMATION_DELAY);
    };
    var initData = function() {
        selectedStudentIdArray = [];
        userStudentIdFromRelationArray = [];
        studentIdArray = [];
        studentNameArray = [];
        user = JSON.parse(localStorage.getItem("user"));
        selectedMyGroupId = user.setting.selectedMyGroupId;
        selectedMyGroupData = user.setting.selectedMyGroupData;
        nonUserContactEmail = selectedMyGroupData.nonUserContactEmail; //Array
        userContacts = []; //If we do not init data here, Chaplin will assign previous data of this var instead
        contactNameArray = [];
        userNameArray = [];
        selectedContactIdArray = [];
    }; //eo initData
    var initButtons = function() {
        //Init buttons
        $("#backBtn").on('click', function(e) {    redirect();    });
        //add student
        $("#addContactBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({    name: 'setting-mygroups-detail-contacts-add'    });
        });
    }; //eo initButtons
    var compareStrings = function(a, b) {
        // Assuming you want case-insensitive comparison
        a = a.toLowerCase();
        b = b.toLowerCase();
        return (a < b) ? -1 : (a > b) ? 1 : 0;
    }; //eo compareStrings

    var loadContacts = function() {
        spinner.show();
        if (selectedMyGroupData.userContactId) {
            if (selectedMyGroupData.userContactId.length > 0) {
                var query = new Parse.Query(Parse.User);
                query.containedIn("objectId", selectedMyGroupData.userContactId); //Array
                query.find({
                    success: function(results) {
                        userContacts = results;
                        loadStudents();
                    },
                    error: function(error) {
                        //Todo: show error message
                        console.log(error);
                        spinner.hide();
                    }
                }); //eo query.find
            } else {
                loadAllUserContacts();
            }
        } else {
            loadAllUserContacts();
        }
    }; //eo loadContacts

    var loadStudents = function() {
        var Child = Parse.Object.extend("Child", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = Child.query();
        query.containedIn("objectId", selectedMyGroupData.studentIdList); //Array
        query.find({
            success: function(results) {
                userContacts = userContacts.concat(results); //Load non-user contacts
                loadAllUserContacts();
                spinner.hide();
            },
            error: function(error) {
                //Todo: show error message
                console.log(error);
                loadAllUserContacts();
            }
        }); //eo query.find
    }; //eo loadStudents

    var addContent = function(id, s) {
        $("#content").append('<div id="'
            + id
            + '" class="menu-item"><div class="text-left" style="width:74%;"><div class="circle-icon-wrapper"><i class="icon-fontello-circle icon-grey"></i></div> <span>'
            + s
            + '</span></div><div class="delete hidden">Delete</div></div>'
        ); //eo #content append
    }; //eo addContent

    //Load non-user contacts
    var loadAllUserContacts = function() {
        //ToDo
        //1. Display user contact results
        if (userContacts.length > 0) {
            $.each(userContacts, function(i, contact) {
                var fullname = contact.get("firstName") + " " + contact.get("lastName");
                addContent(contact.id, fullname);
                 userNameArray.push(fullname);
                contactNameArray.push(fullname);
            });
        } else {
            $("#content").html('<div class="results-not-found">No members found in this group</div>');
        }
        //2. Display non-user contact emails
        if (nonUserContactEmail && nonUserContactEmail.length > 0) {
            $.each(nonUserContactEmail, function(i, email) {
                addContent(email, email);
                contactNameArray.push(email);
            });
        }
        //2. Init Search
        initSearch();
        //3. Enit delete
        initEvents();
        //4. Init Done
        initDoneBtn(); //Init once!
        //5. Display results
        $(".upper-area").removeClass("hidden");
        $(".lower-area").removeClass("hidden");
        spinner.hide();
    }; //eo loadAllUserContacts

    var initSearch = function() {
        var doSearch = function() {
            var targetContactArray = [];
            var str = $("#searchTxt").val().toLowerCase();
            //Find matches
            $.each(contactNameArray, function(i, name) {
                var index = name.toLowerCase().indexOf(str);
                index === -1 ? $.noop() : targetContactArray.push(name);
            });
            //Reset selected students for deletion
            //selectedStudentIdArray = [];
            //Display search results
            $("#content").empty();
            $.each(targetContactArray, function(i, name) {
                if (!_validateEmail(name)) {
                    var index = userNameArray.indexOf(name);
                    var contact = userContacts[index];
                    var fullname = contact.get("firstName") + " " + contact.get("lastName");
                    addContent(contact.id, fullname);
                } else {
                    addContent(name, name);
                }
            });
            initEvents();
        }; //eo doSearch

        $("#searchTxt").keyup(function(e) {
            var str;
            switch (e.keyCode) {
                case 8: // Backspace
                    str = $("#searchTxt").val().toLowerCase();
                    $("#searchTxt").val(str.substring(0, str.length));
                    doSearch();
                break;
                case 9: doSearch(); break; // Tab
                case 13: doSearch(); break; // Enter
                case 37: doSearch(); break; // Left
                case 38: doSearch(); break; // Up
                case 39: doSearch(); break; // Right
                case 40: doSearch(); break; // Down
                default:
                    doSearch();
            } //eo switch
        }); //eo searchTxt keyup
        $("#searchBtn").on('click', function() {    doSearch();    }); //searchBtn click
    }; //eo initSearch

    var initEvents = function() {
        $(".text-left").off("click");
        $(".delete").off("click");
        $(".text-left").on("click", function(e) {
            var id = $(this).parent().attr("id"); //student's id = Kid's id
            var index = selectedContactIdArray.indexOf(id);
            var div = $(this).parent().children().children().children().eq(0);
            var deleteBtn = $(this).parent().children().eq(1);
            var noSelectedContactId = function() {
                selectedContactIdArray.push(id);
                div.removeClass("icon-fontello-circle");
                div.removeClass("icon-grey");
                div.addClass("icon-fontello-ok-circled");
                div.addClass("icon-red");
                deleteBtn.removeClass("hidden");
            };
            var hasSelectedContactId = function() {
                selectedContactIdArray.splice(index, 1);
                div.addClass("icon-fontello-circle");
                div.addClass("icon-grey");
                div.removeClass("icon-fontello-ok-circled");
                div.removeClass("icon-red");
                deleteBtn.addClass("hidden");
            };
            index < 0 ? noSelectedContactId() : hasSelectedContactId();
        }); //eo text-left click

        $(".delete").on("click", function(e) {
            var studentId = $(this).parent().attr("id");
            var defer = _confirm("Do you want to delete " + $(this).parent().children().eq(0).children().eq(1).html() + " ?");
            defer.done(function() { //use .done instead of .then because we only have a resolve case
                $(this).parent().animate({    "opacity": 0    }, 1000, function() {
                    $(this).parent().remove();
                });
                $('#'+studentId).addClass("hidden");
                deleteStudent(studentId);
            });
        });
    }; //eo initEvents

    var initDoneBtn = function() {
        $("#doneBtn").on("click", function(e) {
            if (selectedContactIdArray.length === 0) {
                redirect();
            } else {
                var studentId = $(this).parent().attr("id");
                var defer = _confirm("Do you want to delete these members?");
                defer.done(function(){
                    //Delete selected students
                    var selectedContactIdArrayCopy = selectedContactIdArray.slice();
                    $.each(selectedContactIdArrayCopy, function(i, studentId) {
                        deleteStudent(studentId, selectedContactIdArrayCopy);
                    });
                    redirect();
                }); //eo defer
            } //eo else
        }); //eo doneBtn click
    }; //eo initDoneBtn

    var deleteStudent = function(studentId, selectedContactIdArrayCopy) {
        //Delete locally to debug still
        return;
        selectedContactIdArray.splice(selectedContactIdArray.indexOf(studentId), 1);
        var userContactId = selectedMyGroupData.userContactId;
        var index = userContactId.indexOf(studentId);
        userContactId.splice(index, 1);
        user.setting.selectedMyGroupData.userContactId = userContactId;
        localStorage.setItem("user", JSON.stringify(user));
        deleteStudentFromCustomGroup(selectedMyGroupId, studentId);
        deleteStudentFromOrgGroup(selectedMyGroupId, studentId);
        deleteUserOrgGroupRelation(selectedMyGroupId, studentId);
        if (selectedContactIdArrayCopy) {
            deleteStudentFromCustomList(selectedMyGroupId, studentId, selectedContactIdArrayCopy);
            deleteUserEventRelations(selectedMyGroupId, studentId, selectedContactIdArrayCopy);
            deleteUserHomeworkRelations(selectedMyGroupId, studentId, selectedContactIdArrayCopy);
            deleteUserMessageRelations(selectedMyGroupId, studentId, selectedContactIdArrayCopy);
        } else {
            deleteStudentFromCustomList(selectedMyGroupId, studentId);
            deleteUserEventRelations(selectedMyGroupId, studentId);
            deleteUserHomeworkRelations(selectedMyGroupId, studentId);
            deleteUserMessageRelations(selectedMyGroupId, studentId);
        }
    }; //eo deleteStudent

    var deleteStudentFromCustomGroup = function(selectedMyGroupId, studentId) { //delete student from studentIdList array in OrganizationGroup
        var UserCustomGroup = Parse.Object.extend("UserCustomGroup", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserCustomGroup.query();
        query.equalTo("objectId", selectedMyGroupId);
        query.find({
            success: function(results) {
                var group = results[0];
                group.remove("userContactId", studentId);
                group.save();
            },
            error: function(results) {    console.log('Error: '+error)    }
        });
    }; //eo deleteStudentFromCustomGroup

    var deleteStudentFromOrgGroup = function(selectedMyGroupId, studentId) {
        var OrganizationGroup = Parse.Object.extend("OrganizationGroup", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = OrganizationGroup.query();
        query.equalTo("organizationId", selectedMyGroupId);
        query.find({
            success: function(results) {
                var group = results[0];
                group.remove("studentIdList", studentId);
                group.save();
            },
            error: function(results) {    console.log('Error: '+error)    }
        });
    }; //eo deleteStudentFromOrgGroup

    var deleteUserOrgGroupRelation = function(selectedMyGroupId, studentId) {
        var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserOrganizationGroupRelation.query();
        query.equalTo("organizationGroupId", selectedMyGroupId);
        query.equalTo("userId", studentId);
        query.find({
            success: function(results) {
                var relation = results[0];
                relation.destroy();
            },
            error: function(results) {    console.log('Error: '+error)    }
        });
    }; //eo deleteUserOrgGroupRelation

    var deleteStudentFromCustomList = function(selectedMyGroupId, studentId, selectedContactIdArrayCopy) {
        var UserCustomList = Parse.Object.extend("UserCustomList", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserCustomList.query();
        var success = function(results) {
            $.each(results, function(i, customList) {
                var recipientList = customList.get("recipientList");
                var userRecipientArray;
                var recipientArray = jQuery.grep(recipientList, function(n) {
                    return n.children.indexOf(studentId) !== -1;
                }); //eo recipientArray
                $.each(recipientArray, function(j, recipient) {
                    var parent;
                    var newList;
                    var allDeletedList;
                    var hasChild = function() {
                        parent = recipient.parent;
                        deleteFromUserContactEmail(parent, customList);
                        customList.remove("recipientList", recipient);
                        customList.save();
                    }; //eo hasChild
                    var hasChildren = function() {
                        newList = jQuery.grep(recipient.children, function(n) {    return n != studentId;    });
                        if (!selectedContactIdArrayCopy) {
                            recipient.children = newList;
                            customList.save();
                        } else {
                            allDeletedList = jQuery.grep(newList, function(n) {    return selectedContactIdArrayCopy.indexOf(n) === -1    });
                            if (allDeletedList.length === 0) {
                                parent = recipient.parent;
                                deleteFromUserContactEmail(parent, customList);
                                customList.remove("recipientList", recipient);
                            } else {
                                recipient.children = newList;
                            }
                            customList.save();
                        } //eo else
                    }; //eo hasChildren
                    recipient.children.length === 1 ? hasChild() : hasChildren();
                }); //eo inner each
                userRecipientArray = jQuery.grep(recipientList, function(n) {    return n.parent === studentId;    });
                $.each(userRecipientArray, function(j, recipient) {
                    customList.remove("recipientList", recipient);
                    customList.save();
                    deleteFromUserContactEmail(studentId, customList);
                });
            }); //eo each over results
        }; //eo success
        var error = function(err) {
            console.log('Error: '+err);
        };
        query.equalTo("groupId", selectedMyGroupId);
        query.find({ success: success, error: error    }); //eo query find
    }; //eo deleteStudentFromCustomList

    var deleteFromUserContactEmail = function(parent, customList) {
        var query = new Parse.Query(Parse.User);
        query.equalTo("objectId", parent);
        query.find({
            success: function(results) {
                var parentUser = results[0];
                var parentEmail = parentUser.get("email");
                var UserCustomGroup = Parse.Object.extend("UserCustomGroup");
                var customGroup = new UserCustomGroup();
                var userContactEmail, index;
                customGroup.id = selectedMyGroupId;
                customGroup.remove("userContactEmail", parentEmail);
                customGroup.save();
                customList.remove("userContactEmail", parentEmail);
                customList.save();
                userContactEmail = selectedMyGroupData.userContactEmail;
                index = userContactEmail.indexOf(parentEmail);
                userContactEmail.splice(index, 1);
                user.setting.selectedMyGroupData.userContactEmail = userContactEmail;
                localStorage.setItem("user", JSON.stringify(user));
            },
            error: function(error) {
                console.log('Error: '+JSON.stringify(error));
            }
        });
    }; //eo deleteFromUserContactEmail

    var deleteUserEventRelations = function(groupId, studentId, selectedStudentIdArrayCopy) {
        var UserEventRelation = Parse.Object.extend("UserEventRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserEventRelation.query();
        var selectedStudentIdArrayCopy = selectedStudentIdArrayCopy ? selectedStudentIdArrayCopy : [];
        var success = function(results) {
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
        }; //eo success
        var error = function(error) {
            console.log('Error: '+JSON.stringify(error));
        };
        query.equalTo("childIdList", studentId);
        query.equalTo("groupId", groupId);
        query.find({    success: success, error: error });
    }; //eo deleteUserEventRelations

    var deleteUserHomeworkRelations = function(groupId, studentId, selectedStudentIdArrayCopy) {
        var UserHomeworkRelation = Parse.Object.extend("UserHomeworkRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserHomeworkRelation.query();
        var selectedStudentIdArrayCopy = selectedStudentIdArrayCopy ? selectedStudentIdArrayCopy : [];
        var success = function(results) {
            $.each(results, function(i, relation){
                var childIdList = relation.get("childIdList");
                var allDeletedList = jQuery.grep(childIdList, function(n) {
                    return selectedStudentIdArrayCopy.indexOf(n) !== -1
                });
                if (childIdList.length === 1 || allDeletedList.length === childIdList.length) {
                    relation.destroy();
                } else {
                    relation.remove("childIdList", studentId);
                    relation.save();
                }
            }); //eo .each results
        };
        var error = function(error) {    console.log('Error: '+JSON.stringify(error));    };
        query.equalTo("childIdList", studentId);
        query.equalTo("groupId", groupId);
        query.find({ success:success, error:error  });
    }; //eo deleteUserHomeworkRelations

    var deleteUserMessageRelations = function(groupId, studentId, selectedStudentIdArrayCopy) {
        var UserMessageRelation = Parse.Object.extend("UserMessageRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserMessageRelation.query();
        var selectedStudentIdArrayCopy = selectedStudentIdArrayCopy ? selectedStudentIdArrayCopy : [];
        var success = function(results) {
            $.each(results, function(i, relation){
                var childIdList = relation.get("childIdList");
                var allDeletedList = jQuery.grep(childIdList, function(n) {
                    return selectedStudentIdArrayCopy.indexOf(n) !== -1
                });
                if (childIdList.length === 1 || allDeletedList.length === childIdList.length) {
                    relation.destroy();
                } else {
                    relation.remove("childIdList", studentId);
                    relation.save();
                }
            }); //eo .each results
        }; //eo success
        var error = function(error) {  console.log('Error: '+JSON.stringify(error)); };
        query.equalTo("childIdList", studentId);
        query.equalTo("groupId", groupId);
        query.find({ success:success, error:error });
    }; //eo deleteUserMessageRelations

    var addedToDOM = function() {
        initData();
        initButtons();
        //load just the kids
       // loadContacts();
        loadStudents();
    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: 'setting-mygroups-detail-contacts-view',
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
