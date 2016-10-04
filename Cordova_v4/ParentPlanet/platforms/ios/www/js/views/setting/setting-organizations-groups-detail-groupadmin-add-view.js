define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-organizations-groups-detail-groupadmin-add-view.hbs',
    'jquery',
    'spinner',
    'parse'
], function(Chaplin, View, Template, $, spinner, Parse) {
    'use strict';

    var user; //this is for the person/admin filling in the form
    var selectedOrgId;
    var selectedOrgData;
    var selectedGroupId;
    var selectedGroupData;
    var relationDataArray;
    var userId = null; //this is for the newly created admin
    var email;
    var firstName;
    var lastName;
    var pwd = null;

    var initData = function() {
        user = _getUserData();
        selectedOrgId = user.setting.selectedOrgId;
        selectedOrgData = user.setting.selectedOrgData;
        selectedGroupId = user.setting.selectedOrgGroupId;
        selectedGroupData = user.setting.selectedOrgGroupData;
        relationDataArray = user.setting.addStaff.relationDataArray;
    }; //eo initData
    var initAddByEmail = function() {
        var ele = $('#submit');
        ele.pGenerator({ //put this here so that when submit is clicked a new pwd is generated before the actual submit callback
            'bind': 'click',
            'passwordLength': 7,
            'uppercase': true,
            'lowercase': true,
            'numbers':   true,
            'specialChars': false,
            'onPasswordGenerated': generatedPassword
        });
        ele.on('click', function(e) {
            firstName = $("#firstName").val();
            lastName = $("#lastName").val();
            email = $("#email").val().toLowerCase();
            addByEmail();
        });
    }; //eo initAddByEmail
    var generatedPassword = function(generatedPassword) {
        pwd = generatedPassword;
       // console.log('pwd:',pwd);
    };
    var redirect = function() {
        spinner.hide();
        Chaplin.utils.redirectTo({    name: 'setting-organizations-groups-detail-groupadmin'    });
    }; //eo redirect
    var initButtons = function() {
        $("#backBtn").on('click', function(e) {    redirect();    });
        $("#addFromOrgBtn").on('click', function(e) {
            $(this).addClass("bg-highlight-grey");
            setTimeout(function() {
                Chaplin.utils.redirectTo({
                    name: 'setting-organizations-groups-detail-groupadmin-add-fromorg'
                });
            }, DEFAULT_ANIMATION_DELAY);
        });
    }; //eo initButtons
    var addByEmail = function() {
        var flag = false;
        var deferred = null;
        function error(err) {
            deferred ? deferred.reject() : $.noop();
            spinner.hide();
            _alert("Internal error, addByEmail:"+err.code+" "+err.message);
        }; //eo error
        function validate() {
            var flag = false;
            if (email === null || email === "") {
                _alert("Please enter a user email");
            } else if(!_validateEmail(email)){
                _alert("Please enter a valid email address");
            } else if (firstName === null || firstName === "" || lastName === null || lastName === "") {
                _alert("Please enter all fields");
            } else { flag = true; }
            return flag;
        }; //eo validate
        function hasUser() {
            var query = new Parse.Query(Parse.User);
            function success(d) {
                var user = d && d.length > 0 ? d[0] : null;
                var _firstName = user ? user.get('firstName') : null;
                var _lastName = user ? user.get('lastName') : null;
                var flag = !(_firstName || _lastName);
                function updateUser() {
                    user.set('firstName', firstName);
                    user.set('lastName', lastName);
                    user.save();
                    deferred.resolve(d);
                };
                function setUserNames() {
                    if(!user) { return; } //only use data if user exists
                    firstName = _firstName ? _firstName : firstName;
                    lastName = _lastName ? _lastName : lastName;
                    Parse.Cloud.run('modifyUser', { userId:userId, firstName:firstName, lastName:lastName },
                        {
                          success: function(status) {
                            console.log('updated user success:'+JSON.stringify(status));
                            deferred.resolve(d);
                        },
                          error: function(error) {
                            console.log('updated user error:'+JSON.stringify(status));
                            deferred.resolve(d);
                        }
                    }); //eo Parse.Cloud.run modifyUser
                }; //eo setUserNames
                userId = user ? user.id : userId; //if a user exists, use the 'shadow' user object
                user && !_firstName && !_lastName ? setUserNames() : deferred.resolve(d);
            }; //eo success
            deferred = $.Deferred(); //initial deferred
            query.equalTo("email", email);
            query.find({success:success, error:error})
            return deferred;
        }; //eo hasUser()
        function createUser(d) { //use returned user data to either check for that person or create a new account
            deferred = $.Deferred();
            d.length > 0 ? deferred.resolve(d) : createAccount();
            return deferred;
        }; //eo createUser
        function createAccount() {
            function success(results) { // _createUserAccount resturns an obj. not an array
               // _alert("Successful User Account Creation for: " + email);
               //NOTE: email and pwd are created prior and have global/function scope
                var senderName = [user.firstName, user.lastName].join(' ');
                var organizationName = selectedOrgData.name ? selectedOrgData.name : 'ParentPlanet';
                var groupName = selectedGroupData.name;
                var who = firstName + ' ' + lastName;
                var d = { password:pwd, username:email, senderName:senderName, who:who, organizationName:organizationName, groupName:groupName};
                var arr = results ? [results] : []; //downstream needs an array
                Parse.Cloud.run('welcomeSender', d, {
                  success: function(result) {
                    deferred ? deferred.resolve(arr) : $.noop();
                },
                  error: function(error) {
                    deferred ? deferred.resolve(arr) : $.noop();
                }
                });
            };
            function error(user, err) {
                _alert('Error: Unable to Create User Account: '+err.code+ ' ' + err.message);
                deferred ? deferred.reject() : $.noop(); //create an account but what to do afterwards
            };
            _createUserAccount(email, pwd, success, error, firstName, lastName);
        }; //eo createAccount
        function hasRelation(d) { //account exists add to organization etc.
            var user = d && d.length > 0 ? d[0] : null;
            function handleUserRelationship() {
                var UserOrganizationRelation = Parse.Object.extend("UserOrganizationRelation", {}, {
                  query: function(){
                    return new Parse.Query(this.className);
                  }
                });
                var query = UserOrganizationRelation.query();
                function success(results) {
                    if(results.length > 0) {
                     //   _alert("User:"+firstName+" "+lastName+" is already a member of this organization");
                        deferred ? deferred.resolve() : $.noop();
                    } else {
                        createRelation();
                    }
                }; //eo success
                /*
                * userId very important!
                */
                userId = user.id; //declared in top level scope
                query.equalTo("organizationId", selectedOrgId);
                query.equalTo("userId", userId);
                query.find({success:success, error:error});
            };
            deferred = $.Deferred();
            user ? handleUserRelationship() : deferred.reject();
            return deferred;
        }; //eo hasRelation
        var createRelation = function() {
            //Load relations
            var UserOrganizationRelation = Parse.Object.extend("UserOrganizationRelation");
            var relation = new UserOrganizationRelation();
            relation.set("userId", userId);
            relation.set("organizationId", selectedOrgId);
            relation.set("position", "Teacher"); //Position is used for display student info to the user with the right permisson
            relation.set("permission", "teacher"); //Permission determine what this user can do to this org setting
            relation.set("relation", "staff"); //Relation is used in various interfaces and to determine the relationship between this child and org
            relation.set("organizationType", selectedOrgData.label);
            relation.set("firstName", firstName);
            relation.set("lastName", lastName);
            relation.save(null, { //deferred is defined in hasRelation, resolved here in use case of adding child to org
                success: function(relation) { deferred.resolve(); },
                error: function(relation, err) {
                    _alert('Error, create UserOrganizationRelation:'+err.code+" "+err.message);
                    deferred.reject();
                }
            });
        }; //eo createRelation
        function hasGroupRelation() { //account exists add to organization etc.
            function handleUserRelationship() {
                var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation", {}, {
                  query: function(){
                    return new Parse.Query(this.className);
                  }
                });
                var query = UserOrganizationGroupRelation.query();
                function success(results) {
                    if(results.length > 0) {
                     //   _alert("User:"+firstName+" "+lastName+" is already a member of this group");
                        deferred ? deferred.resolve() : $.noop();
                    } else {
                        createGroupRelation();
                    }
                }; //eo success
                /*
                * userId very important!
                */
                query.equalTo("organizationGroupId", selectedGroupId);
                query.equalTo("userId", userId);
                query.find({success:success, error:error});
            };
            deferred = $.Deferred();
            user ? handleUserRelationship() : deferred.reject();
            return deferred;
        }; //eo hasRelation
        function createGroupRelation() {
            //Add staff to the selected group
            var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation");
            var relation = new UserOrganizationGroupRelation();
            var groupName = selectedGroupData.name;
            var success = function(relation) {
                createRecipientList()
                .then(addAsAdmin)
                .always(function() {
                    redirect();
                });
            };
            var error = function(relation, err) {
                _alert("Internal error, addGroupRelation:"+err.code+" "+err.message);
                deferred.reject();
            };
            deferred = $.Deferred();
            relation.set("organizationGroupId", selectedGroupId);
            relation.set("userId", userId);
            relation.set("relationType", "staff");
            relation.set("position", "Administrator");
            relation.set("groupName", groupName);
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
                success: success,
                error: error
            });
            return deferred;
        }; //eo addGroupRelation
        var createRecipientList = function() {
            var recipientList = [];
            var parentIndex = []; //only add parentId once while looping through students relations
            //Find all students of the selected group
            var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var query = UserOrganizationGroupRelation.query();
            var deferred = $.Deferred(); //this is used far, far down
            function success(results) {
                //Collect user id of these students
                var studentUserIdArray = [];
                var studentRelation;
                var UserParentRelation = Parse.Object.extend("UserParentRelation", {}, {
                  query: function(){
                    return new Parse.Query(this.className);
                  }
                });
                var query = UserParentRelation.query();
                $.each(results, function(i, studentRelation) {
                    var id = studentRelation.get("userId");
                    studentUserIdArray.push(id);
                });
                //Find parents of these students
                query.containedIn("childId", studentUserIdArray);
                query.find({
                    success: function(results) {
                        //Create json object that contains parent-children information
                        var relation;
                        $.each(results, function(i, relation) {
                            var json, index;
                            var parentId = relation.get("parentId");
                            var childId = relation.get("childId");
                            if (parentIndex.indexOf(parentId) < 0) {
                                parentIndex.push(parentId);
                                json = {};
                                json.parent = parentId;
                                json.children = [];
                                json.children.push(childId);
                                recipientList.push(json);
                            } else {
                                index = parentIndex.indexOf(parentId);
                                json = recipientList[index];
                                json.children.indexOf(childId) < 0 ? json.children.push(childId) : $.noop();
                            }
                        }); //eo each
                        //Check results
                        //console.log(recipientList);
                        createUserContactEmailList(userId, recipientList, parentIndex)
                        .always(function() {
                            deferred.resolve(); //top scope one
                        });
                    },
                    error: function() { deferred.resolve(); }
                }); //eo inner query.find
            }; //eo success
            query.equalTo("organizationGroupId", selectedGroupId);
            query.equalTo("relationType", "student");
            query.find({    success: success, error: error    }); //eo query.find
            return deferred;
        }; //eo createRecipientList
        var createUserContactEmailList = function(userId, recipientList, parentIndex) {
            var userContactEmail = [];
            var query = new Parse.Query(Parse.User);
            var deferred = $.Deferred(); //shadow deferred that takes us back up the tree to recipientList
            query.containedIn("objectId", parentIndex);
            query.find({
                success: function(results) {
                    $.each(results, function(i, parent) {
                        var parentEmail = parent.get("email");
                        if (parent.get("isEmailDelivery") && userContactEmail.indexOf(parent.id) === -1) {
                            userContactEmail.push(parentEmail);
                        }
                    });
                    hasCustomList(userId, recipientList, userContactEmail)
                    .always(function() {
                        deferred.resolve();
                    });
                },
                error: function(error) {    deferred.resolve();    }
            });
            return deferred;
        }; //eo createUserContactEmailList
        var hasCustomList = function(userId, recipientList, userContactEmail) { //end of the chain here :)
            var deferred = $.Deferred(); //shadow deferred that takes us back up the tree to recipientList
            var UserCustomList = Parse.Object.extend("UserCustomList", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var query = UserCustomList.query();
            query.equalTo("groupId", selectedGroupId);
            query.equalTo("ownerId", userId);
            query.find({
                success: function(results) {
                    function createCustomList() {
                       var customList = new UserCustomList();
                        customList.set("type", "OrganizationGroup");
                        customList.set("organizationId", selectedOrgId);
                        customList.set("groupId", selectedGroupId);
                        customList.set("groupType", selectedGroupData.groupType);
                        customList.set("name", selectedGroupData.name);
                        customList.set("ownerId", userId);
                        customList.set("nonUserContactEmail", []); //Only use for custom list created from my groups
                        customList.set("userContactId", []); //Only use for custom list created from my groups
                        customList.set("userContactEmail", userContactEmail);
                        customList.set("recipientList", recipientList);
                        customList.save(null, {
                            success: function(customList) { deferred.resolve(); },
                            error: function(customList, err) {
                                // Execute any logic that should take place if the save fails.
                                // error is a Parse.Error with an error code and message.
                                //alert('Failed to add child to organization: ' + error.message);
                                _alert("Error, could not create a new custom list:"+err.code+" "+err.message);
                                deferred.resolve();
                            } //eo error
                        }); //eo customList.save
                    }; //eo createCustomList
                    results.length > 0 ? $.noop() : createCustomList();
                },
                error: function(error) {    deferred.resolve();    }
            });
            return deferred;
        }; //eo createCustomList
        var addAsAdmin = function() { //very last method called in the chain
            var OrganizationGroup = Parse.Object.extend("OrganizationGroup", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var query = OrganizationGroup.query();
            var deferred = $.Deferred();
            function success(results) {
                var group = results[0];
                var adminIdList = group.get("adminIdList");
                var adminJsonList = group.get("adminJsonList");
                adminIdList = adminIdList ? adminIdList : [];
                adminJsonList = adminJsonList ? adminJsonList : {};
                adminIdList.push(userId);
                adminJsonList[userId] = '';
                group.save(null, {
                    success: function() {deferred.resolve();},
                    error:error}
                );

            }; //eo success
            function error(err) {
                _alert('Error addAsAdmin:'+err.code+" "+err.message);
                deferred.resolve(); //could be reject, this is the last step
            };
            query.equalTo("objectId", selectedGroupId);
            query.find({ success: success, error: error });
            return deferred;
        }; //eo addAsAdmin
        /*
        * MAIN CHAIN STARTS HERE
        */
        function findAddUser() {
            spinner.show();
            hasUser() //locate a user by email address
            .then(createUser)
            .then(hasRelation)
            .then(hasGroupRelation)
            .then(createGroupRelation);
        }; //eo findAddUser
        spinner.show();
        //start chain here
        validate() ? findAddUser() : $.noop();
    }; //eo addByEmail

    var validateEmail = function(email) {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }; //eo validateEmail

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
        id: 'setting-organizations-groups-detail-groupadmin-add-view',
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
