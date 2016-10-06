define(
    [
        'chaplin',
        'views/base/view',
        'text!templates/user/signup-enter-kid-info-view.hbs',
        'jquery',
        'parse',
        'spinner'
    ],
    function(Chaplin, View, Template, $, Parse, spinner) {
        'use strict';

        var childNo = 1;

        var rgb2hex = function(rgb) {
            rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);

            function hex(x) {
                return ("0" + parseInt(x).toString(16)).slice(-2);
            }
            return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
        }

        //when the DOM has been updated let gumby reinitialize UI modules
        var addedToDOM = function() {   

            //Init buttons
            $("#addBtn").on('click', function(e) {
                $("#main-content").append('<div id="kid-' + childNo + '" class="kid-wrapper"><div class="item first-name">    \
                    <div class="box-label">Child ' + childNo + ' First Name</div> \
                    <div class="field"> \
                        <input class="firstNameInput input" type="text" placeholder="" value="" /> \
                    </div>  \
                </div>  \
                <div class="item last-name"> \
                    <div class="box-label">Child ' + childNo + ' Last Name</div>  \
                    <div class="field"> \
                        <input class="lastNameInput input" type="text" placeholder="" value="' + _signupUserLastName + '" />  \
                    </div>  \
                </div>  \
                <div class="item color">    \
                    <div class="field"> \
                        <div class="color-input">Color</div>    \
                    </div>  \
                    <div id="colorBox-kid-' + childNo + '" class="color-box"></div> \
                </div></div>');
                childNo++;

                //Reset previous events
                $(".item.color").off("click");
                $(".item.color").on("click", function(e) {
                    _showColorPicker(".innerview-container", "#colorBox-" + $(this).parent().attr("id"));
                });
            })

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
                }

                if (!isAllFieldsFilled) {
                    _alert("Please enter all fields");
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
                        child.set("creatorParentId", _signupUserId);
                        child.set("color", color);

                        child.save(null, {
                            success: function(child) {
                                //Create parent-child relation
                                var UserParentRelation = Parse.Object.extend("UserParentRelation");
                                var relation = new UserParentRelation();

                                relation.set("childFirstName", child.get("firstName"));
                                relation.set("childLastName", child.get("lastName"));
                                relation.set("color", child.get("color"));
                                relation.set("parentId", _signupUserId);
                                relation.set("childId", child.id);

                                relation.save(null, {
                                    success: function(child) {
                                        // Execute any logic that should take place after the object is saved.
                                        console.log('New UserParentRelation created with objectId: ' + child.id);
                                    },
                                    error: function(child, error) {
                                        // Execute any logic that should take place if the save fails.
                                        // error is a Parse.Error with an error code and message.
                                        console.log('Failed to create new UserParentRelation, with error code: ' + error.message);
                                    }
                                });
                            },
                            error: function(child, error) {
                                // Execute any logic that should take place if the save fails.
                                // error is a Parse.Error with an error code and message.
                                console.log('Failed to create new Child, with error code: ' + error.message);
                            }
                        });


                    }
                }

                spinner.show();
                setTimeout(function() {
                    spinner.hide();
                    _alert("Thank you for registering for ParentPlanet. Please login to continue.")
                    Chaplin.utils.redirectTo({    name: ''    });
                }, 1000);
            }); //eo doneBtn

            _alert("If your children have already been added by another member of your family or an organization do not add them here.");
        }; //eo addedToDOM

        var __id = 'signup-enter-kid-info-view';
        var View = View.extend({
            template: Template,
            autoRender: true,
            keepElement: false,
            container: '#main-container',
            id: __id,
            className: 'view-container',
            containerMethod: "prepend",
            listen: {
                addedToDOM: addedToDOM
            },
            initialize: function(options) {
                _setCurrentView(_view.SEND_TO, __id);
                Chaplin.View.prototype.initialize.call(this, arguments);
            }
        });


        return View;
    });
