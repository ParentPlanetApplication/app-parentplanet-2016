define([
        'chaplin',
        'views/base/view',
        'text!templates/setting/setting-user-kids-addnew-view.hbs',
        'jquery',
        'parse',
        'spinner'
    ],
    function(Chaplin, View, Template, $, Parse, spinner) {
        'use strict';
        var childNo = 1;
        var rgb2hex = function(rgb) {
            rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
            function hex(x) {    return ("0" + parseInt(x).toString(16)).slice(-2);    }
            return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
        }; //eo rgb2hex

        //when the DOM has been updated let gumby reinitialize UI modules
        var addedToDOM = function() {
            var user = _getUserData();
            var s = function() { 
                return '<div id="kid-' 
                    + childNo 
                    + '" class="kid-wrapper"><div class="item first-name"><div class="box-label">Child '
                    + childNo
                    + ' First Name</div><div class="field"><input class="firstNameInput input" type="text" placeholder="" value="" /></div></div>'
                    + '<div class="item last-name"><div class="box-label">Child ' 
                    + childNo 
                    + ' Last Name</div><div class="field"><input class="lastNameInput input" type="text" placeholder="" value="' 
                    + user.lastName 
                    + '" /></div></div>'
                    +'<div class="item color"><div class="field"><div class="color-input">Color</div></div><div id="colorBox-kid-' 
                    + childNo 
                    + '" class="color-box"></div></div></div>';
            }; //eo s
            //Init buttons
            var childAdd = function() {
                $("#main-content").append(s());
                //Reset previous events
                $(".item.color").off("click");
                $(".item.color").on("click", function(e) {
                    _showColorPicker(".innerview-container", "#colorBox-" + $(this).parent().attr("id"));
                });
            };
            var addChild1 = function() {
                childNo = 1;
                childAdd();
            }; //eo addChild1
            $("#addBtn").on('click', function(e) {
                childNo++;
                childAdd();
            }); //eo addBtn click
            $("#doneBtn").on('click', function(e) {
                //check if names are provided
                var isAllFieldsFilled = true;
                var firstNameDivs = $(".firstNameInput");
                loop1: for (var i = 0; i < firstNameDivs.length; i++) {
                    var firstName = $(".firstNameInput:eq(" + i + ")").val();
                    if (firstName == "" || firstName == null) {
                        isAllFieldsFilled = false;
                        break loop1;
                    }
                }
                var lastNameDivs = $(".lastNameDivs");
                if (isAllFieldsFilled) {
                    loop2: for (var i = 0; i < lastNameDivs.length; i++) {
                        var lastName = $(".lastNameInput:eq(" + i + ")").val();
                        if (lastName == "" || lastName == null) {
                            isAllFieldsFilled = false;
                            break loop2;
                        }
                    }
                } //eo if
                if (!isAllFieldsFilled) {
                    _alert("Please enter all fields");
                    spinner.hide();
                } else {
                    for (var i = 0; i < firstNameDivs.length; i++) {
                        var firstName = $(".firstNameInput:eq(" + i + ")").val();
                        var lastName = $(".lastNameInput:eq(" + i + ")").val();
                        var color = $(".color-box:eq(" + i + ")").css("background-color");
                        color = rgb2hex(color);
                        //Create child data on server
                        var Child = Parse.Object.extend("Child");
                        var child = new Child();
                        /*console.log(firstName);
                        console.log(lastName);
                        console.log(_signupUserId);
                        console.log(color);*/
                        child.set("firstName", firstName);
                        child.set("lastName", lastName);
                        child.set("isUser", false);
                        child.set("creatorParentId", user.id);
                        child.set("color", color);
                        child.save(null, {
                            success: function(child) {
                                //Create parent-child relation
                                var UserParentRelation = Parse.Object.extend("UserParentRelation");
                                var relation = new UserParentRelation();
                                relation.set("childFirstName", child.get("firstName"));
                                relation.set("childLastName", child.get("lastName"));
                                relation.set("color", child.get("color"));
                                relation.set("parentId", user.id);
                                relation.set("childId", child.id);
                                console.log(child.get("firstName"))
                                relation.save(null, {
                                    success: function(relation) {
                                        // Execute any logic that should take place after the object is saved.
                                        console.log('New UserParentRelation created with objectId: ' + relation.get("childId"));
                                        //Update cache
                                        var cache = _getUserData();
                                        cache.children.push({
                                            "id": relation.get("childId"),
                                            "firstName": relation.get("childFirstName"),
                                            "lastName": relation.get("childLastName"),
                                            "color": relation.get("color")
                                        });
                                        _setUserData(cache);
                                        spinner.hide();
                                        //_alert("Thank you for registering for ParentPlanet. We have sent you a verification email. Please click the link within the email to continue.")
                                        Chaplin.utils.redirectTo({    name: 'setting-user-kids-home'    });
                                    },
                                    error: function(child, error) {
                                        // Execute any logic that should take place if the save fails.
                                        // error is a Parse.Error with an error code and message.
                                        console.log('Failed to create new UserParentRelation, with error code: ' + error.message);
                                    }
                                }); //eo relation.save
                            },
                            error: function(child, error) {
                                console.log('Failed to create new Child, with error code: ' + error.message);
                            }
                        }); //eo child.save
                    } //eo for
                } //eo else !isAllFieldsFilled
                spinner.show();
            }); //eo doneBtn click
            addChild1();
        }; //eo addedToDOM

        var View = View.extend({
            template: Template,
            autoRender: true,
            keepElement: false,
            container: '#main-container',
            className: 'view-container',
            id: 'setting-user-kids-addnew-view',
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
