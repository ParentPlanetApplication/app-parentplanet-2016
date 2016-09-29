define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-organizations-detail-students-add-byid-view.hbs',
    'jquery',
    'spinner',
    'parse'
], function(Chaplin, View, Template, $, spinner, Parse) {
    'use strict';

    var user;
    var selectedOrgId;
    var selectedOrgData;
    var childData;

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

    var initAddByChildId = function() {
        //ToDo
        //Test this!

        $("#submit").on('click', function(e) {
            addById();
        });
    }; //eo initAddByChildId

    //Check if child exist
    var addById = function() {

        var childId = $("#childId").val();

        if (childId == null || childId == "") {
            _confirm("Please enter child ID");
        } else {

            spinner.show();
            //Get Student Object
            var Child = Parse.Object.extend("Child", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var query = Child.query();
            query.equalTo("objectId", childId);
            query.find({
                success: function(results) {
                    if (results.length == 0) {
                        _confirm("No child found");
                        spinner.hide();
                    } else {
                        childData = results[0];
                        //Check if relation already exists
                        isRelationExist();
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

    //Check if relation already exist
    var isRelationExist = function() {
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
                    _confirm("The child is already added to this organization");
                spinner.hide();
                } else {

                    //Add child to organization
                    createRelation();
                }
            },
            error: function(error) {
                console.log(error);
                spinner.hide();
                _confirm("There was an error connecting to the server, please try again");
            }
        });
    }; //eo isRelationExist

    var createRelation = function() {
        //Load relations
        var UserOrganizationRelation = Parse.Object.extend("UserOrganizationRelation");
        var relation = new UserOrganizationRelation();

        relation.set("userId", childData.id);
        relation.set("organizationId", selectedOrgId);
        relation.set("position", "Student"); //Position is used for display student info to the user with the right permisson
        relation.set("permission", "student"); //Permission determine what this user can do to this org setting
        relation.set("relation", "student"); //Relation is used in various interfaces and to determine the relationship between this child and org
        relation.set("organizationType", selectedOrgData.label);
        relation.set("firstName", childData.get("firstName"));
        relation.set("lastName", childData.get("lastName"));

        relation.save(null, {
            success: function(relation) {
                // Execute any logic that should take place after the object is saved.
                //_confirm('New object created with objectId: ' + relation.id);

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

    var redirect = function() {
        spinner.hide();
        Chaplin.utils.redirectTo({
            name: 'setting-organizations-detail-students'
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
        id: 'setting-organizations-detail-students-add-byid-view',
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
