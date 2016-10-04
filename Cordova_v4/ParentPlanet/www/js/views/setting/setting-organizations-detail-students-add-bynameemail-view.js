define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-organizations-detail-students-add-bynameemail-view.hbs',
    'jquery',
    'spinner',
    'parse'
], function(Chaplin, View, Template, $, spinner, Parse) {
    'use strict';

    var user;
    var userId = null;
    var selectedOrgId;
    var selectedOrgData;
    var childId;
    var parentId;
    var firstName;
    var lastName;
    var pwd;
    var email;
    var parent;
    var child;
    var deferred = null;
    var userParentRelation;

    var initData = function() {
        user = _getUserData(); //this is the signed in user who is adding the parent/child
        selectedOrgId = user.setting.selectedOrgId;
        selectedOrgData = user.setting.selectedOrgData;
        childId = null;
        userParentRelation = null;
    }; //eo initData

    var redirect = function() {
        spinner.hide();
        setTimeout(function() {    Chaplin.utils.redirectTo({    name: 'setting-organizations-detail-students'    });
        }, DEFAULT_ANIMATION_DELAY);
    }; //eo redirect

    var error = function(err) {
        deferred ? deferred.reject() : $.noop();
        spinner.hide();
        _alert("Internal error, addUser:"+err.message);
    };
    var initButtons = function() {
        $("#cancelBtn").on('click', function(e) {
            redirect();
        });
    }; //eo initButtons
    var generatedPassword = function(generatedPassword) {    pwd = generatedPassword;    };
    var initAddByNameEmail = function() {
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
        ele.on('click', function(e) { //grab entered data and then process
            firstName = $("#firstName").val();
            lastName = $("#lastName").val();
            email = $("#email").val().toLowerCase();
            addByName();
        });
    }; //eo initAddByEmail

    var addByName = function() {
         //chain of actions
        /*
        * validate -> Yes, continue
        * hasUser
        * createUser - createAccount
        * hasChild
        * createChild - createChildAccount
        * hasRelation
        */
        function validate() {
            var flag = false;
            if (!firstName || !lastName || !email) {
                _alert("Please enter all fields");
            } else if(!_validateEmail(email)){
                _alert("Please enter a valid email address");
            } else { flag = true; }
            return flag;
        }; //eo validate
        function hasUser() { //this is a query for the parent (email) of the child (firstName, lastName)
            var query = new Parse.Query(Parse.User);
            function success(d) { //simply set the userId and pass along the data returned if a parent has been found
                var parent = d && d.length > 0 ? d[0] : null; //found an existing parent, set userId
                userId = parent ? parent.id : userId; //top scope for other methods
                deferred.resolve(d); //pass result on to create account etc.
            };
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
            function success(parent) {
               // _alert("Successful User Account Creation for: " + email);
               //NOTE: email and pwd are created prior and have global/function scope
                var senderName = [user.firstName, user.lastName].join(' ');
                var organizationName = selectedOrgData.name ? selectedOrgData.name : 'ParentPlanet';
                var groupName = '';
                var who = [firstName, lastName].join(' '); // student name
                var d = { password:pwd, username:email, senderName:senderName, who:who, organizationName:organizationName, groupName:groupName};
                var arr = parent ? [parent] : []; //downstream needs an array
                userId = parent ? parent.id : userId; //top scope for other methods
                Parse.Cloud.run('welcomeSender', d, {
                  success: function(result) {     deferred ? deferred.resolve(arr) : $.noop();    },
                  error: function(error) {     deferred ? deferred.resolve(arr) : $.noop();     }
                });
            }; //eo success
            function error(user, err) {
                _alert('Error: Unable to Create User Account: '+err.code+ ' ' + err.message);
                deferred ? deferred.reject() : $.noop(); //create an account but what to do afterwards
            }; //eo error
           // _createUserAccount(email, pwd, success, error, firstName, lastName);
            _createUserAccount(email, pwd, success, error, null, null); //first/lastName are for the child and not the parent, set to null
            spinner.hide();
        }; //eo createAccount
        function hasChild(d) {
            var UserParentRelation = Parse.Object.extend("UserParentRelation", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var query = UserParentRelation.query();
            function success(results) { //results is an array of child obj.; actually one child [child]
                userParentRelation = results.length > 0 ? results[0] : null;
                childId = userParentRelation ? userParentRelation.get('childId') : null;
                deferred ? deferred.resolve(results) : $.noop(); //pass relation array! along
            };
            function error(results) {
                deferred ? deferred.reject(null) : $.noop();
            };
            parent = d && d.length > 0 ? d[0] : null;
            deferred = $.Deferred(); //initial deferred
            parentId = parent && parent.id ? parent.id : deferred.reject();
            query.equalTo("parentId", parentId);
            query.containedIn("childFirstName", _containedIn(firstName));
            query.containedIn("childLastName", _containedIn(lastName));
            query.find({success:success, error:error})
            return deferred;
        }; //eo hasChild
        function createChildUser(d) { //user returned user data to either check for that person or create a new account
            deferred = $.Deferred(); //d is an array with a userParentRelation from hasChild or empty array
            d.length > 0 ? deferred.resolve(d) : createChildAccount(); //pass along the child array, or create one
            return deferred;
        }; //eo createUser
        function createChildAccount() {
            var colors = ['#439a9a','#fc8d59','#ef6548','#d7301f','#b30000','#41b6c4','#1d91c0','#225ea8','#253494','#081d58'];
            var colorIndex = Math.floor(Math.random()*colors.length); //
            var color = colors[colorIndex];
            //Create child data on server
            var Child = Parse.Object.extend("Child");
            var child = new Child();
            function success(child) {
                //Create parent-child relation
                var UserParentRelation = Parse.Object.extend("UserParentRelation");
                var relation = new UserParentRelation();
                childId = child.id;
                relation.set("childFirstName", child.get("firstName"));
                relation.set("childLastName", child.get("lastName"));
                relation.set("color", child.get("color"));
                relation.set("parentId", parentId);
                relation.set("childId", childId);
               // console.log(child.get("firstName"))
                relation.save(null, {
                    success: function(relation) {
                        userParentRelation = relation ? relation : null;
                        deferred ? deferred.resolve([relation]) : $.noop();
                    },
                    error: function(child, error) {
                        deferred ? deferred.reject() : $.noop();
                        console.log('Failed to create new UserParentRelation, with error code: ' + error.message);
                    }
                }); //eo relation.save
            }; //eo success
            child.set("firstName", firstName);
            child.set("lastName", lastName);
            child.set("isUser", false);
            child.set("creatorParentId", parentId);
            child.set("color", color);
            child.save(null, {
                success: success,
                error: function(child, error) {
                    console.log('Failed to create new Child, with error code: ' + error.message);
                }
            }); //eo child.save
        }; //eo createChildAccount
        function createRelation() {
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
            relation.save(null, { //deferred is defined in hasRelation, resolved here in use case of adding child to org
                success: function(relation) {
                    deferred.resolve();
                },
                error: function(relation, error) { deferred.resolve();}
            });
        }; //eo createRelation
        var hasRelation = function(d) { //Check if relation already exist
            var flag = d && d.length > 0 ? true : false; //if we are passed some data then we are ready to add the child to the organization
            function handleChildRelationship() {
                var UserOrganizationRelation = Parse.Object.extend("UserOrganizationRelation", {}, {
                  query: function(){
                    return new Parse.Query(this.className);
                  }
                });
                var query = UserOrganizationRelation.query();
                function success(results) {
                    if (results.length > 0) {
                        _alert("Student:"+firstName+" "+lastName+" has already been added to this organization");
                        deferred.resolve();
                    } else { //Add child to organization
                        createRelation();
                    }
                }; //eo success

                query.equalTo("organizationId", selectedOrgId);
                query.equalTo("userId", childId); //needs to be set
                query.find({ success: success, error: error });
            }; //eo handleChildRelationship
            deferred = $.Deferred();
            flag ? handleChildRelationship() : deferred.resolve();
            return deferred;
        }; //eo isRelationExist


        /*
        * MAIN CHAIN STARTS HERE
        */
        //queue up all the parents who may have linked to this email address; treat each individually

        function checkForLinkedUser() {
            var parents = [{email:email, id:null}];
            var len;
            var child = null;
            var _email = null;
            var checkForChild = function() { //parents = {email, id}
                $.each(parents, function(i, parent) { //see if any parent matches with the child
                    hasChild(parent)
                    .then(function(d) { //have a child, set the parent's email to what will be used in findAddUser
                        child = d.length > 0 ? d[0] : null;
                        _email = child ? parent.email : null;
                    });
                    if(child) { //if a child, then set top scope email to parent one and break loop
                        email = _email;
                        childId = child.id; //no this is a relation opbject
                        return false;
                    } //break out of the loop, if this is never entered then email stays what was entered by the user
                });
            }; //eo checkForChild
            var queue = function(i) { //old code, use checkForChild instead
                var parent = parents[i];
                var parentEmail = parent.email;
                var id = parent.id;
                var done = false;
                function fail() {
                    i++;
                    if(i < len) {
                        queue(i);
                    } else {
                        findAddUser() //this will always be resolved
                        .then(function() {
                            var name = firstName + ' ' + lastName;
                            var flag = selectedOrgData && selectedOrgData.name ;
                            var orgName = flag ? selectedOrgData.name : 'Organization';
                            _alert(name + ' Successfully Added to ' + orgName);
                            redirect();
                        });
                    }
                    done = i < len ? false : true;
                }; //eo fail
                userId = id ? id : null;
                id ? $.noop() : fail();
                if(done) { return; }
                hasChild([parent])
                .then(function(d) { //have a child, set the parent's email to what will be used in findAddUser
                    if(d.length>0)  {
                        email = parent.email;
                        findAddUser() //this will always be resolved
                        .then(function() {
                            var name = firstName + ' ' + lastName;
                            var flag = selectedOrgData && selectedOrgData.name ;
                            var orgName = flag ? selectedOrgData.name : 'Organization';
                            _alert(name + ' Successfully Added to ' + orgName);
                            redirect();
                        });
                    } else {
                        i++;
                        if(i < len) {
                            queue(i);
                        } else {
                            findAddUser() //this will always be resolved
                            .then(function() {
                                var name = firstName + ' ' + lastName;
                                var flag = selectedOrgData && selectedOrgData.name ;
                                var orgName = flag ? selectedOrgData.name : 'Organization';
                                _alert(name + ' Successfully Added to ' + orgName);
                                redirect();
                            });
                        }
                    }
                })
                .fail(fail);
            }; //eo queue
            _getParentEmailGivenAccessUserEmail(email)
            .then(function(d) {
                if(d.length > 0) {
                    parents[0].id = d[0].givenAccessUserId;
                    parents = parents.concat(d);
                }
                len = parents.length;
               // checkForChild();
                queue(0);
            });
        };
        function findAddUser() {
            var deferred = $.Deferred();
            spinner.show();
            hasUser() //locate a user by email address
            .then(createUser)
            .then(hasChild)
            .then(createChildUser)
            .then(hasRelation)
            .always(function() {
                deferred.resolve(); //always resolve no matter what so that we can advance in the queue
            });
            return deferred;
        }; //eo findAddUser
        //start chain here
        validate() ? checkForLinkedUser() : $.noop();
    }; //eo addByName

    var addedToDOM = function() {
        initData();
        initButtons();
        initAddByNameEmail();
    }; //eo addedToDOM
    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: 'setting-organizations-detail-students-add-bynameemail-view',
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
