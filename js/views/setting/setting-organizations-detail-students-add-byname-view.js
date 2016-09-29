define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-organizations-detail-students-add-byname-view.hbs',
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
        var firstName = $("#firstName").val();
        var lastName = $("#lastName").val();
        var childData;

        if (firstName == null || firstName == "" || lastName == null || lastName == "") {
            _confirm("Please enter all fields");
        } else {
            spinner.show();
            totalRequest = 0;
            totalResponse = 0;
            //Get Student Object
            var Child = Parse.Object.extend("Child", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var query = Child.query();
            query.equalTo("firstName", firstName);
            query.equalTo("lastName", lastName);
            query.find({
                success: function(results) {
                    if (results.length == 0) {
                        _confirm("No child found");
                        spinner.hide();
                    } else {
                        for (var i = 0; i < results.length; i++) {
                            var child = results[i];
                            //Check if relation already exists
                            isRelationExist(child);

                            totalRequest++;
                        }
                    } //eo else
                },
                error: function(error) {
                    console.log(error);
                    _confirm("There was an error connecting to the server, please try again");
                } //eo error
            }); //eo query.find
        } //eo if childId
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
        query.equalTo("userId", child.id);
        query.find({
            success: function(results) {
                if (results.length != 0) {
                    //_confirm("The child is already added to this organization");
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
        relation.set("userId", child.id);
        relation.set("organizationId", selectedOrgId);
        relation.set("position", "Student"); //Position is used for display student info to the user with the right permisson
        relation.set("permission", "student"); //Permission determine what this user can do to this org setting
        relation.set("relation", "student"); //Relation is used in various interfaces and to determine the relationship between this child and org
        relation.set("organizationType", selectedOrgData.label);
        relation.set("firstName", child.get("firstName"));
        relation.set("lastName", child.get("lastName"));
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
        id: 'setting-organizations-detail-students-add-byname-view',
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
