define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-mygroups-detail-contacts-add-mobilephone-view.hbs',
    'jquery',
    'spinner',
    'parse'
], function(Chaplin, View, Template, $, spinner, Parse) {
    'use strict';

    var user;
    var userId;
    var selectedMyGroupId;
    var selectedMyGroupData;
    var userData;
    var totalResponse;
    var totalRequest;
    var childId;
    var parentId;
    var firstName;
    var lastName;

    var initData = function() {
        user = JSON.parse(localStorage.getItem("user"));
        selectedMyGroupId = user.setting.selectedMyGroupId;
        selectedMyGroupData = user.setting.selectedMyGroupData;
    }; //eo initData

    var initButtons = function() {
        $("#cancelBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-mygroups-detail-contacts-add'
            });
        });
    }; //eo initButtons

    var initAddByEmail = function() {
        //ToDo
        //Test this!
        $("#submit").on('click', function(e) {
            //addByEmail();
            addByName();
        });
    }; //eo initAddByEmail


    var addByName = function() {
        var flag = false;
        firstName = $("#firstName").val();
        lastName = $("#lastName").val();
        var mobileNumber = $("#mobilePhone1").val() + $("#mobilePhone2").val() + $("#mobilePhone3").val();
        var mobileDash = $("#mobilePhone1").val() + '-' + $("#mobilePhone2").val() + '-' + $("#mobilePhone3").val();
        var mobileParen = '(' + $("#mobilePhone1").val() + ')' + $("#mobilePhone2").val() + '-' + $("#mobilePhone3").val();
        var mobileParenSpace = '(' + $("#mobilePhone1").val() + ') ' + $("#mobilePhone2").val() + '-' + $("#mobilePhone3").val();
        var mobileDot = $("#mobilePhone1").val() + '.' + $("#mobilePhone2").val() + '.' + $("#mobilePhone3").val();
        var mobileSpace = $("#mobilePhone1").val() + ' ' + $("#mobilePhone2").val() + ' ' + $("#mobilePhone3").val();
        var mobileParenSpaceSpace = '(' + $("#mobilePhone1").val() + ') ' + $("#mobilePhone2").val() + ' ' + $("#mobilePhone3").val();
        var mobileParenNoDash = '(' + $("#mobilePhone1").val() + ')' + $("#mobilePhone2").val() + ' ' + $("#mobilePhone3").val();
        var mobilePhone = [mobileNumber, mobileDash, mobileParen, mobileParenSpace, mobileDot, mobileSpace, mobileParenSpaceSpace, mobileParenNoDash]; //array of possible phone number formats
        if (firstName === null || firstName === "" || lastName === null || lastName === "" || mobileNumber === null || mobileNumber.length < 10) {
            _confirm("Please enter all fields");
        } else {
            spinner.show();
            totalRequest = 0;
            totalResponse = 0;
            var Child = Parse.Object.extend("Child", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var UserParentRelation = Parse.Object.extend("UserParentRelation", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var query = new Parse.Query(Parse.User);
            query.containedIn("mobilePhone", mobilePhone);
            query.find().then(function(results) {
                if (results.length == 0) { //mobilePhone belongs to child
                    // alert('Email not found');
                    // spinner.hide();
                    var query2 = Child.query();
                    query2.containedIn("firstName", _containedIn(firstName));
                    query2.containedIn("lastName", _containedIn(lastName));
                    query2.containedIn("mobilePhone", mobilePhone);
                } else { //mobilePhone belongs to parent
                    var parent = results[0];
                    parentId = parent.id;
                    var parentFirstName = parent.get('firstName');
                    var parentLastName = parent.get('lastName');
                    if ((parentFirstName == firstName) && (parentLastName == lastName)) {
                        flag = true;
                        var parentEmail = null;
                        var isEmailDelivery = parent.get("isEmailDelivery");
                        if (isEmailDelivery) {
                            parentEmail = parent.get("email");
                        }
                        addToCustomList(null, parentEmail);
                        _addOldEvents(selectedMyGroupId, null, parentId);
                        _addOldHomework(selectedMyGroupId, null, parentId);
                        addUserToContact(parentId, parentEmail);
                        totalRequest++
                    }
                    var query2 = UserParentRelation.query();
                    query2.equalTo("parentId", parentId);
                    query2.containedIn("childFirstName", _containedIn(firstName));
                    query2.containedIn("childLastName", _containedIn(lastName));
                }
                return query2.find();
            }).then(function(results) {
                if (results.length == 0) {
                    //_confirm('No child found');
                    if (!flag) { // neither user not child found
                        spinner.hide();
                        _alert('Could not find ' + firstName + ' ' + lastName + ' using this phone number');
                    }
                } else {
                    for (var i = 0; i < results.length; i++) {
                        var child = results[i];
                        if (!child.get("childId")) {
                            childId = child.id;
                        } else {
                            childId = child.get("childId");
                        }
                        getParent(child);
                        //isRelationExist(child);
                        totalRequest++;
                    }
                }
            }, function(error) {
                _confirm('Error: '+error);
            });
        }
    }; //eo addByName

    var getParent = function(child) {
        var UserParentRelation = Parse.Object.extend("UserParentRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserParentRelation.query();
        query.equalTo("childId", childId);
        query.find({
            success: function(results) {
                for (var i = 0; i < results.length; i++) {
                    var parent = results[i];
                    parentId = parent.get("parentId");
                    getParentEmail(child);
                    createOrgGroupRelation(child);
                    _addOldEvents(selectedMyGroupId, childId, parentId);
                    _addOldHomework(selectedMyGroupId, childId, parentId);
                }
            },
            error: function(error) {
                console.log(error);
            }
        });
    }; //eo getParent

    var getParentEmail = function(child) {
        var parentEmail;
        var query = new Parse.Query(Parse.User);
        query.equalTo("objectId", parentId);
        query.find({
            success: function(results) {
                var parentUser = results[0];
                var isEmailDelivery = parentUser.get("isEmailDelivery");
                if (isEmailDelivery) {
                    parentEmail = parentUser.get("email");
                }
                addToCustomList(child, parentEmail);
                addUserToContact(childId, parentEmail);
                addToOrgGroup(childId);
            },
            error: function(error) {

            }
        });
    }; //eo getParentEmail

    var addToCustomList = function(child, parentEmail) {
        var UserCustomList = Parse.Object.extend("UserCustomList", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserCustomList.query();
        query.equalTo("groupId", selectedMyGroupId);
        query.find({
            success: function(results) {
                var addRecipientList = function(recipientList) {
                    var recipient = jQuery.grep(recipientList, function(n) {
                        return n.parent == parentId;
                    });
                    if (recipient.length == 0) {
                        var o = {children: [childId], parent: parentId};
                        recipientList.push(o);
                    } else {
                        if (recipient[0].children.indexOf(childId) == -1) {
                            recipient[0].children.push(childId);
                        }
                    }
                }; //eo addRecipientList
                var addRecipientUser = function(recipientList) {
                    var o = {children: [], parent: parentId};
                    recipientList.push(o);
                }
                for (var i = 0; i < results.length; i++) {
                    var customGroup = results[i];
                    var recipientList = customGroup.get("recipientList");
                    child ? addRecipientList(recipientList) : addRecipientUser(recipientList);
                    if (parentEmail) {
                        customGroup.addUnique("userContactEmail", parentEmail);
                    }
                    customGroup.save();
                }
            },
            error: function(error) {
                console.log(error);
            }
        });

    }; //eo addToCustomList

    var createOrgGroupRelation = function(child) {
        var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserOrganizationGroupRelation.query();
        var childId = child.attributes.childId ? child.attributes.childId : child.id;
        var firstName = child.attributes.childFirstName ? child.attributes.childFirstName : child.get("firstName");
        var lastName = child.attributes.childLastName ? child.attributes.childLastName : child.get("lastName");
        query.equalTo("organizationGroupId", selectedMyGroupId);
        query.equalTo("userId", childId);
        query.find({
            success: function(results) {
                if (results.length == 0) {
                    var relation = new UserOrganizationGroupRelation();
                    relation.set("organizationGroupId", selectedMyGroupId);
                    relation.set("userId", childId);
                    relation.set("relationType", "student");
                    relation.set("position", "Student");
                    relation.set("groupName", selectedMyGroupData.name);
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
                    relation.set("firstName", firstName);
                    relation.set("lastName", lastName);
                    relation.save();
                }
            },
            error: function(error) {
                _alert('Internal error: '+JSON.stringify(error));
            }
        });

    }; //eo createOrgGroupRelation

    var addToOrgGroup = function(childId) {
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
                group.addUnique("studentIdList", childId);
                group.save();
            },
            error: function(err) {
                _alert('Internal Error: '+JSON.stringify(err));
            }
        });
    }; //eo addToOrgGroup

    var addUserToContact = function(userId, parentEmail) {
        var userContactId = selectedMyGroupData.userContactId; //Array
        var userContactEmail = selectedMyGroupData.userContactEmail;

        //Update data locally
        userContactId.push(userId);
        if (parentEmail && userContactEmail.indexOf(parentEmail) == -1) {
            userContactEmail.push(parentEmail);
        }
        user.setting.selectedMyGroupData.userContactId = userContactId; //Do we need this line?
        localStorage.setItem("user", JSON.stringify(user));

        //Update data on Parse
        //Get Parse's object of this UserCustomGroup
        var UserCustomGroup = Parse.Object.extend("UserCustomGroup", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserCustomGroup.query();
        query.equalTo("objectId", selectedMyGroupId);
        query.find({
            success: function(results) {
                if (results.length > 0) {
                    var object = results[0];
                    //Update data on parse
                    object.addUnique("userContactId", userId);
                    if (parentEmail) {
                        object.addUnique("userContactEmail", parentEmail);
                    }
                    object.save(null, {
                        success: function(object) {
                            redirect();
                        },
                        error: function(error) {
                                console.log("error: could not save data on parse");
                                redirect();
                            } //eo error
                    });
                } else {
                    redirect();
                }
            },
            error: function(error) {
                    redirect();
                } //eo error
        }); //eo query.find
    }

    var addNonUserToContact = function(email) {
        var nonUserContactEmail = selectedMyGroupData.nonUserContactEmail; //Array

        //Update data locally
        nonUserContactEmail.push(email);
        user.setting.selectedMyGroupData.nonUserContactEmail = nonUserContactEmail; //Do we need this line?
        localStorage.setItem("user", JSON.stringify(user));

        //Update data on Parse
        //Get Parse's object of this UserCustomGroup
        var UserCustomGroup = Parse.Object.extend("UserCustomGroup", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserCustomGroup.query();
        query.equalTo("objectId", selectedMyGroupId);
        query.find({
            success: function(results) {
                if (results.length > 0) {
                    var object = results[0];
                    //Update data on parse
                    object.set("nonUserContactEmail", nonUserContactEmail);
                    object.save(null, {
                        success: function(object) {
                            redirect();
                        },
                        error: function(error) {
                                console.log("error: could not save data on parse");
                                redirect();
                            } //eo error
                    });
                } else {
                    redirect();
                }
            },
            error: function(error) {
                    redirect();
                } //eo error
        }); //eo query.find
    }

    var redirect = function() {
        spinner.hide();
        Chaplin.utils.redirectTo({
            name: 'setting-mygroups-detail-contacts'
        });
    }; //eo redirect

    var addedToDOM = function() {
        initData();
        initButtons();
        initAddByEmail();
    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: 'setting-mygroups-detail-contacts-add-mobilephone-view',
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
