define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-organizations-groups-detail-students-add-byid-view.hbs',
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
    var childId;
    var parentId;

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

    var initAddByChildId = function() {
        //ToDo
        //Test this!

        $("#submit").on('click', function(e) {
            addById();
        });
    }; //eo initAddByChildId

    //Check if child exist
    var addById = function() {

        var studentId = $("#studentId").val();

        if (studentId == null || studentId == "") {
            _confirm("Please enter student id");
        } else {

            spinner.show();
            //Get Student Object
            var Child = Parse.Object.extend("Child", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var query = Child.query();
            query.equalTo("objectId", studentId);
            query.find({
                success: function(results) {
                    if (results.length == 0) {
                        _confirm("No student with the given ID found");
                        spinner.hide();
                    } else {
                        var childData = results[0];
                        childId = childData.id;
                        //Check if relation already exists
                        getParent(childData);
                        isRelationExist(childData);
                    }
                },
                error: function(error) {
                    console.log(error);
                    spinner.hide();
                    _confirm("There was an error connecting to the server, please try again");
                }
            });
        }
    }; //eo addById

    var getParent = function(childData) {
        var UserParentRelation = Parse.Object.extend("UserParentRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserParentRelation.query();
        var deferred = $.Deferred(); //local to be added to promises array
        query.equalTo("childId", childId);
        query.find({
            success: function(results) {
                for (var i = 0; i < results.length; i++) {
                     var deferredParentEmail = $.Deferred();
                    var parent = results[i];
                    parentId = parent.get("parentId");
                    addToCustomList(childData);

                    //Add parent email and secondary parent to UserCustomList table
                    deferredParentEmail = _addParentEmail(parentId, user.setting.selectedOrgGroupId);
                    deferredParentEmail.done(function(){
                        _addOldEvents(selectedOrgGroupId, childId, parentId, selectedOrgId);
                        _addOldHomework(selectedOrgGroupId, childId, parentId, selectedOrgId);
                         deferred.resolve();
                    });

                }
            },
            error: function(error) {
                console.log(error);
                deferred.resolve();
            }
        });
    }; //eo getParent

    var addToCustomList = function(childData) {
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
                    customGroup.save();
                }
            },
            error: function(error) {
                console.log(error);
            }
        });
    }; //eo addToCustomList

    //Check if relation already exist
    var isRelationExist = function(childData) {
        var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserOrganizationGroupRelation.query();
        query.equalTo("organizationGroupId", selectedOrgGroupId);
        query.equalTo("userId", childData.id);
        query.find({
            success: function(results) {
                if (results.length != 0) {
                    _confirm("The student has already been added to this group");
                    spinner.hide();
                } else {

                    //Add student to organization group
                    //loadStudentData(relation);
                    isOrgRelationExist(childData);
                    addToOrgGroup(childData);
                    createRelation(childData);
                }
            },
            error: function(error) {
                console.log(error);
                spinner.hide();
                _confirm("There was an error connecting to the server, please try again");
            }
        });
    }; //eo isRelationExist

    // var loadStudentData = function(relation) {
    //     //Get Student Object
    //     var Child = Parse.Object.extend("Child");
    //     var query = new Parse.Query(Child);
    //     query.equalTo("objectId", relation.get("userId"));
    //     query.find({
    //         success: function(results) {
    //             if (results.length == 0) {
    //                 alert("Internal error, no student object found");
    //                 spinner.hide();
    //             } else {
    //                 var childData = results[0];
    //                 //Create relation
    //                 createRelation(childData);
    //             }
    //         },
    //         error: function(error) {
    //             console.log(error);
    //             spinner.hide();
    //             alert("There was an error connecting to the server, please try again");
    //         }
    //     });
    // }; //eo loadStudentData

    var createRelation = function(childData) {
        console.log(childData)
        //Create relation
        var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation");
        var relation = new UserOrganizationGroupRelation();

        relation.set("organizationGroupId", selectedOrgGroupId);
        relation.set("userId", childData.id);
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
        relation.set("firstName", childData.get("firstName"));
        relation.set("lastName", childData.get("lastName"));

        relation.save(null, {
            success: function(relation) {
                // Execute any logic that should take place after the object is saved.
                //alert('New object created with objectId: ' + relation.id);

                redirect();
            },
            error: function(relation, error) {
                spinner.hide();
                // Execute any logic that should take place if the save fails.
                // error is a Parse.Error with an error code and message.
                _confirm('Failed to add child to organization: ' + error.message);
            }
        });
    }; //eo createRelation

    var addToOrgGroup = function(childData) {
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
                    orgGroup.addUnique("studentIdList", childData.id);
                    orgGroup.save();

                }
            },
            error: function(error) {
                console.log(error);
                _confirm("There was an error connecting to the server, please try again");
            }
        });
    }; //eo addToOrgGroup

    var isOrgRelationExist = function(childData) {
        var UserOrganizationRelation = Parse.Object.extend("UserOrganizationRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserOrganizationRelation.query();
        query.equalTo("organizationId", selectedOrgId);
        query.equalTo("userId", childData.id);
        query.find({
            success: function(results) {
                if (results.length != 0) {
                    //alert("The child is already added to this organization");
                    //spinner.hide();
                    console.log('Child already added to organization')
                } else {
                    //Add child to organization
                    createOrgRelation(childData);
                }
            },
            error: function(error) {
                console.log(error);
                //alert("There was an error connecting to the server, please try again");
            }
        });
    }; //eo isOrgRelationExist

    var createOrgRelation = function(childData) {
        //Create relation
        var UserOrganizationRelation = Parse.Object.extend("UserOrganizationRelation");
        var relation = new UserOrganizationRelation();
        relation.set("organizationId", selectedOrgId);
        relation.set("userId", childData.id);
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
        relation.set("firstName", childData.get("firstName"));
        relation.set("lastName", childData.get("lastName"));
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

    var redirect = function() {
        spinner.hide();
        Chaplin.utils.redirectTo({
            name: 'setting-organizations-groups-detail-students'
        });
    }; //eo redirect

    var addedToDOM = function() {

        initData();
        initButtons();
        initAddByChildId();
    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: 'setting-organizations-groups-detail-students-add-byid-view',
        className: 'view-container',
        listen: {
            addedToDOM: addedToDOM
        },
        initialize: function(options) {
            //Reset footer
            $("#footer-toolbar > li").removeClass("active");
            Chaplin.View.prototype.initialize.call(this, arguments);
        }
    }); //eo view.extend

    return View;
});
