define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-mygroups-detail-contacts-add-byemail-view.hbs',
    'jquery',
    'spinner',
    'parse'
], function(Chaplin, View, Template, $, spinner, Parse) {
    'use strict';

    var user;
    var userId = null;
    var userData;
    var selectedOrgId;
    var selectedOrgData;
    var selectedOrgGroupId;
    var selectedOrgGroupData;
    var selectedMyGroupId;
    var selectedMyGroupData;
    var childId;
    var parentId;
    var firstName;
    var lastName;
    var pwd = null;
    var email;
    var child;
    var deferred = null;
    var promises = []; //use $.when.apply($,promises).done()
    var userParentRelation;
    var userContactId;
    var userContactEmail;
    var parentEmail;
    var studentIdList;
    var organizationIdForMyGroup;

    var redirect = function() {
        spinner.hide();
        setTimeout(function() {    Chaplin.utils.redirectTo({    name: 'setting-mygroups-detail-contacts'    });
        }, DEFAULT_ANIMATION_DELAY);
    }; //eo redirect

    var initData = function() { //data from localstorage and/or previous views
        user = _getUserData();
        selectedMyGroupId = user.setting.selectedMyGroupId;
        selectedMyGroupData = user.setting.selectedMyGroupData;
        studentIdList = selectedMyGroupData.studentIdList;
        selectedOrgId = user.setting.selectedOrgId;
        selectedOrgData = user.setting.selectedOrgData;
        userContactId = selectedMyGroupData.userContactId ? selectedMyGroupData.userContactId : []; //Array
        userContactEmail = selectedMyGroupData.userContactEmail ? selectedMyGroupData.userContactEmail : [];
    }; //eo initData

    var initButtons = function() {
        $("#cancelBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({    name: 'setting-mygroups-detail-contacts-add'    });
        });
    }; //eo initButtons

    var error = function(err) {
        deferred ? deferred.reject() : $.noop();
        spinner.hide();
        _alert("Internal error, addUser:"+err.message);
    };
    var generatedPassword = function(generatedPassword) { pwd = generatedPassword; };
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
              //  var organizationName = selectedOrgData.name ? selectedOrgData.name : 'ParentPlanet';
                var organizationName = 'ParentPlanet';
                var groupName = selectedMyGroupData.name ? selectedMyGroupData.name : 'My Group';
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
            deferred = $.Deferred();
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
            function error(results) { deferred ? deferred.reject(null) : $.noop(); };
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
                /*
                .then(function() {
                    return isRelationExist(relationOrChild);
                })
                */
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
            var queue = function(i) {
                var parent = parents[i];
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
                            var groupName = selectedMyGroupData && selectedMyGroupData.name ? selectedMyGroupData.name : 'My Groups';
                            _alert(name + ' Successfully Added to ' + groupName);
                            redirect();
                        });
                    }
                    done = i < len ? false : true;
                }; //eo fail
                parentEmail = parent.email;
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
                            var groupName = selectedMyGroupData && selectedMyGroupData.name ? selectedMyGroupData.name : 'My Groups';
                            _alert(name + ' Successfully Added to ' + groupName);
                            redirect();
                        });
                    } else { //else if(d.length > 0)
                        i++;
                        if(i < len) {
                            queue(i);
                        } else { //else i < len
                            findAddUser() //this will always be resolved
                            .then(function() {
                                var name = firstName + ' ' + lastName;
                                var groupName = selectedMyGroupData && selectedMyGroupData.name ? selectedMyGroupData.name : 'My Groups';
                                _alert(name + ' Successfully Added to ' + groupName);
                                redirect();
                            });
                        } //eo else
                    } //eo outer else
                }) //eo then
                .fail(fail);
            }; //eo queue
            _getParentEmailGivenAccessUserEmail(email)
            .then(function(d) {
                if(d.length > 0) {
                    parents[0].id = d[0].givenAccessUserId;
                    parents = parents.concat(d);
                    len = parents.length;
                    queue(1); //skip over the access granted user and use the first 'real' parent
                } else {
                    len = parents.length;
                    queue(0);
                }
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
                    deferredParentEmail = createOrgGroupRelation(d);
                    deferredParentEmail = _addOldEvents(selectedMyGroupId, childId, parentId, organizationIdForMyGroup);
                    promises.push(deferredParentEmail);
                    deferredParentEmail = _addOldHomework(selectedMyGroupId, childId, parentId, organizationIdForMyGroup);
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
//          addToCustomList(d, parentEmail).always(function() { //always have a child do not need to pass through
            addToCustomList(parentEmail)
            .then(addUserToContact) //(childId, parentEmail);
            .then(addToOrgGroup) //(childId);
            .always(function () { //always have a child now
                //Add parent email and secondary parent to UserCustomList table
                var deferredParentEmail = _addParentEmail(parentId, user.setting.selectedMyGroupId);
                deferredParentEmail.done(function(){
                    deferred.resolve();
                });
            });
        }; //eo success
        function error(err) {
            _alert('Error getParentEmail:'+err.code+' '+err.message);
            deferred.resolve();
        }; //eo error
        query.equalTo("objectId", parentId);
        query.find({success:success, error:error });
        return deferred;
    }; //eo getParentEmail

