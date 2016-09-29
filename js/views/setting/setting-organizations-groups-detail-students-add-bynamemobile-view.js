define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-organizations-groups-detail-students-add-bynamemobile-view.hbs',
    'jquery',
    'spinner',
    'parse'
], function(Chaplin, View, Template, $, spinner, Parse) {
    'use strict';

    var user;
    var selectedOrgId;
    var selectedOrgData;
    var selectedOrgGroupId;
    var selectedOrgGroupData;
    var totalResponse;
    var totalRequest;
    var childId;
    var parentId;
    var firstName;
    var lastName;

    var initData = function() {
        user = JSON.parse(localStorage.getItem("user"));
        selectedOrgId = user.setting.selectedOrgId;
        selectedOrgData = user.setting.selectedOrgData;
        selectedOrgGroupId = user.setting.selectedOrgGroupId;
        selectedOrgGroupData = user.setting.selectedOrgGroupData;
    }; //eo initData

    var initButtons = function() {
        $("#cancelBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-organizations-groups-detail-students-add'
            });
        });
    }; //eo initButtons

    var initAddByName = function() {
        $("#submit").on('click', function(e) {
            addByName();
        });
    }; //eo initAddByName

    var addByName = function() {
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
                if (results.length == 0) { //phone belongs to child
                    // alert('Phone number not found');
                    // spinner.hide();
                    var query2 = Child.query();
                    query2.containedIn("mobilePhone", mobilePhone);
                    query2.containedIn("firstName", _containedIn(firstName));
                    query2.containedIn("lastName", _containedIn(lastName));
                } else { //phone belongs to parent
                    var parent = results[0];
                    parentId = parent.id;
                    var query2 = UserParentRelation.query();
                    query2.equalTo("parentId", parentId);
                    query2.containedIn("childFirstName", _containedIn(firstName));
                    query2.containedIn("childLastName", _containedIn(lastName));
                }
                return query2.find();
            }).then(function(results) {
                if (results.length == 0) {
                    _confirm('No child found');
                    spinner.hide();
                } else {
                    for (var i = 0; i < results.length; i++) {
                        var child = results[i];
                        if (!child.get("childId")) {
                            childId = child.id;
                        } else {
                            childId = child.get("childId");
                        }
                        getParent(child);
                        isRelationExist(child);
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
                    //addToCustomList(child);
                    getParentEmail(child);
                    _addOldEvents(selectedOrgGroupId, childId, parentId, selectedOrgId);
                    _addOldHomework(selectedOrgGroupId, childId, parentId, selectedOrgId);
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
        query.equalTo("groupId", selectedOrgGroupId);
        query.find({
            success: function(results) {
                for (var i = 0; i < results.length; i++) {
                    var customGroup = results[i];
                    var recipientList = customGroup.get("recipientList");
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

    //Check if relation already exist
    var isRelationExist = function(child) {
        var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserOrganizationGroupRelation.query();
        query.equalTo("organizationGroupId", selectedOrgGroupId);
        query.equalTo("userId", childId);
        query.find({
            success: function(results) {
                if (results.length != 0) {
                    //alert("The child is already added to this organization");
                    //spinner.hide();
                    totalResponse++;
                    checkIfRedirect();
                } else {
                    //Add child to organization
                    isOrgRelationExist(child);
                    addToOrgGroup(child);
                    createRelation(child);
                }
            },
            error: function(error) {
                console.log(error);
                totalResponse++;
                checkIfRedirect();
                //alert("There was an error connecting to the server, please try again");
            }
        });
    }; //eo isRelationExist

    var createRelation = function(child) {
        //Create relation
        var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation");
        var relation = new UserOrganizationGroupRelation();
        relation.set("organizationGroupId", selectedOrgGroupId);
        relation.set("userId", childId);
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
        relation.set("firstName", firstName);
        relation.set("lastName", lastName);
        relation.save(null, {
            success: function(relation) {
                // Execute any logic that should take place after the object is saved.
                //alert('New object created with objectId: ' + relation.id);
                totalResponse++;
                checkIfRedirect();
            },
            error: function(relation, error) {
                // Execute any logic that should take place if the save fails.
                // error is a Parse.Error with an error code and message.
                //alert('Failed to add child to organization: ' + error.message);
                totalResponse++;
                checkIfRedirect();
            }
        });
    }; //eo createRelation

    var addToOrgGroup = function(child) {
        var OrganizationGroup = Parse.Object.extend("OrganizationGroup", {}, {
          query: function(){
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
                    //Add child to organization
                    var orgGroup = results[0];
                    orgGroup.addUnique("studentIdList", childId);
                    orgGroup.save();

                }
            },
            error: function(error) {
                console.log(error);
                _confirm("There was an error connecting to the server, please try again");
            }
        });
    }; //eo addToOrgGroup

    var isOrgRelationExist = function(child) {
        var UserOrganizationRelation = Parse.Object.extend("UserOrganizationRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserOrganizationRelation.query();
        query.equalTo("organizationId", selectedOrgId);
        query.equalTo("userId", childId);
        query.find({
            success: function(results) {
                if (results.length != 0) {
                    //alert("The child is already added to this organization");
                    //spinner.hide();
                    console.log('Child already added to organization')
                } else {
                    //Add child to organization
                    createOrgRelation(child);
                }
            },
            error: function(error) {
                console.log(error);
                //alert("There was an error connecting to the server, please try again");
            }
        });
    }; //eo isOrgRelationExist

    var createOrgRelation = function(child) {
        //Create relation
        var UserOrganizationRelation = Parse.Object.extend("UserOrganizationRelation");
        var relation = new UserOrganizationRelation();
        relation.set("organizationId", selectedOrgId);
        relation.set("userId", childId);
        relation.set("organizationType", selectedOrgData.type);
        relation.set("permission", "student");
        relation.set("position", "Student");
        relation.set("relation", "student")
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
        relation.save(null, {
            success: function(relation) {
                // Execute any logic that should take place after the object is saved.
                //alert('New object created with objectId: ' + relation.id);
                console.log('Added to organization');
            },
            error: function(relation, error) {
                // Execute any logic that should take place if the save fails.
                // error is a Parse.Error with an error code and message.
                //alert('Failed to add child to organization: ' + error.message);
                console.log(error);
            }
        });
    }; //eo createOrgRelation

    var checkIfRedirect = function() {
        if (totalRequest == totalResponse) {
            redirect();
        }
    }; //eo checkIfRedirect

    var redirect = function() {
        spinner.hide();
        Chaplin.utils.redirectTo({
            name: 'setting-organizations-groups-detail-students'
        });
    }; //eo redirect

    var addedToDOM = function() {
        initData();
        initButtons();
        initAddByName();
    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: 'setting-organizations-groups-detail-students-add-bynamemobile-view',
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
