define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-organizations-detail-staff-add-byemail-view.hbs',
    'jquery',
    'spinner',
    'pgenerator',
    'parse'
], function(Chaplin, View, Template, $, spinner, pgenerator, Parse) {
    'use strict';
    var user;
    var selectedOrgId;
    var selectedOrgData;
    var userData;
    var firstName;
    var lastName;
    var pwd;
    var email;
    var initData = function() {
        user = _getUserData();
        selectedOrgId = user.setting.selectedOrgId;
        selectedOrgData = user.setting.selectedOrgData;
    }; //eo initData
    var initButtons = function() {
        $("#cancelBtn").on('click', function(e) {
            redirect();
        });
    }; //eo initButtons
    var generatedPassword = function(generatedPassword) {
        pwd = generatedPassword;
    };
    var initAddByEmail = function() {
        var ele = $('#submit');
        ele.pGenerator({ //put this here so that when submit is clicked a new pwd is generated before the actual submit callback
            'bind': 'click',
            'passwordLength': 7,
            'uppercase': true,
            'lowercase': true,
            'numbers': true,
            'specialChars': false,
            'onPasswordGenerated': generatedPassword
        });
        ele.on('click', function(e) { //grab entered data and then process
            firstName = $("#firstName").val();
            lastName = $("#lastName").val();
            email = $("#email").val().toLowerCase();
            addByEmail();
        });
    }; //eo initAddByEmail
    //Check if staff exist
    var addByEmail = function() {
        var deferred = null;

        function error(err) {
            deferred ? deferred.reject() : $.noop();
            spinner.hide();
            _alert("Internal error, addUser:" + err.message);
        }; //eo error
        function validate() {
            var flag = false;
            if (!firstName || !lastName || !email) {
                _alert("Please enter all fields");
            } else if (!_validateEmail(email)) {
                _alert("Please enter a valid email address");
            } else {
                flag = true;
            }
            return flag;
        }; //eo validate
        function hasUser() {
            var query = new Parse.Query(Parse.User);

            function success(d) {
                var user = d && d.length > 0 ? d[0] : null;
                var _firstName = user ? user.get('firstName') : null;
                var _lastName = user ? user.get('lastName') : null;
                var flag = !(_firstName || _lastName);

                function updateUser() { //have a user account but no names, update with entered data
                    user.set('firstName', firstName);
                    user.set('lastName', lastName);
                    user.save();
                    deferred.resolve(user);
                };

                function setUserNames() {
                    if (!user) {
                        return;
                    } //only use data if user exists
                    firstName = _firstName ? _firstName : firstName;
                    lastName = _lastName ? _lastName : lastName;
                    Parse.Cloud.run('modifyUser', {
                        userId: user.id,
                        firstName: firstName,
                        lastName: lastName
                    }, {
                        success: function(status) {
                            console.log('updated user success:' + JSON.stringify(status));
                            deferred.resolve(user);
                        },
                        error: function(error) {
                            console.log('updated user error:' + JSON.stringify(status));
                            deferred.resolve(user);
                        }
                    }); //eo Parse.Cloud.run modifyUser
                }; //eo setUserNames
                user && !_firstName && !_lastName ? setUserNames() : deferred.resolve(user);
                user && flag ? updateUser() : setUserNames();
            }; //eo success
            deferred = $.Deferred(); //initial deferred
            query.equalTo("email", email);
            query.find({
                success: success,
                error: error
            })
            return deferred;
        }; //eo hasUser()
        function createUser(user) { //use returned user data to either check for that person or create a new account
            deferred = $.Deferred();
            user ? deferred.resolve(user) : createAccount();
            return deferred;
        }; //eo createUser
        function createAccount() {
            function success(newUser) {
                // _alert("Successful User Account Creation for: " + email);
                //NOTE: email and pwd are created prior and have global/function scope
                var senderName = [user.firstName, user.lastName].join(' ');
                var organizationName = selectedOrgData.name ? selectedOrgData.name : 'ParentPlanet';
                var groupName = 'their staff';
                var who = [firstName, lastName].join(' ');
                var d = {
                    password: pwd,
                    username: email,
                    senderName: senderName,
                    who: who,
                    organizationName: organizationName,
                    groupName: groupName
                };

                Parse.Cloud.run('welcomeSender', d, {
                    success: function(result) { deferred ? deferred.resolve(newUser) : $.noop(); },
                    error: function(error) { deferred ? deferred.resolve(newUser) : $.noop(); }
                });
            };

            function error(user, err) {
                _alert('Error: Unable to Create User Account: ' + err.code + ' ' + err.message);
                deferred ? deferred.reject() : $.noop(); //create an account but what to do afterwards
            }
            _createUserAccount(email, pwd, success, error, firstName, lastName);
            spinner.hide();
        }; //eo createAccount
        var createRelation = function(user) {
            //Load relations
            var UserOrganizationRelation = Parse.Object.extend("UserOrganizationRelation");
            var relation = new UserOrganizationRelation();
            relation.set("userId", user.id);
            relation.set("organizationId", selectedOrgId);
            relation.set("position", "Teacher"); //Position is used for display student info to the user with the right permisson
            relation.set("permission", "teacher"); //Permission determine what this user can do to this org setting
            relation.set("relation", "staff"); //Relation is used in various interfaces and to determine the relationship between this child and org
            relation.set("organizationType", selectedOrgData.label);
            relation.set("firstName", firstName);
            relation.set("lastName", lastName);
            relation.save(null, { //deferred is defined in hasRelation, resolved here in use case of adding child to org
                success: function(relation) {
                    deferred.resolve();
                },
                error: function(relation, error) {
                    deferred.resolve();
                }
            });
        }; //eo createRelation
        function hasRelation(user) { //account exists add to organization etc.
            function handleStaffRelationship() {
                var UserOrganizationRelation = Parse.Object.extend("UserOrganizationRelation", {}, {
                    query: function() {
                        return new Parse.Query(this.className);
                    }
                });
                var query = UserOrganizationRelation.query();

                function success(results) {
                    if (results.length > 0) {
                        spinner.hide();
                        //  _alert("User:"+firstName+" "+lastName+" is already a staff member of this organization");
                        deferred.resolve();
                    } else {
                        createRelation(user);
                    }
                }; //eo success
                query.equalTo("organizationId", selectedOrgId);
                query.equalTo("userId", user.id);
                query.find({
                    success: success,
                    error: error
                });
            };
            deferred = $.Deferred();
            user ? handleStaffRelationship() : deferred.resolve();
            return deferred;
        }; //eo hasRelation
        function findAddUser() {
            spinner.show();
            hasUser() //locate a user by email address
                .then(createUser)
                .then(hasRelation)
                .always(redirect);
        }; //eo findAddUser
        //start chain here
        validate() ? findAddUser() : $.noop();
    }; //eo addByEmail

    var redirect = function() {
        spinner.hide();
        //   _notify('refresh').publish();
        Chaplin.utils.redirectTo({
            name: 'setting-organizations-detail-staff'
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