//    var addToCustomList = function(child, parentEmail) {
    var addToCustomList = function(parentEmail) { //always have a child
        var deferred = $.Deferred(); //local to be added to promises array
        var UserCustomList = Parse.Object.extend("UserCustomList", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserCustomList.query();
        var success = function(results) {
            var addRecipientList = function(recipientList) {
                var recipient = jQuery.grep(recipientList, function(n) {    return n.parent == parentId;    });
                var o;
                if (recipient.length === 0) {
                    o = {children: [childId], parent: parentId};
                    recipientList.push(o);
                } else {
                    recipient[0].children.indexOf(childId) < 0 ? recipient[0].children.push(childId) : $.noop();
                } //eo if recipient.length
            }; //eo addRecipientList
            var addRecipientUser = function(recipientList) {
                var o = {children: [], parent: parentId};
                recipientList.push(o);
            }; //eo addRecipientUser
            $.each(results, function(i, customGroup) {
                var recipientList = customGroup.get("recipientList");
                organizationIdForMyGroup = customGroup.get("organizationId");
                //     child ? addRecipientList(recipientList) : addRecipientUser(recipientList);
                addRecipientList(recipientList);
                parentEmail ? customGroup.addUnique("userContactEmail", parentEmail) : $.noop();
                customGroup.save();
                customGroup.save(null, {
                    success: function(object) {    deferred.resolve();    },
                    error: function(err) {
                        console.log('Internal Error: '+JSON.stringify(err));
                        deferred.reject();
                    } //eo error
                });
            }); //eo each
        }; //eo success
        var error = function(err) {
            console.log('Internal Error: '+JSON.stringify(err));
            deferred.reject();
        }; //eo error
        query.equalTo("groupId", selectedMyGroupId);
        query.find({ success: success,  error: error  });
        return deferred;
    }; //eo addToCustomList
    var addUserToContact = function() {
        var deferred = $.Deferred(); //local to be added to promises array
        var UserCustomGroup, query;
        var success = function(results) {
            var d;
            var updateLocalUserCustomGroup = function(o) {
                userContactId.indexOf(userId) ? userContactId.push(userId) : $.noop();
                userContactEmail.indexOf(parentEmail) < 0 ? userContactEmail.push(parentEmail) : $.noop();
                selectedMyGroupData.studentIdList = o.get('studentIdList');
                selectedMyGroupData.userContactId = o.get('userContactId'); //Do we need this line?
                selectedMyGroupData.userContactEmail = o.get('userContactEmail');
                _setUserData(user); //store away
            };
            var updateUserCustomGroup = function() {
                var addUnique = function(key, val) {
                    var arr = d.get(key);
                    arr = arr ? arr : [];
                    $.inArray(val, arr) < 0 ? arr.push(val) : $.noop();
                };
                d = results[0];
                addUnique("studentIdList", childId);
                addUnique("userContactId", userId);
                addUnique("userContactEmail", parentEmail);
                d.save(null, {
                    success: function(o) {
                        var o2 = o;
                        updateLocalUserCustomGroup(o);
                        deferred.resolve(o);
                    },
                    error: function(err) {
                        console.log('Internal Error: '+JSON.stringify(err));
                        deferred.resolve();
                    } //eo error
                });
            };
            results.length > 0 ?  updateUserCustomGroup() : redirect();
        }; //eo success
        var error = function(err) {
            console.log('Internal Error: '+JSON.stringify(err));
            deferred.resolve();
        }; //eo error
        //Update data locally
        //Update data on Parse
        //Get Parse's object of this UserCustomGroup
        UserCustomGroup = Parse.Object.extend("UserCustomGroup", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        query = UserCustomGroup.query();
        query.equalTo("objectId", selectedMyGroupId);
        query.find({ success: success, error: error }); //eo query.find
        return deferred;
    }; //eo addUserToContact

    var addToOrgGroup = function(childId) {
        var deferred = $.Deferred(); //local to be added to promises array
        var OrganizationGroup = Parse.Object.extend("OrganizationGroup", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = OrganizationGroup.query();
        var success = function(results) {
            var d = results[0];
            d.addUnique("studentIdList", childId);
            d.save(null, {
                success: function(object) {    deferred.resolve();    },
                error: function(error) {    deferred.resolve();    } //eo error
            });
        }; //eo success
        var error = function(err) {
            console.log('Internal Error: '+JSON.stringify(err));
            deferred.resolve();
        }; //eo error
        query.equalTo("organizationId", selectedMyGroupId);
        query.find({ success: success, error: error }); //eo query.find
        return deferred;
    }; //eo addToOrgGroup

    /////////////////////!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
/*
    var addByName = function() {

        firstName = $("#firstName").val();
        lastName = $("#lastName").val();
        var email = $("#email").val().toLowerCase();
        var flag = false;
        var deferred = null;
        function error(err) {
            deferred ? deferred.reject() : $.noop();
            spinner.hide();
            _alert("Internal error, addUser:"+err.message);
        };
        function validate() {
            var flag = false;
            if (email == null || email == "") {
                _alert("Please enter a user email");
            } else if(!_validateEmail(email)){
                _alert("Please enter a valid email address");
            } else if (firstName === null || firstName === "" || lastName === null || lastName === "") {
                _alert("Please enter all fields");
            } else { flag = true; }
            return flag;
        };
            spinner.show();
            var Child = Parse.Object.extend("Child");
            var UserParentRelation = Parse.Object.extend("UserParentRelation");
            var query = new Parse.Query(Parse.User);
            query.equalTo("email", email);
            query.find().then(function(results) {
                if (results.length == 0) { //email belongs to child
                    // alert('Email not found');
                    // spinner.hide();
                    var query2 = new Parse.Query(Child);
                    query2.containedIn("firstName", _containedIn(firstName));
                    query2.containedIn("lastName", _containedIn(lastName));
                    query2.equalTo("email", email);
                } else { //email belongs to parent
                    var parent = results[0];
                    parentId = parent.id;
                    var parentFirstName = parent.get('firstName');
                    var parentLastName = parent.get('lastName');
                    if ((parentFirstName == firstName) && (parentLastName == lastName)) {
                        flag = true;
                        var parentEmail = null;
                        var isEmailDelivery = parent.get("isEmailDelivery");
                        if (isEmailDelivery) {
                            parentEmail = parent.get("email");
                        }
                        addToCustomList(null, parentEmail);
                        _addOldEvents(selectedMyGroupId, null, parentId);
                        _addOldHomework(selectedMyGroupId, null, parentId);
                        addUserToContact(parentId, parentEmail);
                        totalRequest++
                    }
                    var query2 = new Parse.Query(UserParentRelation);
                    query2.equalTo("parentId", parentId);
                    query2.containedIn("childFirstName", _containedIn(firstName));
                    query2.containedIn("childLastName", _containedIn(lastName));
                }
                return query2.find();
            }).then(function(results) {
                if (results.length == 0) {
                    if (!flag) { // neither user nor child found
                        spinner.hide();
                        _alert('Could not find ' + firstName + ' ' + lastName + ' using this email address');
                    }
                    //_alert('No child found');
                } else {
                    $.each(results, function(i, child) {
                        childId = child.get("childId");
                        childId = childId ? childId : child.id;
                        getParent(child);
                        totalRequest++;
                    });
                }
            }, function(error) {
                _confirm('Error: '+error);
            });
        //start chain here
        validate() ? findAddUser() : $.noop();
    }; //eo addByEmail

    var getParent = function(child) {
        var UserParentRelation = Parse.Object.extend("UserParentRelation");
        var query = new Parse.Query(UserParentRelation);
        query.equalTo("childId", childId);
        query.find({
            success: function(results) {
                for (var i = 0; i < results.length; i++) {
                    var parent = results[i];
                    parentId = parent.get("parentId");
                    getParentEmail(child);
                    createOrgGroupRelation(child);
                    _addOldEvents(selectedMyGroupId, childId, parentId);
                    _addOldHomework(selectedMyGroupId, childId, parentId);
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
                addUserToContact(childId, parentEmail);
                addToOrgGroup(childId);
            },
            error: function(error) {

            }
        });
    }; //eo getParentEmail
*/
    var createOrgGroupRelation = function(child) {
        var deferred = $.Deferred();
        var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserOrganizationGroupRelation.query();
     //   var childId = child.attributes.childId ? child.attributes.childId : child.id;
     //   var firstName = child.attributes.childFirstName ? child.attributes.childFirstName : child.get("firstName");
     //   var lastName = child.attributes.childLastName ? child.attributes.childLastName : child.get("lastName");
        query.equalTo("organizationGroupId", selectedMyGroupId);
        query.equalTo("userId", childId);
        query.find({
            success: function(results) {
                if (results.length == 0) {
                    var relation = new UserOrganizationGroupRelation();
                    relation.set("organizationGroupId", selectedMyGroupId);
                    relation.set("userId", childId);
                    relation.set("relationType", "student");
                    relation.set("position", "Student");
                    relation.set("groupName", selectedMyGroupData.name);
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
                    relation.save();
                }
                deferred.resolve();
            },
            error: function(error) {    deferred.resolve();    }
        });
        return deferred;
    }; //eo createOrgGroupRelation
/*
    var addNonUserToContact = function(email) {
        var nonUserContactEmail = selectedMyGroupData.nonUserContactEmail; //Array
        //Update data locally
        nonUserContactEmail.push(email);
        user.setting.selectedMyGroupData.nonUserContactEmail = nonUserContactEmail; //Do we need this line?
        localStorage.setItem("user", JSON.stringify(user));
        //Update data on Parse
        //Get Parse's object of this UserCustomGroup
        var UserCustomGroup = Parse.Object.extend("UserCustomGroup");
        var query = new Parse.Query(UserCustomGroup);
        query.equalTo("objectId", selectedMyGroupId);
        query.find({
            success: function(results) {
                if (results.length > 0) {
                    var object = results[0];
                    //Update data on parse
                    object.set("nonUserContactEmail", nonUserContactEmail);
                    object.save(null, {
                        success: function(object) {    redirect();    },
                        error: function(error) {    redirect();    } //eo error
                    });
                } else {
                    redirect();
                }
            },
            error: function(error) {
                    redirect();
                } //eo error
        }); //eo query.find
    };
*/
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
        id: 'setting-mygroups-detail-contacts-add-byemail-view',
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
