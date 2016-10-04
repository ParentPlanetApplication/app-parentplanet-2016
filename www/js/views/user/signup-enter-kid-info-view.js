define([
        'chaplin',
        'views/base/view',
        'text!templates/user/signup-enter-kid-info-view.hbs',
        'jquery',
        'parse',
        'spinner'
    ],
    function(Chaplin, View, Template, $, Parse, spinner) {
        'use strict';
        var user;
        var childNo = 1;
        var BLANKSPACE = ' '; //for name validation
        var rgb2hex = function(rgb) {
            rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
            function hex(x) {    return ("0" + parseInt(x).toString(16)).slice(-2);    }
            return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
        }; //eo rgb2hex

        function redirect(name) {
            spinner.hide();
            name = name ? name : '';
            Chaplin.utils.redirectTo({ name:name });
        }; //eo redirectTo

        //when the DOM has been updated let gumby reinitialize UI modules
        var addedToDOM = function() {
            var s = function() { 
                var lastName = _signupUserLastName || '';
                return '<div id="kid-' 
                    + childNo 
                    + '" class="kid-wrapper"><div class="item first-name"><div class="box-label"><div style="font-weight:bold; text-align:center; margin-bottom:-15px">Child #'
                    + childNo
                    + '</div>First Name</div><div class="field"><input class="firstNameInput input" type="text" placeholder="" value="" /></div></div>'
                    + '<div class="item last-name"><div class="box-label">Last Name</div><div class="field"><input class="lastNameInput input" type="text" placeholder="" value="' 
                    + lastName 
                    + '" /></div></div>'
                    +'<div class="item color"><div class="field"><div class="color-input">Color</div></div><div id="colorBox-kid-' 
                    + childNo 
                    + '" class="color-box"></div></div></div>';
            }; //eo s html add child form
            var t = function() {
                return '<div id="addBtn" class="add-item" style="cursor:pointer;"><span>Add Another Child</span><span class="right"><i class="icon-fontello-plus"></i></span></div>';
            }; //eo t = html button to add another child
            //Init buttons
            var childAdd = function() {
                $("#main-content-inner").append(s());
                //Reset previous events
                $(".item.color").off("click");
                $(".item.color").on("click", function(e) {
                    _showColorPicker(".innerview-container", "#colorBox-" + $(this).parent().attr("id"));
                });
            };
            var addChildren = function(e) {
                //check if names are provided
                var firstNameDivs;
                var lastNameDivs;
                var len; //number of children
                var firstName;
                var lastName;
                var validate = function() {
                    var flag = true;
                    firstNameDivs = $(".firstNameInput");
                    lastNameDivs = $(".lastNameInput");
                    len = firstNameDivs.length;
                    $.each(firstNameDivs, function(i, name) {
                        var firstName = $(".firstNameInput:eq(" + i + ")").val();
                        if (!firstName || firstName === BLANKSPACE) { flag = false; }
                    });
                    $.each(lastNameDivs, function(i, name) {
                        var lastName = $(".lastNameInput:eq(" + i + ")").val();
                        if (!lastName || lastName === BLANKSPACE) { flag = false; }
                    });
                    if(!flag) {
                        _alert("Please enter into all the fields");
                        spinner.hide();
                    }
                    return flag;
                }; //eo validate
                var createChild = function(i) {
                    var deferred = $.Deferred();
                    var color = $(".color-box:eq(" + i + ")").css("background-color");
                    //Create child data on server
                    var success = function(child) { //Create parent-child relation
                        var UserParentRelation = Parse.Object.extend("UserParentRelation");
                        var relation = new UserParentRelation();
                        relation.set("childFirstName", child.get("firstName"));
                        relation.set("childLastName", child.get("lastName"));
                        relation.set("color", child.get("color"));
                        relation.set("parentId", _signupUserId); //_signupUserId comes from user info view
                        relation.set("childId", child.id);
                        relation.save(null, {
                            success: function(relation) {
                                // Execute any logic that should take place after the object is saved.
                                console.log('New UserParentRelation created with objectId: ' + relation.get("childId"));
                                //Update cache
                                var cache = _getUserData();
                                cache.children = cache.children ? cache.children : []; //handle new set of kids
                                cache.children.push({
                                    "id": relation.get("childId"),
                                    "firstName": relation.get("childFirstName"),
                                    "lastName": relation.get("childLastName"),
                                    "color": relation.get("color")
                                });
                                _setUserData(cache);
                                deferred.resolve();
                            },
                            error: function(child, error) {
                                // Execute any logic that should take place if the save fails.
                                // error is a Parse.Error with an error code and message.
                                _alert('Failed to create new UserParentRelation, with error:'+error.code+ ' ' + error.message);
                                deferred.reject();
                            }
                        }); //eo relation.save
                    }; //eo success
                    var Child = Parse.Object.extend("Child");
                    var child = new Child();
                    firstName = $(".firstNameInput:eq(" + i + ")").val();
                    lastName = $(".lastNameInput:eq(" + i + ")").val();
                    color = rgb2hex(color);
                    child.set("firstName", firstName);
                    child.set("lastName", lastName);
                    child.set("isUser", false);
                    child.set("creatorParentId", _signupUserId); //_signupUserId comes from user info view
                    child.set("color", color);
                    child.save(null, {
                        success: success,
                        error: function(child, error) {
                            console.log('Failed to create new Child, with error code:'+error.code+' ' + error.message);
                            deferred.reject();
                        }
                    }); //eo child.save
                    return deferred;
                }; //eo createChild
                var queue = function(i) {
                    var deferred = createChild(i);
                    function done() {
                        _alert("New account created successfully. Please login to continue.");
                        redirect('signin');
                    };
                    function next() { //go on to the next one
                        i++;
                        i < len ? queue(i) : done();
                    }; 
                    function fail() { //let the user know there has been a problem and then proceed
                        _alert('Unable to add ' + firstName + ' ' + lastName + ' to the parent account');
                        next();
                    }
                    deferred.then(next);
                    deferred.fail(fail);
                }; //eo queue
                spinner.show();
                validate() ? queue(0) : $.noop();
            }; //eo addChild
            var initData = function() {
                user = _getUserData();
                childNo = 1;
                childAdd();
                $('#main-content').append(t());
            }; //eo addChild1
            var initButtons = function() {
                $('#backBtn').on('click', function(e) {    
                    redirect('signup-enter-user-info');    
                });
                $('#skipBtn').on('click', function(e) {
                    _alert("New account created successfully. Please login to continue.")
                    redirect('signin');
                });
                $("#addBtn").on('click', function(e) {
                    childNo++;
                    childAdd();
                }); //eo addBtn click
                $("#doneBtn").on('click', addChildren); //eo doneBtn click
            }; //eo initButtons
            initData();
            initButtons();
        }; //eo addedToDOM
        var __id = 'signup-enter-kid-info-view';
        var View = View.extend({
            template: Template,
            autoRender: true,
            keepElement: false,
            container: '#main-container',
            className: 'view-container',
            id: __id,
            listen: {
                addedToDOM: addedToDOM
            },
            initialize: function(options) {
                //Reset footer
                _setCurrentView(_view.USER_SIGNUP, __id);
                $("#footer-toolbar > li").removeClass("active");
                Chaplin.View.prototype.initialize.call(this, arguments);
            }
        }); //eo View.extend

        return View;
    });
