define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-user-kids-detail-view.hbs',
    'jquery',
    'spinner',
    'parse'
], function(Chaplin, View, Template, $, spinner, Parse) {
    'use strict';

    var addedToDOM = function() {
        $("#backBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-user-kids-home'
            });
        }); //eo backBtn.click

        $("#doneBtn").on('click', function(e) {
            spinner.show();
            //Get input data
            var hexc = function(colorval) {
                var color;
                var parts = colorval.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
                delete(parts[0]);
                for (var i = 1; i <= 3; ++i) {
                    parts[i] = parseInt(parts[i]).toString(16);
                    if (parts[i].length == 1) parts[i] = '0' + parts[i];
                }
                color = '#' + parts.join('');
                return color;
            }
            //var firstName = child.firstName;
            //var lastName = child.lastName;
            var color = $("#colorBox").css("background-color"); //You will always get result in rgb format
            color = hexc(color);
            //Load from local storage
            var user = JSON.parse(localStorage.getItem("user"));
            var child, i;
            loop: for (i = 0; i < user.children.length; i++) {
                child = user.children[i];
                if (child.id == _selectedChildId) {
                    break loop;
                }
            }
            //child.firstName = firstName;
            //child.lastName = lastName;
            child.color ? child.color = color : child.localColor = color;
            user.children[i] = child;
            //Save to local storage
            localStorage.setItem("user", JSON.stringify(user));
            //Update data on Parse ************************************************************
            //Update name and color of child defined by this user (UserParentRelation, child is a user and has its original name)
            var user = Parse.User.current();
            var UserParentRelation = Parse.Object.extend("UserParentRelation", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var query = UserParentRelation.query();
            query.equalTo("parentId", user.id);
            query.equalTo("childId", _selectedChildId);
            query.find({
                success: function(results) {
                    if (results.length > 0) {
                        var child = results[0];
                        // child.set("childFirstName", firstName);
                        // child.set("childLastName", lastName);
                        child.set("color", color);
                        child.save();
                    }
                },
                error: function(error) {
                    //_alert("Could not connect to server, please try again later. - 1");
                }
            }); //eo query.find

            //Update child info (user)
            //Please note that one user cannot change another user's information
            /*var query = new Parse.Query(Parse.User);
            query.equalTo("objectId", _selectedChildId);
            query.find({
                success: function(results) {
                    console.log(results);
                    var child = results[0];

                    child.set("firstName", firstName);
                    child.set("lastName", lastName);
                    child.save();
                },
                error: function(error) {
                    _alert("Could not connect to server, please try again later. - 2");
                }
            });*/
            //Done - Redirect
            spinner.hide();
            Chaplin.utils.redirectTo({
                name: 'setting-user-kids-home'
            });
        }); //eo doneBtn click

        $("#delBtn").on("click", function() {
            var user = JSON.parse(localStorage.getItem("user"));
            var defer = _confirm("Are you sure you want to delete this child from Parent Planet?");
            defer.done(function() {
                isInOrg(user.id);
            }); //eo defer.done
        }); //eo delBtn click

        var cache = JSON.parse(localStorage.getItem("user"));
        var children = cache.children;
        var child;
        for (var i = 0; i < children.length; i++) {
            child = children[i];
            if (child.id == _selectedChildId) {
                break;
            }
        }
        var color = child.color ? child.color : child.localColor;

        var isInOrg = function(userId) {
            spinner.show();
            var UserOrganizationRelation = Parse.Object.extend("UserOrganizationRelation", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var query = UserOrganizationRelation.query();
            query.equalTo("userId", _selectedChildId);
            query.find({
                success: function(results) {
                    if (results.length > 0) {
                        spinner.hide();
                        _alert('Child belongs to at least one organization and cannot be deleted.');
                    } else {
                        var UserCustomGroup = Parse.Object.extend("UserCustomGroup", {}, {
                          query: function(){
                            return new Parse.Query(this.className);
                          }
                        });
                        var query = UserCustomGroup.query();
                        query.equalTo("userContactId", _selectedChildId);
                        query.find({
                            success: function(results) {
                                if (results.length > 0) {
                                    spinner.hide();
                                    _alert('Child belongs to at least one My Group and cannot be deleted.');
                                } else {
                                    deleteChild(userId);
                                }
                            },
                            error: function(err) {
                                spinner.hide();
                                _alert('Internal error: ' + JSON.stringify(err));
                            }
                        }); //eo find UserCustomGroup
                    }
                },
                error: function(err) {
                    spinner.hide();
                    _alert('Internal error: ' + JSON.stringify(err));
                }
            }); //eo find UserOrganizationRelation
        }; //eo isInOrg

        var deleteChild = function(userId) {
            var UserParentRelation = Parse.Object.extend("UserParentRelation", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var query = UserParentRelation.query();
            query.equalTo("childId", _selectedChildId);
            query.equalTo("parentId", userId)
            query.find({
                success: function(results) {
                    for (var i = 0; i < results.length; i++) {
                        var relation = results[i];
                        relation.destroy();
                    }
                    var Child = Parse.Object.extend("Child", {}, {
                      query: function(){
                        return new Parse.Query(this.className);
                      }
                    });
                    var query = Child.query();
                    query.equalTo("objectId", _selectedChildId);
                    query.equalTo("creatorParentId", userId);
                    query.find({
                        success: function(results) {
                            if (results.length == 0) {
                                spinner.hide();
                                _alert('Children cannot be deleted from other accounts.')
                            } else {
                                var childAccount = results[0];
                                var index = children.indexOf(child);
                                childAccount.destroy();
                                children.splice(index, 1);
                                cache.children = children;
                                _setUserData(cache);
                                spinner.hide();
                                Chaplin.utils.redirectTo({
                                    name: 'setting-user-kids-home'
                                });
                            }
                        },
                        error: function(err) {
                            spinner.hide();
                            _alert('Internal error: ' + JSON.stringify(err));
                        }
                    }); //eo find Child
                },
                error: function(err) {
                    spinner.hide();
                    _alert('Internal error: ' + JSON.stringify(err));
                }
            }); //eo find UserParentRelation
        }; //eo deleteChild

        $(".innerview-container").prepend('<div id="childId" class="item" style="padding-top: 20px;"> <div class="box-label">Child ID</div><div class="text">'+child.id+'</div></div>');
        $("#firstNameText").append(child.firstName);
        $("#lastNameText").append(child.lastName);
        $("#colorBox").css("background", color);
        //Init color picker
        $("#colorBox").on('click', function(e) {
            _showColorPicker(".innerview-container", "#colorBox");
        });
    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        className: 'view-container',
        id: 'setting-user-kids-detail-view',
        listen: {
            addedToDOM: addedToDOM
        },
        initialize: function(options) {
            //Reset footer
            $("#footer-toolbar > li").removeClass("active");

            Chaplin.View.prototype.initialize.call(this, arguments);
        }
    }); //eo view.extend

    return View;
});
