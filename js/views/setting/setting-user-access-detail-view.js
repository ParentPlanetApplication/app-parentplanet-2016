define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-user-access-detail-view.hbs',
    'jquery',
    'parse'
], function(Chaplin, View, Template, $, Parse) {
    'use strict';
    var userList = null;
    var id;
    var user;
    var selectedUser;

    var initData = function() {
        id = _selectedUserAcctAccess ? _selectedUserAcctAccess.attributes.givenAccessUserId : null;
        user = _getUserData();
        var userTable = Parse.Object.extend("User", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = userTable.query();
        query.equalTo("objectId", id);
        query.find(function(results) {
            results ? selectedUser = results[0] : selectedUser = null;
        });
    }; //eo initData
    var loadUser = function() {
        var spinner = _createSpinner('spinner');
        var userDataArray = null;
        var name;
        var fullName;
        function removeAccessAccount(childArray, selectedUser) {
             var groupArray = [];
            //get all groups that children belong to
            var userOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var groupQuery = userOrganizationGroupRelation.query();
            groupQuery.containedIn("userId", childArray);
            groupQuery.equalTo("position", "Student");
            groupQuery.find().then(function (groups) {
                for (var j = 0; j < groups.length; j++) {
                    groupArray.push(groups[j].get("organizationGroupId"));
                }
                var userCustomList = Parse.Object.extend("UserCustomList", {}, {
                  query: function(){
                    return new Parse.Query(this.className);
                  }
                });
                var customListQuery = userCustomList.query();
                //customListQuery.equalTo("ownerId", user.id);
                customListQuery.containsAll("userContactEmail", [user.email]);
                customListQuery.find({
                    success: function(customList) {
                        if (customList.length > 0) {
                            for (var k = 0; k < customList.length; k++) {
                                var customGroup = customList[k];
                                var groupId = customGroup.get("groupId");
                                var username = selectedUser.get("username");
                                var userContactEmail = customGroup.get("userContactEmail");
                                if (userContactEmail.indexOf(username) > -1 && groupArray.indexOf(groupId) == -1) {
                                    //userContactEmail.remove(userContactEmail.indexOf(selectedUser.get("username")));
                                    customGroup.remove("userContactEmail", selectedUser.get("username"));
                                    customGroup.save();
                                }
                            }
                        }
                    },
                    error: function(error) {
                        console.log(error);
                    }
                });
            });
        };

        function noUser() {
            $("#user-content").empty();
            var email = _selectedUserAcctAccess.attributes.givenAccessUserEmail;
            var mobile = _selectedUserAcctAccess.attributes.givenAccessUserMobile;
            name = email ? email : mobile;
            $("#userDetail").append('<div class="line-wrapper"><div class="left">' + name + '</div>');
            $("#userDetail").removeClass("hidden");
            $("#delete-associate").removeClass("hidden");
            spinner.stop();
        }; //eo noContacts
        function userExists() {
            $("#user-content").empty();
            //Load students
            var query = new Parse.Query(Parse.User);
            query.equalTo("objectId", id);
            query.find({
                success: function(results) {
                    userDataArray = results;
                    function userExists() {
                        $.each(userDataArray, function(i, user) {
                            var addressFull = "";
                            var addressInfo = "";
                        //    var firstName = user.get("showParentFirstName") ? user.get("firstName") : "";
                        //    var lastName = user.get("showParentLastName") ? user.get("lastName") : "";
                            var firstName = user.get("firstName");
                            var lastName = user.get("lastName")
                            firstName = firstName ? firstName : '';
                            lastName = lastName ? lastName : '';
                            fullName =  firstName + " " + lastName;
                            var pName = "<span class='p-name' style='font-size: 18px;'>" + fullName + "</span>";
                            var homePhone = user.get("homePhone");
                            var mobilePhone = user.get("mobilePhone");
                            var workPhone = user.get("workPhone");
                            var email = user.get("email");
                            var city = user.get("city");
                            var zip = user.get("zip");
                            var state = user.get("state");
                            $("#title").html(firstName + ' ' + lastName);
                            addressInfo += pName + "<br/>";
                            addressInfo += '<a href="mailto:'+email+'"><span class="p-email">' + email + '</span></a><br/>';
                            if (user.get("showAddress")) {
                                addressFull += user.get("addressLine1") ? user.get("addressLine1") + "<br/>" : "";
                                addressFull += user.get("addressLine2") ? " " + user.get("addressLine2") + "<br/>" : "";
                                addressFull += city ? " " + city : "";
                                addressFull += state ? ", " + state : "";
                                addressFull += zip ? " " + zip + "<br/>" : "<br/>";
                                addressInfo += '<a id="maplink" class="active-link" >' + addressFull + "</a>"; //close maplink anchor
                            //  addressInfo += '<a id="maplink" ><i class="icon-location"></i>Open Map Link</a><br/>';
                            }
                            if (user.get("showHomePhone")) {
                                addressInfo += homePhone ? '<a href="tel:'+homePhone.replace(/-/g,"")+'"><span class="fa fa-phone" style="font-size:small;">  home: ' + homePhone + "</span></a><br/>" : "";
                            }
                            if (user.get("showMobilePhone")) {
                                addressInfo += mobilePhone ? '<a href="tel:'+mobilePhone.replace(/-/g,"")+'"><span class="fa fa-phone" style="font-size:small;">  cell: ' + mobilePhone + "</span></a><br/>" : "";
                            }
                            if (user.get("showWorkPhone")) {
                                addressInfo += workPhone ? '<a href="tel:'+workPhone.replace(/-/g,"")+'"><span class="fa fa-phone" style="font-size:small;">  work: ' + workPhone + "</span></a><br/>" : "";
                            }
                            $("#userDetail").append('<div class="line-wrapper"><div class="left">' + addressInfo + '</div>');
                            $("#maplink").on("click", function(e) {
                                var href = encodeURI(addressFull);
                                console.log('clicked on map link', href);
                                href = _googleMaps + href;
                               // var href = 'http://maps.google.com/?q=1200%20Pennsylvania%20Ave%20SE,%20Washington,%20District%20of%20Columbia,%2020003';
                                var ref = window.open(href, '_system', 'location=no');
                            });
                        }); //eo each userDataArray loop
                        $("#userDetail").removeClass("hidden");
                        $("#delete-associate").removeClass("hidden");
                        spinner.stop();
                    }; //eo inner hasContacts
                    userDataArray.length == 0 ? noUser() : userExists();
                },
                error: function(err) {
                    spinner.stop();
                    _alert("Internal Error, Contacts loading data:"+err.code+' '+err.message);
                } //eo error
            }); //eo query.find
        }; //eo outer hasContacts
        id ? userExists() : noUser();
        $("#delete-associate").on('click', function(e) {
            var deleteSuccess = function() {
                // var UserAcctAccess = Parse.Object.extend("UserAcctAccess");
                // var query = new Parse.Query(UserAcctAccess);
                // query.equalTo("objectId", _selectedUserAcctAccess);
                var deletedParentId = id;
                Parse.User.current().fetch().then(function (user) {
                    var associates = user.get("associates");
                    associates ? user.remove("associates", id) : user.set("associates", []); //if undefined set empty array
                    user.save();
                }).then(function() {
                    //remove email from userContactEmail in UserCustomList table
                    //if this user do not have any child in that group
                    var childArray = [];
                    var childTable = Parse.Object.extend("Child", {}, {
                      query: function(){
                        return new Parse.Query(this.className);
                      }
                    });
                    var query = childTable.query();
                    query.equalTo("creatorParentId", deletedParentId);
                    query.find().then(function(results) {
                        if (results.length > 0) {
                            for (var i = 0; i < results.length; i++) {
                                childArray.push(results[i].id);
                            }
                            removeAccessAccount(childArray, selectedUser);

                        } else {
                            var query = new Parse.Query(Parse.User);
                                query.equalTo("objectId", deletedParentId);
                                query.find().then(function(results){
                                    if (results.length > 0) {
                                        for (var i = 0; i < results.length; i++) {
                                            childArray.push(results[i].id);
                                        }
                                        removeAccessAccount(childArray, selectedUser);
                                    }
                               });
                        }
                    });
                });
                _selectedUserAcctAccess.destroy({
                    success: function() {
                        Chaplin.utils.redirectTo({
                            name: 'setting-user-access-home'
                        });
                    },
                    error: function() {

                    }
                });
            }; //eo deleteSuccess
            var deleteFailure = function() {
                _alert('Error: Unable to remove account access');
            }; //eo deleteFailure
            var deleteName = (fullName && fullName.length > 0) ? fullName : name;
            var deferred = _confirm('Do you want to remove account access for ' + deleteName + '?');
            deferred.done(deleteSuccess).fail(deleteFailure);
        }); //eo delete-associate click
    }; //eo loadUser

    var spinner = null;
    var addedToDOM = function() {
        initData();
        loadUser();
        $("#backBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-user-access-home'
            });
        });
    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: 'setting-user-access-detail-view',
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
