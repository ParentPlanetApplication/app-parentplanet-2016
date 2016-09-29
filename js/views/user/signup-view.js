define(
    [
        'chaplin',
        'views/base/view',
        'text!templates/user/signup.hbs',
        'jquery',
        'parseproxy',
        'backbone.touch',
        'spinner',
        'parse'
    ],
	function ( Chaplin, View, Template, $, ParseProxy, touch, spinner, Parse ) {
		'use strict';

		var validateEmail = function ( email ) {
				var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
				return re.test( email );
			}
			//when the DOM has been updated let gumby reinitialize UI modules
		var addedToDOM = function () {
			//When users touches 'signup' button
			touch.$( "#nextBtn" ).on( 'click', function ( e ) {
				//Load Data
				var email = $( "#emailForm" ).val().toLowerCase();
				var mobilePhone = $( "#mobilePhoneForm" ).val();
				var password = $( "#passwordForm" ).val();
				var verifyPassword = $( "#verifyPasswordForm" ).val();
				if ( email == '' ) {
					_alert( "Please enter an email address for the new account" );
				} else if ( password == '' ) {
					_alert( "Please enter a password for the new account" );
				} else if ( verifyPassword == '' ) {
					_alert( "Please verify the password for the new account" );
				} else {
					if ( !validateEmail( email ) ) {
						_alert( "Please enter a valid email address" );
					} else if ( password != verifyPassword ) {
						_alert( "Your password does not match the entered one" )
					} else if ( !password.match( /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])([a-zA-Z0-9]{8,14})$/ ) ) {
						_alert( "Password must contain at least 8 characters with at least 1 number, at least 1 lowercase letter, at least 1 uppercase letter and no special characters" )
					} else {
						spinner.show();
						_signupEmail = email;
						_signupMobilePhone = mobilePhone;
						_signupPassword = password;
						var query = new Parse.Query( Parse.User );
						query.equalTo( "email", email );
						query.find( {
							success: function ( users ) {
								var redirectName = 'signup-enter-user-info';
								spinner.hide();
								if ( users.length > 0 ) { //If email exists and verified
									redirectName = users[ 0 ].get( "emailVerified" ) ? '' : 'signup-if-match';
								}
								Chaplin.utils.redirectTo( {
									name: redirectName
								} );
							},
							error: function ( user, error ) {
								spinner.hide();
								console.log( "Error, could not sign up!" );
							}
						} );
						/*
						var user = new Parse.User();
						user.set("username", email);
						user.set("password", password);
						user.set("email", email);
						user.set("phone", mobilePhone);

						user.signUp(null, {
						    success: function(user) {
						        // Hooray! Let them use the app now.
						        spinner.hide();
						        Chaplin.utils.redirectTo({
						            name: 'signup-enter-info-page-1'
						        });
						    },
						    error: function(user, error) {
						        // Show the error message somewhere and let the user try again.
						        alert("Error: " + error.code + " " + error.message);
						    }
						});
						*/

						/*
						ParseProxy.user.signup(email, password, mobilePhone, "parent",
						    //onSuccess
						    function(user) {
						        // Hooray! Let them use the app now.
						        spinner.hide();
						        Chaplin.utils.redirectTo({
						            name: 'signup-enter-info-page-1'
						        });

						    },
						    //onError
						    function(user, error) {
						        $("#spinner-container").addClass("hidden");
						        // Show the error message somewhere and let the user try again.
						        alert("Error: " + error.code + " " + error.message);
						    }
						);*/
					}
				}
				//Chaplin.utils.redirectTo({ name: 'signup-if-match' });
			} )
			touch.$( "#backBtn" ).on( 'click', function ( e ) {
				Chaplin.utils.redirectTo( {
					name: 'signin'
				} );
			} );
			touch.$( "#terms" ).on( 'click', function ( e ) {
				Chaplin.utils.redirectTo( {
					name: 'tos'
				} );
			} );
			touch.$( "#privacy" ).on( 'click', function ( e ) {
				Chaplin.utils.redirectTo( {
					name: 'privacy'
				} );
			} );
		};
		var __id = 'user-signup';
		var UserView = View.extend( {
			template: Template,
			autoRender: true,
			keepElement: false,
			id: __id,
			className: __id,
			listen: {
				addedToDOM: addedToDOM
			},
			initialize: function ( options ) {
				_setCurrentView( _view.USER_SIGNUP, __id );
				Chaplin.View.prototype.initialize.call( this, arguments );
			}
		} );

		return UserView;
	} );
