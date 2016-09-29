define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-mygroups-detail-contacts-view.hbs',
    'jquery',
    'spinner',
    'parse'
], function(Chaplin, View, Template, $, fullSpinner, Parse) {
    'use strict';

    var spinner = null;
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
    }

    var initButtons = function() {
        //Init buttons
        $("#backBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-mygroups-detail'
            });
        });
        //add student
        $("#addContactBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-mygroups-detail-contacts-add'
            });
        });
    }

    var compareStrings = function(a, b) {
        // Assuming you want case-insensitive comparison
        a = a.toLowerCase();
        b = b.toLowerCase();

        return (a < b) ? -1 : (a > b) ? 1 : 0;
    }

    var loadContacts = function() {
        spinner = _createSpinner('spinner');
        //spinner.show();

        //Load user contacts
        if (selectedMyGroupData.userContactId) {
            //console.log(selectedMyGroupData.userContactId);
            if (selectedMyGroupData.userContactId.length > 0) {
                var query = new Parse.Query(Parse.User);
                query.containedIn("objectId", selectedMyGroupData.userContactId); //Array
                query.find({
                    success: function(results) {
                        userContacts = results;
                        loadStudents();

                        //Load non-user contacts
                        //loadAllUserContacts();
                    },
                    error: function(error) {
                        //Todo: show error message
                        console.log(error);
                        spinner.stop();
                        //loadAllUserContacts();
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
        query.containedIn("objectId", selectedMyGroupData.userContactId); //Array
        query.find({
            success: function(results) {
                userContacts = userContacts.concat(results);

                //Load non-user contacts
                loadAllUserContacts();
            },
            error: function(error) {
                //Todo: show error message
                console.log(error);
                spinner.stop();
                loadAllUserContacts();
            }
        }); //eo query.find
    }; //eo loadStudents

    //Load non-user contacts
    var loadAllUserContacts = function() {
        //ToDo
        //1. Display user contact results
        if (userContacts.length > 0) {

            for (var i = 0; i < userContacts.length; i++) {
                var contact = userContacts[i];
                $("#content").append('<div id="' + contact.id + '" class="menu-item">   \
                        <div class="text-left" style="width:74%;"><div class="circle-icon-wrapper"><i class="icon-fontello-circle icon-grey"></i></div> <span>' + contact.get("firstName") + " " + contact.get("lastName") + '</span></div> \
                        <div class="delete hidden">Delete</div>    \
                    </div>');

                userNameArray.push(contact.get("firstName") + " " + contact.get("lastName"));
                contactNameArray.push(contact.get("firstName") + " " + contact.get("lastName"));
            }
        } else {
            $("#content").html('<div class="results-not-found">No members found in this group</div>');
        }

        //2. Display non-user contact emails
        if (nonUserContactEmail && nonUserContactEmail.length > 0) {

            for (var i = 0; i < nonUserContactEmail.length; i++) {
                var email = nonUserContactEmail[i];
                $("#content").append('<div  id="' + email + '" class="menu-item">   \
                        <div class="text-left" style="width:74%;"><div class="circle-icon-wrapper"><i class="icon-fontello-circle icon-grey"></i></div> <span>' + email + '</span></div> \
                        <div class="delete hidden">Delete</div>    \
                    </div>');

                contactNameArray.push(email);
            }
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
        spinner.stop();
    }

    var initSearch = function() {
        var doSearch = function() {
            var targetContactArray = [];
            var str = $("#searchTxt").val().toLowerCase();
            //Find matches
            for (var i = 0; i < contactNameArray.length; i++) {
                var name = contactNameArray[i];
                var index = name.toLowerCase().indexOf(str);
                //console.log(name.toLowerCase() + "   " + str)
                if (index != -1) {
                    targetContactArray.push(contactNameArray[i]);
                }
            } //eo for

            //Reset selected students for deletion
            //selectedStudentIdArray = [];
            //Display search results
            $("#content").empty();

            for (var i = 0; i < targetContactArray.length; i++) {
                var name = targetContactArray[i];

                if (!_validateEmail(name)) {
                    var index = userNameArray.indexOf(name);
                    var contact = userContacts[index];
                    $("#content").append('<div id="' + contact.id + '" class="menu-item">   \
                        <div class="text-left" style="width:74%;"><div class="circle-icon-wrapper"><i class="icon-fontello-circle icon-grey"></i></div> <span>' + contact.get("firstName") + " " + contact.get("lastName") + '</span></div> \
                        <div class="delete hidden">Delete</div>    \
                    </div>');

                } else {
                    var email = name;
                    $("#content").append('<div  id="' + email + '" class="menu-item">   \
                        <div class="text-left" style="width:74%;"><div class="circle-icon-wrapper"><i class="icon-fontello-circle icon-grey"></i></div> <span>' + email + '</span></div> \
                        <div class="delete hidden">Delete</div>    \
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
            } //eo switch
        }); //eo searchTxt keyup

        $("#searchBtn").on('click', function() {
            doSearch();
        }); //searchBtn click

    }

    var initEvents = function() {
        $(".text-left").off("click");
        $(".delete").off("click");

        $(".text-left").on("click", function(e) {
            var id = $(this).parent().attr("id"); //student's id = Kid's id
            var index = selectedContactIdArray.indexOf(id);
            var div = $(this).parent().children().children().children().eq(0);
            if (index == -1) {
                selectedContactIdArray.push(id);
                div.removeClass("icon-fontello-circle");
                div.removeClass("icon-grey");
                div.addClass("icon-fontello-ok-circled");
                div.addClass("icon-red");
                $(this).parent().children().eq(1).removeClass("hidden");
            } else {
                selectedContactIdArray.splice(index, 1);
                div.addClass("icon-fontello-circle");
                div.addClass("icon-grey");
                div.removeClass("icon-fontello-ok-circled");
                div.removeClass("icon-red");
                $(this).parent().children().eq(1).addClass("hidden");
            }
        }); //eo text-left click

        // $(".delete").on("click", function(e) {
        //     var obj = $(this);
        //     var id = $(this).parent().attr("id");
        //     var defer = _confirm("Do you want to delete " + $(this).parent().children().eq(0).children().eq(1).html() + " ?");
        //     defer.done(function() { //use .done instead of .then because we only have a resolve case
        //         console.log(obj);
        //         obj.parent().animate({
        //             "opacity": 0
        //         }, 1000, function() {
        //             obj.parent().remove();
        //         });
        //         deleteContact(id);
        //     });
        // });

        $(".delete").on("click", function(e) {
            var studentId = $(this).parent().attr("id");
            var defer = _confirm("Do you want to delete " + $(this).parent().children().eq(0).children().eq(1).html() + " ?");
            defer.done(function() { //use .done instead of .then because we only have a resolve case
                $(this).parent().animate({
                    "opacity": 0
                }, 1000, function() {
                    $(this).parent().remove();
                });
                $('#'+studentId).addClass("hidden");
                deleteStudent(studentId);
            });
        });
    }

    // var deleteContact = function(id) {

    //     fullSpinner.show();
    //     //If email, this means it is non-existing user
    //     if (_validateEmail(id)) {
    //         //Update locally
    //         var nonUserContactEmail = selectedMyGroupData.nonUserContactEmail;
    //         var email = id;
    //         var index = nonUserContactEmail.indexOf(email);
    //         nonUserContactEmail.splice(index, 1);
    //         user.setting.selectedMyGroupData.nonUserContactEmail = nonUserContactEmail;
    //         localStorage.setItem("user", JSON.stringify(user));

    //         //Update data on Parse
    //         var UserCustomGroup = Parse.Object.extend("UserCustomGroup");
    //         var query = new Parse.Query(UserCustomGroup);
    //         query.equalTo("objectId", selectedMyGroupId);
    //         query.find({
    //             success: function(results) {
    //                 var mygroup = results[0];
    //                 if (mygroup) {
    //                     mygroup.set("nonUserContactEmail", nonUserContactEmail);
    //                     mygroup.save(null, {
    //                         success: function(mygroup) {
    //                             fullSpinner.hide();
    //                         }
    //                     });
    //                 } else {
    //                     fullSpinner.hide();
    //                 }
    //             },
    //             error: function(error) {
    //                     console.log(error);
    //                     fullSpinner.hide();
    //                 } //eo error
    //         }); //eo query.find


    //     } else {
    //         var userContactId = selectedMyGroupData.userContactId; //Array
    //         var index = userContactId.indexOf(email);
    //         userContactId.splice(index, 1);
    //         user.setting.selectedMyGroupData.userContactId = userContactId;
    //         localStorage.setItem("user", JSON.stringify(user));

    //         //Update data on Parse
    //         selectedMyGroupId
    //         var UserCustomGroup = Parse.Object.extend("UserCustomGroup");
    //         var query = new Parse.Query(UserCustomGroup);
    //         query.equalTo("objectId", selectedMyGroupId);
    //         query.find({
    //             success: function(results) {
    //                 var mygroup = results[0];
    //                 if (mygroup) {
    //                     mygroup.set("userContactId", userContactId);
    //                     mygroup.save(null, {
    //                         success: function(mygroup) {
    //                             fullSpinner.hide();
    //                         }
    //                     });
    //                 } else {
    //                     fullSpinner.hide();
    //                 }
    //             },
    //             error: function(error) {
    //                     console.log(error);
    //                     fullSpinner.hide();
    //                 } //eo error
    //         }); //eo query.find
    //     }


    //     //Remove from multiple selection array
    //     var index = selectedContactIdArray.indexOf(id);
    //     if (index != -1) {
    //         selectedContactIdArray.splice(index, 1);
    //     }
    // }

    var initDoneBtn = function() {
        // $("#doneBtn").on("click", function(e) {
        //     deleteSelectedContacts();
        // });
        $("#doneBtn").on("click", function(e) {
                    if (selectedContactIdArray.length == 0) {
                        Chaplin.utils.redirectTo({
                            name: 'setting-mygroups-detail'
                        });
                    } else {
                        var studentId = $(this).parent().attr("id");
                        var defer = _confirm("Do you want to delete these members?");
                        defer.done(function(){
                            //Delete selected students
                            var selectedContactIdArrayCopy = selectedContactIdArray.slice();
                            for (var i = 0; i < selectedContactIdArrayCopy.length; i++) {
                                var studentId = selectedContactIdArrayCopy[i];
                                deleteStudent(studentId, selectedContactIdArrayCopy);
                            }
                            setTimeout(function() {
                                //Redirect back to previous page
                                Chaplin.utils.redirectTo({
                                    name: 'setting-mygroups-detail'
                                });
                            }, 1000);
                        }); //eo defer
                    } //eo else
                }); //eo doneBtn click

    }; //eo initDoneBtn

    var deleteStudent = function(studentId, selectedContactIdArrayCopy) {
        //Delete locally
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
            error: function(results) {
                console.log('Error: '+error)
            }
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
            error: function(results) {
                console.log('Error: '+error)
            }
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
            error: function(results) {
                console.log('Error: '+error)
            }
        });
    }; //eo deleteUserOrgGroupRelation

    var deleteStudentFromCustomList = function(selectedMyGroupId, studentId, selectedContactIdArrayCopy) {
        var UserCustomList = Parse.Object.extend("UserCustomList", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserCustomList.query();
        query.equalTo("groupId", selectedMyGroupId);
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
                            if (!selectedContactIdArrayCopy) {
                                recipient.children = newList;
                                customList.save();
                            } else {
                                var allDeletedList = jQuery.grep(newList, function(n) {
                                    return selectedContactIdArrayCopy.indexOf(n) == -1
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
                    var userRecipientArray = jQuery.grep(recipientList, function(n) {
                        return n.parent == studentId;
                    });
                    for (var j = 0; j < userRecipientArray.length; j++) {
                        recipient = userRecipientArray[i];
                        customList.remove("recipientList", recipient);
                        customList.save();
                        deleteFromUserContactEmail(studentId, customList);
                    }
                }
            },
            error: function(error) {
                console.log('Error: '+error);
            }
        });
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
                customGroup.id = selectedMyGroupId;
                customGroup.remove("userContactEmail", parentEmail);
                customGroup.save();
                customList.remove("userContactEmail", parentEmail);
                customList.save();
                var userContactEmail = selectedMyGroupData.userContactEmail;
                var index = userContactEmail.indexOf(parentEmail);
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
            error: function(error) {
                console.log('Error: '+JSON.stringify(error));
            }
        });
    }; //eo deleteUserEventRelations

    var deleteUserHomeworkRelations = function(groupId, studentId, selectedStudentIdArrayCopy) {
        var UserHomeworkRelation = Parse.Object.extend("UserHomeworkRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserHomeworkRelation.query();
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
            error: function(error) {
                console.log('Error: '+JSON.stringify(error));
            }
        });
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
            error: function(error) {
                console.log('Error: '+JSON.stringify(error));
            }
        });
    }; //eo deleteUserMessageRelations

    // var deleteSelectedContacts = function() {
    //     fullSpinner.show();
    //     var userIdArray = [];
    //     var nonUserEmailArray = [];

    //     //Seperate existing users and non-existing users
    //     for (var i = 0; i < selectedContactIdArray.length; i++) {
    //         var contact = selectedContactIdArray[i];
    //         if (_validateEmail(contact)) {
    //             nonUserEmailArray.push(contact);
    //         } else {
    //             userIdArray.push(nonUserEmailArray);
    //         }
    //     }

    //     //Delete locally
    //     var userContactId = selectedMyGroupData.userContactId;
    //     for (var i = 0; i < userIdArray.length; i++) {
    //         var id = userIdArray[i];
    //         var index = userContactId.indexOf(id);
    //         userContactId.splice(index, 1);
    //     }

    //     var nonUserContactEmail = selectedMyGroupData.nonUserContactEmail;
    //     for (var i = 0; i < nonUserEmailArray.length; i++) {
    //         var email = nonUserEmailArray[i];
    //         var index = nonUserContactEmail.indexOf(email);
    //         nonUserContactEmail.splice(index, 1);
    //     }

    //     user.setting.selectedMyGroupData.userContactId = userContactId;
    //     user.setting.selectedMyGroupData.nonUserContactEmail = nonUserContactEmail;
    //     localStorage.setItem("user", JSON.stringify(user));

    //     //Update data on Parse
    //     var UserCustomGroup = Parse.Object.extend("UserCustomGroup");
    //     var query = new Parse.Query(UserCustomGroup);
    //     query.equalTo("objectId", selectedMyGroupId);
    //     query.find({
    //         success: function(results) {
    //             var mygroup = results[0];
    //             if (mygroup) {
    //                 mygroup.set("userContactId", userContactId);
    //                 mygroup.set("nonUserContactEmail", nonUserContactEmail);
    //                 mygroup.save(null, {
    //                     success: function(mygroup) {
    //                         fullSpinner.hide();
    //                         redirect();
    //                     }
    //                 });
    //             } else {
    //                 fullSpinner.hide();
    //             }
    //         },
    //         error: function(error) {
    //                 console.log(error);
    //                 fullSpinner.hide();
    //             } //eo error
    //     }); //eo query.find

    // }; //eo deleteSelectedContacts

    var redirect = function() {
        Chaplin.utils.redirectTo({
            name: 'setting-mygroups-detail'
        });
    }

    var addedToDOM = function() {

        initData();
        initButtons();
        loadContacts();
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
