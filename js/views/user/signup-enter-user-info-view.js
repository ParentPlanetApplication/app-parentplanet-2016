define(
    [
        'chaplin',
        'views/base/view',
        'text!templates/user/signup-enter-user-info-view.hbs',
        'jquery',
        'backbone.touch',
        'parse',
        'spinner',
        'parseproxy'
    ],
    function(Chaplin, View, Template, $, touch, Parse, spinner, proxy) {
        'use strict';
        
        //when the DOM has been updated let gumby reinitialize UI modules
        var addedToDOM = function() {
            var redirect = function(name) {
                spinner.hide();
                name = name ? name : '';
                Chaplin.utils.redirectTo({ name:name });
            }; //eo redirectTo
            var scrollFieldTop = function(i) {
                $(".innerview-container").scrollTop($("#verification-page-1").height() - i);
            }; //eo scrollFieldTop
            var done = function() { //no children simply login
                _alert("New account created successfully. Please login to continue.");
                redirect('signin');
            };
            var enterChildInfo = function() { //go to the kids info section
                redirect('signup-enter-kid-info');
            };
            var enterUserInfo = function(callback) { //main method for adding a user to Parse from entered info
                var user = null;
                var firstName = $("#firstName").val();
                var lastName = $("#lastName").val();
                var homePhone, mobilePhone, workPhone, addressLine1, addressLine2, city, state, zip;
                if (firstName === '' || lastName === '') { //check that at least there is a first/last name
                    _alert("Please enter in your first and last names");
                    return;
                }
                homePhone = $("#homePhone").val();
                mobilePhone = $("#mobilePhone").val();
                workPhone = $("#workPhone").val();
                addressLine1 = $("#addressLine1").val();
                addressLine2 = $("#addressLine2").val();
                city = $("#city").val();
                state = $("#state").val();
                zip = $("#zip").val();
                //validate and continue
                user = new Parse.User();
                user.set("username", _signupEmail);
                user.set("password", _signupPassword);
                user.set("email", _signupEmail);
                user.set("email2", _signupEmail);
                user.set("firstName", firstName);
                user.set("lastName", lastName);
                user.set("addressLine1", addressLine1);
                user.set("addressLine2", addressLine2);
                user.set("city", city);
                user.set("state", state);
                user.set("zip", zip);
                user.set("country", "US");
                user.set("homePhone", homePhone);
                user.set("mobilePhone", mobilePhone);
                user.set("workPhone", workPhone);
                user.set("showParentFirstName", false);
                user.set("showParentLastName", false);
                user.set("showChildFirstName", true);
                user.set("showChildLastName", true);
                user.set("showEmail", false);
                user.set("showHomePhone", false);
                user.set("showMobilePhone", false);
                user.set("showWorkPhone", false);
                user.set("showAddress", false);
                user.set("isRegistered", true);
                user.set("isAdmin", false);
                user.set("isEmailDelivery", true);
                user.signUp(null, {
                    success: function(user) {
                        //Hooray! Let them use the app now.
                        _signupUserId = user.id; //used in signup-enter-kid-info etc.
                        _signupUserLastName = user.get("lastName") || '';
                        _signupUser = user;
                        spinner.hide();
                        //init first push notification
                        _initFirstPushNotification(user, spinner, proxy);
                        callback(); //use the supplied callback
                    },
                    error: function(user, error) {
                        spinner.hide();
                        // Show the error message somewhere and let the user try again.
                        _alert("Error: " + error.code + " " + error.message);
                    }
                }); //eo user.signup
            }; //eo enterUserInfo
            $("#email").val(_signupEmail);
            $("#email").attr("disabled", "true");
            // $("#mobilePhone").val(_signupMobilePhone); //mobile phone not currently on first sign up page
            // $("#mobilePhone").attr("disabled", "true");
            //When users touches 'signup' button
            touch.$("#nextBtn, #nextBtn2").on('click', function(e) {
                enterUserInfo(enterChildInfo); //next screen
            }); //eo touch next
            touch.$("#doneBtn, #doneBtn2").on('click', function(e) {
                enterUserInfo(done); //back to login
            }); //eo touch next
            touch.$("#backBtn").on('click', function(e) {
                redirect();
            });
            //scroll up fields to view from behind keyboard
            $("#homePhone").focus(function(e) { scrollFieldTop(600); }); //eo #homePhone .focus
            $("#mobilePhone").focus(function(e) { scrollFieldTop(600); }); //eo #mobilePhone .focus
            $("#workPhone").focus(function(e) { scrollFieldTop(450); }); //eo #workPhone .focus
            $("#addressLine1").focus(function(e) { scrollFieldTop(450); }); //eo #addressLine1 .focus
            $("#addressLine2").focus(function(e) { scrollFieldTop(300); }); //eo #addressLine2 .focus
            $("#city").focus(function(e) { scrollFieldTop(300); }); //eo #city .focus
            $("#zip").focus(function(e) { scrollFieldTop(300); }); //eo #zip .focus
        }; //eo addedToDOM
        var __id = 'signup-enter-user-info-view';
        var UserView = View.extend({
            template: Template,
            autoRender: true,
            className: "user-signup",
            id: __id,
            listen: {
                addedToDOM: addedToDOM
            },
        });

        return UserView;
    });
