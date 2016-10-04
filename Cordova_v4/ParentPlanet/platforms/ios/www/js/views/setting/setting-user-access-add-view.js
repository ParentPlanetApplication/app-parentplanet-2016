define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-user-access-add-view.hbs',
    'jquery',
    'spinner',
    'parse'
], function(Chaplin, View, Template, $, spinner, Parse) {
    'use strict';
    var user;
    var userId = null;
    var hasChildren = false;
    var email;
    var firstName;
    var lastName;
    var permissionAccessArray;
    var childIdArray;
    var pwd;

    function initData() {
        user = _getUserData();
        hasChildren = user.children && user.children.length > 0 ?  true : false;
    }; //eo initData
    function initButtons() {
        /*
        function addDoneBtn() {
            $("#doneBtn").removeClass("hidden");
            $("#doneBtn").on('click', function(e) {    addUserAcctAccessAction();    });
        };
        */
        $("#backBtn").on('click', function(e) {    redirect();    });
    //    hasChildren ? addDoneBtn() : addDoneBtn; //for future use $.noop for no children
    }; //eo initButtons
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
    function loadChildren() {
        function noChildren() {
            $("#content").append('There are no children for account access to link to.');
        };
        function appendChildren() {
            $.each(user.children, function(i, child) {
                $("#content").append('<div class="info"><div class="info-label-big">'
                    + child.firstName
                    + '</div><div class="info-content"><div class="field"><div class="picker" style="width:100%;"><select id="selector-'
                    +  child.id
                    + '"><option value="read">Read Only</option><option value="administrator">Administrator</option>'
                    + '<option value="none">None</option></select></div></div></div></div>'
                ); //eo append
            }); //eo each
        }; //eo appendChildren
        //for now just enter in the email
        //hasChildren ? appendChildren() : noChildren();//leave out for now ...
    }; //eo loadChildren

    function redirect() {
        spinner.hide();
        Chaplin.utils.redirectTo({    name: 'setting-user-access-home'    });
    }; //eo redirectTo

    function addByEmail() {
        var flag = false;
        var deferred = null;
        function error(err) {
            spinner.hide();
            _alert("Internal error, addByEmail:"+err.code+" "+err.message);
            deferred ? deferred.reject() : $.noop();
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
                var mode = 1; //use updated message for email depending on mode value (!1 = default)
                var senderName = [user.firstName, user.lastName].join(' ');
                var organizationName = 'ParentPlanet';
                var groupName = '';
                var who = firstName + ' ' + lastName;
                var d = { mode:mode, password:pwd, username:email, senderName:senderName, who:who, organizationName:organizationName, groupName:groupName};
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
        function getConfirm() {
            deferred = $.Deferred();
            _confirm("Confirm to provide access to this account?")
            .then(deferred.resolve, deferred.reject);
            return deferred;
        };
        function permissions(d) { //account exists add to organization etc.
            var userToAdd = d && d.length > 0 ? d[0] : null;
            function handlePermissions() {
                function noChildren() {
                    _alert('There are no children for account access to link to.');
                    deferred.reject();
                };
                function addPermissions() {
                    var permission = 'read'; //is this the right default?
                    childIdArray = []; //initialize!
                    permissionAccessArray = [];
                    $.each(user.children, function(i, child) {
                        childIdArray.push(child.id)
                        permissionAccessArray.push(permission);
                    }); //eo each
                    deferred.resolve();
                }; //eo addPermissions
                userId = userToAdd.id; //declared in top level scope, this is using the 'shadow' user object
                hasChildren ? addPermissions() : noChildren();
            }; //eo handlePermissions
            var showConfirmDialog = function(name) {
                var defer = _confirm("Confirm to provide access to this account?");
                defer.then(handlePermissions, deferred.reject());
            };
            deferred = $.Deferred();
            userToAdd ? handlePermissions() : deferred.reject(); //get a final confirmation
            return deferred;
        }; //eo confirmWithPermissions
        function addAccountAccess() {
            var UserAcctAccess = Parse.Object.extend("UserAcctAccess");
            var access = new UserAcctAccess();
            deferred = $.Deferred(); //initial deferred
            function success() {
                deferred.resolve();
            };
            Parse.User.current().fetch().then(function (user) {
                var associates = user.get("associates");
                associates ? user.addUnique("associates", userId) : user.set("associates", [userId]);
                user.save();
            });
            /*
            * Important: user.id is not the same as userId
            * user.id is the id of the person currently adding access to their account for, using the top level scope user object
            * userId the id of the person to link to the user.id account, in other words the person you are giving access to this account
            */
            access.set("parentId", user.id);
            access.set("familyName", user.lastName);
            access.set("firstName", user.firstName);
            access.set("givenAccessUserId", userId);
            access.set("givenAccessUserEmail", email);
            access.set("givenAccessUserMobilePhone", '');
            access.set("childIdArray", childIdArray);
            access.set("permissionAccessArray", permissionAccessArray);
            access.set("ParentGrantAccessMessage", true);
            access.set("parentEmail", user.email);
            access.save(null, { success: success, error: error }); //eo group.save
            return deferred;
        }; //eo addAcctAccess
        function updateUserCustomList() {
            deferred = $.Deferred();
            var userCustomList = Parse.Object.extend("UserCustomList", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var query = userCustomList.query();
            query.containsAll("userContactEmail", [user.email]);
            //query.equalTo("ownerId", user.id);
            query.find({
                success: function(results) {
                    if (results.length > 0) {
                        for (var i = 0; i < results.length; i++) {
                            var customList = results[i];
                            var userContactEmail = customList.get("userContactEmail");
                            userContactEmail ? customList.addUnique("userContactEmail", email) : customList.set("userContactEmail", [email]);
                            customList.save();
                        }
                        deferred.resolve();
                    } else {
                        deferred.reject();
                    }
                },
                error: function(error) {
                    console.log(error);
                    deferred.reject();
                }
            });
            return deferred;
        }
        /*
        * MAIN CHAIN STARTS HERE
        */
        function findAddUser() {
            spinner.show();
            getConfirm()
            .then(hasUser) //locate a user by email address
            .then(createUser)
            .then(permissions)
            .then(addAccountAccess)
            .then(updateUserCustomList)
            .always(function() {
                redirect();
            });
        }; //eo findAddUser
        //start chain here
        validate() ? findAddUser() : $.noop();
    };

    var addedToDOM = function() {
        initData();
        initButtons();
        initAddByEmail();
    //    loadChildren();
    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: 'setting-user-access-add-view',
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
