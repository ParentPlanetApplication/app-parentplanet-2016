define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-organizations-detail-staff-add-byid-view.hbs',
    'jquery',
    'spinner',
    'parse'
], function(Chaplin, View, Template, $, spinner, Parse) {
    'use strict';

    var user;
    var selectedOrgId;
    var selectedOrgData;
    var userData;

    var initData = function() {
        user = JSON.parse(localStorage.getItem("user"));
        selectedOrgId = user.setting.selectedOrgId;
        selectedOrgData = user.setting.selectedOrgData;
    }; //eo initData

    var initButtons = function() {
        $("#cancelBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-organizations-detail-staff-add'
            });
        });
    }; //eo initButtons

    var initAddById = function() {
        //ToDo
        //Test this!
        $("#submit").on('click', function(e) {
            addById();
        });
    }; //eo initAddById

    //Check if child exist
    var addById = function() {
        var id = $("#id").val();
        if (id == null || id == "") {
            _alert("Please enter user ID");
        } else {
            spinner.show();
            //Get User Object
            var query = new Parse.Query(Parse.User);
            query.equalTo("objectId", id);
            query.find({
                success: function(results) {
                    if (results.length == 0) {
                        _alert("No user found");
                        spinner.hide();
                    } else {
                        userData = results[0];
                        //Check if relation already exists
                        isRelationExist();
                    }
                },
                error: function(error) {
                    console.log(error);
                    spinner.hide();
                    _alert("There was an error connecting to the server, please try again");
                }
            }); //eo query.find
        } //eo else if id
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
        query.equalTo("userId", userData.id);
        query.find({
            success: function(results) {
                if (results.length != 0) {
                    _alert("This user is already listed as a staff member of this organization");
                    spinner.hide();
                } else {
                    //Add staff to organization
                    createRelation();
                }
            },
            error: function(error) {
                console.log(error);
                spinner.hide();
                _alert("There was an error connecting to the server, please try again");
            }
        }); //eo query.find
    }; //eo isRelationExist

    var createRelation = function() {
        //Load relations
        var UserOrganizationRelation = Parse.Object.extend("UserOrganizationRelation");
        var relation = new UserOrganizationRelation();
        relation.set("userId", userData.id);
        relation.set("organizationId", selectedOrgId);
        relation.set("position", "Teacher"); //Position is used for display student info to the user with the right permisson
        relation.set("permission", "teacher"); //Permission determine what this user can do to this org setting
        relation.set("relation", "staff"); //Relation is used in various interfaces and to determine the relationship between this child and org
        relation.set("organizationType", selectedOrgData.label);
        relation.set("firstName", userData.get("firstName"));
        relation.set("lastName", userData.get("lastName"));
        relation.save(null, {
            success: function(relation) {
                // Execute any logic that should take place after the object is saved.
                //_alert('New object created with objectId: ' + relation.id);

                redirect();
            },
            error: function(relation, error) {
                spinner.hide();
                // Execute any logic that should take place if the save fails.
                // error is a Parse.Error with an error code and message.
                _alert('Failed to add staff member to organization: ' + error.message);
            }
        });
    }; //eo createRelation

    var redirect = function() {
        spinner.hide();
        Chaplin.utils.redirectTo({
            name: 'setting-organizations-detail-staff'
        });
    }; //eo redirect

    var addedToDOM = function() {
        initData();
        initButtons();
        initAddById();
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
