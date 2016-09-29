define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-organizations-detail-students-add-bynamemobile-view.hbs',
    'jquery',
    'spinner',
    'parse'
], function(Chaplin, View, Template, $, spinner, Parse) {
    'use strict';

    var user;
    var selectedOrgId;
    var selectedOrgData;
    var totalResponse;
    var totalRequest;
    var firstName;
    var lastName;
    var childId;
    var parentId;

    var initData = function() {
        user = JSON.parse(localStorage.getItem("user"));
        selectedOrgId = user.setting.selectedOrgId;
        selectedOrgData = user.setting.selectedOrgData;
    }; //eo initData

    var initButtons = function() {
        $("#cancelBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-organizations-detail-students-add'
            });
        });
    }; //eo initButtons

    var initAddByName = function() {
        $("#submit").on('click', function(e) {
            addByName();
        });
    }; //eo initAddByName

    var addByName = function() {
        var childData;
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
                    query2.equalTo("firstName", firstName);
                    query2.equalTo("lastName", lastName);
                } else { //phone belongs to parent
                    var parent = results[0];
                    parentId = parent.id;
                    var query2 = UserParentRelation.query();
                    query2.equalTo("parentId", parentId);
                    query2.equalTo("childFirstName", firstName);
                    query2.equalTo("childLastName", lastName);
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
                        isRelationExist(child);
                        totalRequest++;
                    }
                }
            }, function(error) {
                _confirm('Error: '+error);
            });
        }
    }; //eo addByName

    //Check if relation already exist
    var isRelationExist = function(child) {
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
                    _confirm("The student has already been added to this organization");
                    spinner.hide();
                } else {
                    //Add child to organization
                    createRelation(child);
                }
            },
            error: function(error) {
                console.log(error);
                totalResponse++;
                checkIfRedirect();
                //_confirm("There was an error connecting to the server, please try again");
            }
        });
    }; //eo isRelationExist

    var createRelation = function(child) {
        //Load relations
        var UserOrganizationRelation = Parse.Object.extend("UserOrganizationRelation");
        var relation = new UserOrganizationRelation();
        relation.set("organizationId", selectedOrgId);
        relation.set("userId", childId);
        relation.set("organizationType", selectedOrgData.type);
        relation.set("permission", "student"); //Permission determine what this user can do to this org setting
        relation.set("position", "Student"); //Position is used for display student info to the user with the right permisson
        relation.set("relation", "student") //Relation is used in various interfaces and to determine the relationship between this child and org
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
                //_confirm('New object created with objectId: ' + relation.id);

                totalResponse++;
                checkIfRedirect();
            },
            error: function(relation, error) {
                // Execute any logic that should take place if the save fails.
                // error is a Parse.Error with an error code and message.
                //_confirm('Failed to add child to organization: ' + error.message);
                totalResponse++;
                checkIfRedirect();
            }
        });
    }; //eo createRelation

    var checkIfRedirect = function(){
        if(totalRequest == totalResponse){
            redirect();
        }
    }; //eo checkIfRedirect

    var redirect = function() {
        spinner.hide();
        Chaplin.utils.redirectTo({
            name: 'setting-organizations-detail-students'
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
        id: 'setting-organizations-detail-students-add-bynamemobile-view',
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
