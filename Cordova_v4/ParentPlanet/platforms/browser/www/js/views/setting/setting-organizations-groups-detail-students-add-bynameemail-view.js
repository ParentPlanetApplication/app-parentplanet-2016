define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-organizations-groups-detail-students-add-bynameemail-view.hbs',
    'jquery',
    'spinner',
    'pgenerator',
    'parse'
], function(Chaplin, View, Template, $, spinner, pgenerator, Parse) {
    'use strict';

    var user;
    var userId = null;
    var selectedOrgId;
    var selectedOrgData;
    var selectedOrgGroupId;
    var selectedOrgGroupData;
    var parent;
    var childId;
    var parentId;
    var firstName;
    var lastName;
    var pwd;
    var email;
    var child;
    var deferred = null;
    var promises = []; //use $.when.apply($,promises).done()
    var userParentRelation;
    var redirect = function() {
        spinner.hide();
        setTimeout(function() {    Chaplin.utils.redirectTo({    name: 'setting-organizations-groups-detail-students'    });
        }, DEFAULT_ANIMATION_DELAY);
    }; //eo redirect
    var initData = function() {
        user = _getUserData();
        selectedOrgId = user.setting.selectedOrgId;
        selectedOrgData = user.setting.selectedOrgData;
        selectedOrgGroupId = user.setting.selectedOrgGroupId;
        selectedOrgGroupData = user.setting.selectedOrgGroupData;
        childId = null;
        userParentRelation = null;

    }; //eo initData
    var error = function(err) {
        deferred ? deferred.reject() : $.noop();
        spinner.hide();
        _alert("Internal error, addUser:"+err.message);
    };
    var initButtons = function() {
        $("#cancelBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({    name: 'setting-organizations-groups-detail-students'    });
        });
    }; //eo initButtons
    var generatedPassword = function(generatedPassword) {
        pwd = generatedPassword;
       // console.log('pwd:',pwd);
    };
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
        ele.on('click', function(e) { //bind form fields to model vars
            firstName = $("#firstName").val();
            lastName = $("#lastName").val();
            email = $("#email").val().toLowerCase();
            addByNameEmail();
        });
    }; //eo initAddByEmail
    /*
    * MAIN HERE
    */
    var addByNameEmail = function() {
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
        function hasUser() {
            var query = new Parse.Query(Parse.User);
            function success(d) { //simply set the userId and pass along the data returned if a parent has been found
                var parent = d && d.length > 0 ? d[0] : null; //found an existing parent, set userId
                userId = parent ? parent.id : userId; //top scope for other methods
                parentId = userId; //hmmm OK, try this
                deferred.resolve(d); //pass result on to create account etc.
            };
            deferred = $.Deferred(); //initial deferred
            query.equalTo("email", email);
            query.find({success:success, error:error})
            return deferred;
        }; //eo hasUser()
        function createUser(d) { //use returned parent data to either check for that person or create a new account
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
                var groupName = selectedOrgGroupData.name;
                var who = firstName + ' ' + lastName; //student name
                var d = { password:pwd, username:email, senderName:senderName, who:who, organizationName:organizationName, groupName:groupName};
                var arr = parent ? [parent] : []; //downstream needs an array
                userId = parent ? parent.id : userId; //top scope for other methods
                parentId = userId;
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
            //set in either createAccount or hasUser
            //  parent = d && d.length > 0 ? d[0] : null;
            deferred = $.Deferred(); //initial deferred
            //parentId = parent && parent.id ? parent.id : deferred.reject();
            query.equalTo("parentId", userId);
            query.containedIn("childFirstName", _containedIn(firstName));
            query.containedIn("childLastName", _containedIn(lastName));
            query.find({success:success, error:error})
            return deferred;
        }; //eo hasChild
        function createChildUser(d) { //use returned user data to either check for that person or create a new account
            deferred = $.Deferred();
            d.length > 0 ? deferred.resolve(d) : createChildAccount();
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
                    success: function(relation) {    deferred ? deferred.resolve([child]) : $.noop();    },
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
        function hasRelation(d) { //account exists add to organization etc.
            var flag = d && d.length > 0 ? true : false; //if we are passed some data then we are ready to add the child to the organization
           // var child = d && d.length > 0 ? d[0] : null;
            function handleChildRelationship() {
                var relationOrChild = d[0]; //this data object can be either a userParentRelation OR a Child object!!
                var id = relationOrChild.get("childId"); //
                childId = id ? id : relationOrChild.id; //test to see which type of data obj. this is and set childId accordingly
                getParent(relationOrChild) //do not pass the array
                .then(function() {
                    return isRelationExist(relationOrChild);
                })
                .always(function() {
                    deferred.resolve();
                }); //eo hasRelation chain
            }; //eo handleChildRelationship
            deferred = $.Deferred();
            flag ? handleChildRelationship() : deferred.resolve();
            return deferred;
        }; //eo hasRelation add child to all parents

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
                            var flag = selectedOrgData && selectedOrgData.name && selectedOrgGroupData && selectedOrgGroupData.name;
                            var orgName =  flag ? selectedOrgData.name + ' ' + selectedOrgGroupData.name : 'Organization Group';
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
                            var flag = selectedOrgData && selectedOrgData.name && selectedOrgGroupData && selectedOrgGroupData.name;
                            var orgName =  flag ? selectedOrgData.name + ' ' + selectedOrgGroupData.name : 'Organization Group';
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
                                var flag = selectedOrgData && selectedOrgData.name && selectedOrgGroupData && selectedOrgGroupData.name;
                                var orgName =  flag ? selectedOrgData.name + ' ' + selectedOrgGroupData.name : 'Organization Group';
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
        }; //eo checkForLinkedUser

        function findAddUser() {
            var deferred = $.Deferred();
            spinner.show();
            hasUser() //locate a user by email address
            .then(createUser)
            .then(hasChild)
            .then(createChildUser)
            .then(hasRelation)
            .always(function() {
                deferred.resolve();
            });
            return deferred;
        }; //eo findAddUser
        //start chain here
        validate() ? checkForLinkedUser() : $.noop();
    }; //eo addByNameEmail
    var getParent = function(d) {
        var UserParentRelation = Parse.Object.extend("UserParentRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserParentRelation.query();
        var deferred = $.Deferred(); //local to be added to promises array
        function success(results) {
            var promises = [];
            $.each(results, function(i, parent) {
                var deferredParentEmail = $.Deferred();
                parentId = parent.get("parentId"); //set in upper scope for each parent attached
                deferredParentEmail = getParentEmail(d);
                promises.push(deferredParentEmail);
                deferredParentEmail.done(function(){
                    deferredParentEmail = _addOldEvents(selectedOrgGroupId, childId, parentId, selectedOrgId);
                    promises.push(deferredParentEmail);
                    deferredParentEmail = _addOldHomework(selectedOrgGroupId, childId, parentId, selectedOrgId);
                    promises.push(deferredParentEmail);
                });
            });
            $.when.apply($, promises).always(function() {
                deferred.resolve();
            });
        }; //eo success
        function error(err) {
            _alert('Error getParent:'+err.code+' '+err.message);
            deferred.resolve();
        };
        query.equalTo("childId", childId);
        query.find({success:success, error:error});
        return deferred;
    }; //eo getParent
    var getParentEmail = function(d) {
        var parentEmail;
        var query = new Parse.Query(Parse.User);
        var deferred = $.Deferred(); //local to be added to promises array
        function success(results) {
            var parentUser = results[0];
            parentEmail = parentUser.get("isEmailDelivery") ? parentUser.get("email") : parentEmail;
            addToCustomList(d, parentEmail).always(function () {
                //Add parent email and secondary parent to UserCustomList table
                var deferredParentEmail = _addParentEmail(parentId, user.setting.selectedOrgGroupId);
                deferredParentEmail.done(function(){
                    deferred.resolve();
                });
            });
        };
        function error(err) {
            _alert('Error getParentEmail:'+err.code+' '+err.message);
            deferred.resolve();
        };
        query.equalTo("objectId", parentId);
        query.find({success:success, error:error });
        return deferred;
    }; //eo getParentEmail
    var addToCustomList = function(child, parentEmail) {
        var UserCustomList = Parse.Object.extend("UserCustomList", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserCustomList.query();
        var deferred = $.Deferred();
        function success(results) {
            $.each(results, function(i, customGroup) {
                var o;
                var recipientList = customGroup.get("recipientList");
                var recipient = jQuery.grep(recipientList, function(n) {
                    return n.parent == parentId;
                });
                if (recipient.length === 0) {
                    o = {children: [childId], parent: parentId};
                    recipientList.push(o);
                } else {
                    recipient[0].children.indexOf(childId) === -1 ? recipient[0].children.push(childId) : $.noop();
                }
                parentEmail ? customGroup.addUnique("userContactEmail", parentEmail) : $.noop();
                customGroup.save();
            }); //eo each
            deferred.resolve();
        }; //eo success
        function error(err) {
            _alert('Error addToCustomList:'+err.code+' '+err.message);
            deferred.resolve();
        };
        query.equalTo("groupId", selectedOrgGroupId);
        query.find({ success:success, error: error });
        return deferred;
    }; //eo addToCustomList
    //Check if relation already exist
    var isRelationExist = function(d) {
        var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserOrganizationGroupRelation.query();
        var deferred = $.Deferred();
        function success(results) {
            if (results.length > 0) {
                _confirm(firstName + " " + lastName + " has already been added to this group.");
                deferred.resolve();
            } else { //Add child to organization
                isOrgRelationExist(d)
                .then(function() {
                    return addToOrgGroup(d);
                })
                .then(function() {
                    return createRelation(d);
                })
                .always(function() {
                    deferred.resolve();
                });
            } //eo else add child
        }; //eo success
        function error(err) {
            console.log('Error isRelationExist:'+err.code+' '+err.message);
            deferred.resolve();
            //alert("There was an error connecting to the server, please try again");
        }; //eo error
        query.equalTo("organizationGroupId", selectedOrgGroupId);
        query.equalTo("userId", childId);
        query.find({success: success, error: error });
        return deferred;
    }; //eo isRelationExist
    var createRelation = function(d) {
        //Create relation
        var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation");
        var relation = new UserOrganizationGroupRelation();
        var deferred = $.Deferred();
        function success(relation) {
            // Execute any logic that should take place after the object is saved.
            console.log('created UserOrganizationGroupRelation for:'+relation.get('firstName')+' '+relation.get('lastName'));
            deferred.resolve();
        };
        function error(relation, err) {
            // Execute any logic that should take place if the save fails.
            // error is a Parse.Error with an error code and message.
            console.log('Failed to add child to organization: '+err.code+' ' + err.message);
            deferred.resolve();
        };
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
        relation.save(null, {success: success, error: error});
        return deferred;
    }; //eo createRelation
    //Check if relation already exist
    var addToOrgGroup = function(d) {
        var OrganizationGroup = Parse.Object.extend("OrganizationGroup", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = OrganizationGroup.query();
        var deferred = $.Deferred();
        function success(results) {
            var orgGroup;
            if (results.length === 0) {
                _alert("There was an error finding group:"+selectedOrgGroupId);
                spinner.hide();
            } else {
                //Add child to organization
                orgGroup = results[0];
                orgGroup.addUnique("studentIdList", childId);
                orgGroup.save();
            }
            deferred.resolve();
        }; //eo success
        function error(err) {
            _alert("Error addToOrgGroup:"+err.code+' '+err.message);
            deferred.resolve();
        };
        query.equalTo("objectId", selectedOrgGroupId);
        query.find({success: success, error: error});
        return deferred;
    }; //eo addToOrgGroup
    var isOrgRelationExist = function(d) {
        var UserOrganizationRelation = Parse.Object.extend("UserOrganizationRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserOrganizationRelation.query();
        var deferred = $.Deferred();
        function success(results) {
            if(results.length === 0) {
                createOrgRelation(d)
                .always(function() {
                    deferred.resolve();
                });
            } else {
                deferred.resolve();
            }
        }; //eo success
        function error(err) {
            console.log('Error isOrgRelationExist:'+err.code+' '+err.message);
            deferred.resolve();
        };
        query.equalTo("organizationId", selectedOrgId);
        query.equalTo("userId", childId);
        query.find({ success: success, error: error});
        return deferred;
    }; //eo isOrgRelationExist
    var createOrgRelation = function(d) {
        //Create relation
        var UserOrganizationRelation = Parse.Object.extend("UserOrganizationRelation");
        var relation = new UserOrganizationRelation();
        var deferred = $.Deferred();
        function success() {
            // Execute any logic that should take place after the object is saved.
            //alert('New object created with objectId: ' + relation.id);
            console.log('createOrgRelation: Added to organization');
            deferred.resolve();
        };
        function error(relation, err) {
            // Execute any logic that should take place if the save fails.
            // error is a Parse.Error with an error code and message.
            //alert('Failed to add child to organization: ' + error.message);
            console.log('Error: createOrgRelation'+err.code+' '+err.message);
            deferred.resolve();
        };
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
        relation.save(null, {success: success, error: error});
        return deferred;
    }; //eo createOrgRelation

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
        id: 'setting-organizations-groups-detail-students-add-bynameemail-view',
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
