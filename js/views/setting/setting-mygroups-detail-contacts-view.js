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
    var setting;
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
        user = _getUserData();
        setting = user.setting;
        selectedMyGroupId = setting.selectedMyGroupId; //from local data store
        selectedMyGroupData = setting.selectedMyGroupData;
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
                var queryUser = new Parse.Query(Parse.User);
                    queryUser.containedIn("objectId", selectedMyGroupData.studentIdList); //Array
                    queryUser.find({
                        success: function(d){

                            $.each(d, function(idx, userItem){
                                if(userItem.attributes.firstName === undefined) {
                                    userItem.attributes.firstName = userItem.attributes.username;
                                }
                                if(userItem.attributes.lastName === undefined) {
                                    userItem.attributes.lastName = '';
                                }
                                userContacts.push(userItem); //Load non-user contacts
                            });

                            loadAllUserContacts();
                            spinner.hide();
                        },
                        error: function(error){
                            spinner.hide();
                            loadAllUserContacts();
                        }
                    });
            },
            error: function(error) {    loadAllUserContacts();    }
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

        $(".delete").on("click", deleteStudent);
    }; //eo initEvents

    var deleteStudent = function(e) {
        var wrapper = $(this).parent();
        var studentId = wrapper.attr("id");
        var student = null;
        var s = "Do you want to delete " + $(this).parent().children().eq(0).children().eq(1).html() + " ?";
        var defer = _confirm(s);
        var creatorParentId = null;
        var creatorParent = null;
        var email = null;
        var deleteFromUserOrganizationGroupRelation = function() { //last one, remove child row from table
            var deferred = $.Deferred();
            var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var query = UserOrganizationGroupRelation.query();
            var error = function(o, error) {
                deferred.reject();
                console.log('Error: '+error)
            };
            query.equalTo("userId", studentId);
            query.equalTo("organizationGroupId", selectedMyGroupId);
            query.find({ //write to Parse
                success: function(results) {
                    var groupRelation = results[0];

                    if(groupRelation != undefined) {
                        groupRelation.destroy({
                            success: function() {    deferred.resolve();    },
                            error: error
                        });
                    }else {
                        deferred.resolve();
                    }

                },
                error: error
            });
            return deferred;
        }; //eo deleteFromUserOrgGroupRelation
        var deleteFromUserCustomList = function() {
            var deferred = $.Deferred();
            var UserCustomGroup = Parse.Object.extend("UserCustomList", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var error = function(o, error) {
                deferred.reject();
                console.log('Error: '+error)
            };
            var isDeleteParentEmail = false;
            var query = UserCustomGroup.query();
            query.equalTo("groupId", selectedMyGroupId);
            query.find({ //write to Parse
                success: function(results) {
                    var group = results[0];
                    var studentIdList = group.get('studentIdList');
                    //var userContactEmail = group.get('userContactEmail');
                    var userContactId = group.get('userContactId');
                    var recipientList = group.get('recipientList');
                    var _recipientList = []; //new recipientList after deletions
                    studentIdList = studentIdList ? studentIdList : [];
                    //userContactEmail = userContactEmail ? userContactEmail : [];
                    userContactId = userContactId ? userContactId : [];
                    recipientList = recipientList ? recipientList : [];
                    studentIdList = $.grep(studentIdList, function(item,i){    return item !== studentId;    });
                    userContactId = $.grep(userContactId, function(item,i){    return item !== creatorParentId;    });
                    //userContactEmail = $.grep(userContactEmail, function(item,i){    return item !== email;    });
                    $.each(recipientList, function(i, recipient) { //recipient = [{"children":["9Te6V5QOOL"],"parent":"4YYuJxq3Qx"}] etc.
                        var flag = false;
                        var indexOf = recipient.children.indexOf(studentId); //where is this child?
                        if(recipient.parent !== creatorParentId) { //not matching parent, skip
                            flag = true;
                        } else {
                            if(recipient.children.length === 0) { //no children skip
                                flag = false;
                                _deleteParentEmail(creatorParentId, group, selectedMyGroupId);
                            } else if(indexOf < 0) { //no matching children leave alone
                                flag = true;
                            } else { //remove this child
                                recipient.children.splice(indexOf, 1);

                                if(recipient.children.length) {
                                    flag = true;
                                } else {
                                    flag = false;
                                    isDeleteParentEmail = true;
                                }
                            }
                        }
                        flag ? _recipientList.push(recipient) : $.noop(); //create new array
                    });

                    group.set('studentIdList',studentIdList);
                    //group.set('userContactEmail', userContactEmail);
                    group.set('userContactId', userContactId);
                    group.set('recipientList', _recipientList); //brand new array
                    group.save(null, {
                        success: function () {
                            if(isDeleteParentEmail) {
                                _deleteParentEmail(creatorParentId, group, selectedMyGroupId);
                            }
                            selectedContactIdArray.splice(studentId, 1);
                            deferred.resolve();
                        },
                        error: error
                    });
                },
                error: error
            });
            return deferred;
        }; //eo deleteFromUserCustomList
        var deleteFromSelectedMyGroupData = function() {
            var deferred = $.Deferred();
            var studentIdList = selectedMyGroupData.studentIdList;
            var userContactEmail = selectedMyGroupData.userContactEmail;
            var userContactId = selectedMyGroupData.userContactId;
            var UserCustomGroup = Parse.Object.extend("UserCustomGroup", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var query = UserCustomGroup.query();
            studentIdList = studentIdList ? studentIdList : [];
            userContactEmail = userContactEmail ? userContactEmail : [];
            userContactId = userContactId ? userContactId : [];
            studentIdList = $.grep(studentIdList, function(item,i){    return item !== studentId;    });
            selectedMyGroupData.studentIdList = studentIdList;
            userContactEmail = $.grep(userContactEmail, function(item,i){    return item !== email;    });
            selectedMyGroupData.userContactEmail = userContactEmail;
            userContactId = $.grep(userContactId, function(item,i){    return item !== creatorParentId;    });
            selectedMyGroupData.userContactId = userContactId;
            setting.selectedMyGroupData = selectedMyGroupData; //update local data
            _setUserData(user); //write to localStorage
            query.equalTo("objectId", selectedMyGroupId);
            query.find({ //write to Parse
                success: function(results) {
                    var _selectedMyGroupData = results[0];
                    _selectedMyGroupData.set('studentIdList',studentIdList);
                    _selectedMyGroupData.set('userContactEmail',userContactEmail);
                    _selectedMyGroupData.set('userContactId',userContactId);
                    _selectedMyGroupData.save(null, {
                        success: function() { deferred.resolve(); },
                        error: function() { deferred.reject(); }
                    });
                },
                error: function(o, error) {
                    deferred.reject();
                    console.log('Error: '+error)
                }
            });
            return deferred;
        }; //eo deleteFromSelectedMyGroupData
        var loadCreatorParent = function(o) {
            var deferred = $.Deferred();
            var User = Parse.Object.extend("User", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var query = User.query();
            creatorParentId = o.get('creatorParentId') || o.id;
            query.equalTo("objectId", creatorParentId); //which student selected
            query.find({
                success: function(results) {
                    creatorParent = results.length > 0 ? results[0] : null;
                    email = creatorParent ? creatorParent.get('username') : null; //should this be username or the actual email column?
                    //creatorParent ? deferred.resolve() : deferred.reject();
                    deferred.resolve();
                },
                error: function(error) {    deferred.reject();    }
            }); //eo query.find
            return deferred;
        }; //eo loadCreatorParent
        var loadStudent = function() {
            var deferred = $.Deferred();
            var Child = Parse.Object.extend("Child", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var query = Child.query();
            spinner.show();
            query.equalTo("objectId", studentId); //which student selected
            query.find({
                success: function(results) {
                    student = results.length > 0 ? results[0] : null;
                    if(student === null) {
                        var queryUser = new Parse.Query(Parse.User);
                            queryUser.equalTo("objectId", studentId); //which student selected
                            queryUser.find({
                                success: function(d){
                                    student = d[0];
                                    deferred.resolve(student);
                                },
                                error: function(error){
                                    console.log('Error: ' + error);
                                    deferred.rreject();
                                }
                        });
                    } else {
                        student ? deferred.resolve(student) : deferred.reject();
                    }

                },
                error: function(error) {    deferred.reject();    }
            }); //eo query.find
            return deferred;
        }; //eo loadStudent
        var done = function() {
            spinner.hide();
            wrapper ? wrapper.animate({    "opacity": 0    }, 1000, function() {    wrapper.remove();    }) : $.noop();
        };
        //start delete chain here
        defer
        .then(loadStudent)
        .then(loadCreatorParent)
        .then(deleteFromSelectedMyGroupData)
        .then(deleteFromUserCustomList)
        .then(deleteFromUserOrganizationGroupRelation)
        .then(done);
        /*
        defer.done(function() { //use .done instead of .then because we only have a resolve case
            $(this).parent().animate({    "opacity": 0    }, 1000, function() {
                $(this).parent().remove();
            });
            $('#'+studentId).addClass("hidden");
            deleteStudent0(studentId);
        });
*/
    }; //eo deleteStudent

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
                        deleteStudent0(studentId, selectedContactIdArrayCopy);
                    });
                    redirect();
                }); //eo defer
            } //eo else
        }); //eo doneBtn click
    }; //eo initDoneBtn

    var deleteStudent0 = function(studentId, selectedContactIdArrayCopy) {
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
