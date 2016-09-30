define(
    [
        'chaplin',
        'views/base/view',
        'text!templates/user/signin.hbs',
        'jquery',
        'parseproxy',
        'gumby',
        'checkbox',
        'parse',
        'spinner',
        'backbone.touch'
    ],
	function (Chaplin, View, Template, $, ParseProxy, Gumby, checkbox, Parse, spinner, touch) {
		'use strict';
		//top level scope
		var proxy = ParseProxy;
		var isEventLoaded;
		var isMessagesLoaded;
		var isHomeworkLoaded;
		var isContactsLoaded;
		var isUserCustomListLoaded;
		var isActivitiesLoaded;
		var isMobile;
		// var spinner = null;

        var redirectToHome = function() {
            //Redirect user to home
            Chaplin.utils.redirectTo({
                name: 'home'
            });
        }; //eo redirectToHome
        //when the DOM has been updated let gumby reinitialize UI modules
        var addedToDOM = function() {
            var user;
            var isChecked;
            var timeout = null; //to debounce login button
            var saveCheckBox = function() {
                //Save checkbox
                var user = _getUserData(); //get user from local storage
                function usernamePassword(username, password, isRemember) {
                    user.username = username;
                    //user.password = password; //only keep the username
                    user.password = '';
                    user.isRemember = isRemember;
                };
                isChecked = false;
                if ($('.remember-me > .checkbox').hasClass("checked")) {
                    usernamePassword($("#usernameForm").val(), $("#passwordForm").val(), true);
                    isChecked = true;
                } else {
                    usernamePassword('', '', false);
                    isChecked = false;
                }
                _setUserData(user); //save the new settings in local storage
                return isChecked;
            }; //eo saveCheckBox
            var initCheckboxes = function(user) {
                Gumby.initialize(['checkbox']); //need the checkboxes from Gumby
                user.username = user.username ? user.username : '';
                user.password = user.password ? user.password : '';
                user.isRemember = user.isRemember ? user.isRemember : true;
            }; //eo initCheckboxes
            var initIsRemember = function(user) {
                var setUsernamePassword = function(username, password, check) {
                    username = username ? username : '';
                    password = password ? password : '';
                    $("#usernameForm").val(username);
                    $("#passwordForm").val(password);
                    $('.remember-me input').trigger(check);
                };
                user.isRemember ? setUsernamePassword(user.username, user.password, 'gumby.check') : setUsernamePassword('', '', 'gumby.uncheck');
            }; //eo initIsRemember
            var resetClick = function(e) {
                var username = $("#usernameForm").val();

                function noUserName() {
                    _alert("Please enter an email address for the username.");
                }; //eo noUserName
                function hasUserName() {
                    $("#resetpwdBtn").addClass("login-active");
                    //  spinner = _createSpinner('spinner');
                    spinner.show();
                    ParseProxy.user.requestPasswordReset(username,
                        function() {
                            $("#resetpwdBtn").removeClass("login-active");
                            _alert("An email has been sent to this address with instructions for resetting the password.");
                            spinner.hide();
                        },
                        function(error) {
                            _alert("Password Reset Error: " + error.code + " " + error.message);
                            $("#resetpwdBtn").removeClass("login-active");
                            spinner.hide();
                        }
                    ); //eo passwordReset
                }; //eo hasUserName
                username && username.length > 0 ? hasUserName() : noUserName();
            }; //eo resetClick
            var signupClick = function(e) {
                $(this).addClass("bg-highlight-grey");
                $(this).css("color", "white");
                _hasNetworkConnection = true;
                setTimeout(function() {
                    Chaplin.utils.redirectTo({
                        name: 'signup'
                    });
                }, DEFAULT_ANIMATION_DELAY);
            }; //eo signupClick
            var loginClick = function(e) {
                var username = $("#usernameForm").val();
                var password = $("#passwordForm").val();
                var isChecked = $('.remember-me > .checkbox').hasClass("checked");
                var deferred = null;
                var overlay = $('#loading-overlay');
                var signinSuccess = function() {
                    var cache = _getUserData();
                    var children = [];
                    var user = Parse.User.current();
                    var flag = false;
                    var count = -1;
                    var family;
                    var mutualAcctAccess = null;
                    var doMutualAcctAccess = []; //ask to add mutual link
                    var UserAcctAccess = Parse.Object.extend("UserAcctAccess", {}, {
                        query: function() {
                            return new Parse.Query(this.className);
                        }
                    });
                    var UserParentRelation = Parse.Object.extend("UserParentRelation", {}, {
                        query: function() {
                            return new Parse.Query(this.className);
                        }
                    });
                    var query = UserAcctAccess.query();
                    var query3 = UserAcctAccess.query();
                    //  var isChecked = saveCheckBox();
                    var userAcctAccessIdsCopy = cache && cache.userAcctAccessIds ? cache.userAcctAccessIds.slice() : [];
                    var userAcctAccessIds = [user.id]; //all accounts user has access to
                    var accessAcct = null;

                    function refresh() {
                        var deferred = $.Deferred();
                        //spinner.show();
                        overlay ? overlay.show() : $.noop();
                        // since the signin view always goes to home and then it, in turn, does a getAllData; no need to do a _onBackgroundFetch here?
                        _signInRefresh = 0;
                        _onBackgroundFetch(_backgroundFetchDone, true, true, Chaplin, deferred); //(callback, immediate, getAllDataSince2010)
                    }; //eo refresh
                    function getFamilyAccounts() {
                        var deferred = $.Deferred();
                        var query = UserAcctAccess.query();
                        query.equalTo("givenAccessUserId", user.id);
                        query.find({
                            success: function(results) {
                                deferred.resolve(results);
                            },
                            error: function(error) {
                                console.log(error.message);
                                deferred.resolve([]);
                            }
                        });
                        return deferred;
                    }; //eo getFamilyAccounts
                    function familyAccounts(results) {
                        var i = 0;

                        function setAccessAcct(i, account) {
                            var name = null; //put together a full name if it is available, or, at least the last name
                            function success() { //keep which accounts to mutual link to
                                doMutualAcctAccess.push(account);
                                done();
                            };

                            function done() { //either completely done, or an account we do not want to give access to
                                account.set('ParentGrantAccessMessage', false); //do this only once
                                account.save();
                                i++;
                                i >= results.length ? deferred.resolve() : setAccessAcct(i, results[i]);
                            };
                            //todo: check if this account is not a mutual one, if it is, then do nothing
                            if (!account.get('ParentGrantAccessMessage') || account.get('mutualAccessAcct')) {
                                done();
                            } else {
                                $('#loading-overlay').hide(); //put away the spinner so we can see the confirmation message
                                name = results[i].get("firstName");
                                name = name ? name + ' ' + results[i].get("familyName") : results[i].get("familyName");
                                _confirm("You have been linked to the " + name + " family account. Provide mutual access?")
                                    .then(success, done);
                            }
                        }; //eo setAccessAcct
                        i = 0;
                        results.length > 0 ? setAccessAcct(i, results[i]) : deferred.resolve();
                        return deferred;
                    }; //eo familyAccounts
                    function familyAccountsOld(results) {
                        $.each(results, function(i, account) {
                            //alert(query);
                            var flag_ = true;
                            query3.containedIn("givenAccessUserId", userAcctAccessIds);
                            query3.equalTo("ParentGrantAccessMessage", true);
                            query3.find({
                                success: function(results) {
                                    if (results.length > 0) {
                                        _confirm("You have been given access to the " + results[0].get("familyName") + " family account. New children have been added to your list of kids and activities.");
                                        var org = results[0];
                                        org.set("ParentGrantAccessMessage", false);
                                        org.save();
                                    }
                                },
                                error: function(error) {
                                    console.log(error.message);
                                }
                            });

                            //var parentId = account.get('parentId');
                            //userAcctAccessIds.indexOf(parentId) < 0 ? userAcctAccessIds.push(parentId) : $.noop();
                            //if (userAcctAccessIdsCopy.indexOf(parentId) < 0) {
                            //    //flag = true;
                            //    count++
                            //    family = results[i].get("familyName");
                            //}
                        });
                        //if (flag) {
                        //    count == 0 ? _confirm("You have been given access to the " + family + " family account. New children have been added to your list of kids and activities.") : _confirm("You have been given access to the " + family + " family and " + count + " other accounts. New children have been added to your list of kids and activities.")
                        //}

                        var query2 = UserParentRelation.query();
                        query2.containedIn("parentId", userAcctAccessIds);
                        query2.ascending("childFirstName");
                        return query2.find();
                    }; //eo familyAccounts
                    function mutualAccounts() {
                        //loop over and create mutual access accounts
                        var deferred = $.Deferred();
                        var user = _getUserData();
                        var d = []; //data object of mutual access accounts
                        var childIdArray = [];
                        var permissionAccessArray = [];
                        var UserAcctAccess = Parse.Object.extend("UserAcctAccess");
                        var userAcctAccess = null;
                        var mobilePhone = null;

                        function success() {
                            deferred.resolve();
                        }; //eo success
                        function error() {
                            deferred.resolve();
                        }; //eo error/fail
                        //  _confirm("Provide Mutual Account Access?").then(success,error);
                        mobilePhone = user.mobilePhone || '';
                        $.each(user.children, function(i, child) {
                            childIdArray.push(child.id);
                            permissionAccessArray.push('read');
                        });
                        $.each(doMutualAcctAccess, function(i, account) { //create a Parse obj. for each mutual account
                            userAcctAccess = new UserAcctAccess();
                            userAcctAccess.set('ParentGrantAccessMessage', false);
                            userAcctAccess.set('childIdArray', childIdArray);
                            userAcctAccess.set('familyName', user.lastName);
                            userAcctAccess.set('firstName', user.firstName);
                            userAcctAccess.set('givenAccessUserEmail', account.get('parentEmail'));
                            userAcctAccess.set('givenAccessUserId', account.get('parentId'));
                            userAcctAccess.set('givenAccessUserMobilePhone', mobilePhone);
                            userAcctAccess.set('parentEmail', user.email);
                            userAcctAccess.set('parentId', user.id);
                            userAcctAccess.set('permissionAccessArray', permissionAccessArray);
                            userAcctAccess.set('mutualAccessAcct', true);
                            d.push(userAcctAccess);
                        });
                        Parse.Object.saveAll(d, {
                            success: success,
                            error: error
                        }); //save all the accounts
                        return deferred;
                    }; //eo mutualAccounts
                    function getChildrenAccounts() {
                        var query2 = UserParentRelation.query();
                        query2.containedIn("parentId", userAcctAccessIds);
                        query2.ascending("childFirstName");
                        return query2.find();
                    };

                    function childAccounts(results) {
                        var cache = _getUserData();
                        var setLocalColor = function(child, result) {
                            var children = _getUserChildren();
                            children = jQuery.grep(children, function(n) {
                                return n.id == child.id
                            }); //eo grep
                            child.localColor = children.length > 0 && children[0].localColor ? children[0].localColor : result.get("color");
                        }
                        $.each(results, function(i, result) {
                            var child = {};
                            child.id = result.get("childId");
                            child.firstName = result.get("childFirstName");
                            child.lastName = result.get("childLastName");
                            result.get("parentId") == user.id ? child.color = result.get("color") : setLocalColor(child, result); //if other account's child, set color to default blue, and set as localColor so we know not to push changes to it to Parse
                            children.push(child);
                        });
                        cache = cache === null ? {} : cache;
                        cache.children = children;
                        cache.userAcctAccessIds = userAcctAccessIds;
                        _setUserData(cache);
                        //3. Init push notification
                        //initParsePushNotification();
                        var allAvailable = !_checkUserActivations();
                    }; //eo childAccounts
                    function error(error) {
                        clearTimeout(timeout);
                        timeout = null;
                        overlay ? overlay.hide() : $.noop();
                        _alert("Could not connect to server, please try again later:" + err.code + ' ' + err.message);
                        deferred ? deferred.reject() : $.noop();
                    }; //eo error
                    clearTimeout(timeout);
                    timeout = null;
                    //sxm completely wipe user object with one from Parse
                    //spinner.show();
                    overlay ? overlay.show() : $.noop();
                    cache = JSON.parse(JSON.stringify(user.attributes));
                    cache.id = user.id;
                    cache.isRemember = isChecked;
                    _setUserData(cache);
                    //should set in storage for future redirects to home as starting page
                    _setSignedIn(true);
                    _setPreviousView();
                    // Edit by phuongnh@vinasource.com
                    // variable proxy not define, must use ParseProxy
                    _initFirstPushNotification(user, spinner, ParseProxy);
                    query.equalTo("givenAccessUserId", user.id);
                    query.find()
                        .then(familyAccounts)
                        .then(getChildrenAccounts)
                        .then(childAccounts, error)
                        .then(mutualAccounts)
                        .always(function() {
                            var flag = _getSignedIn();
                            //overlay ? overlay.hide() : $.noop();
                            clearTimeout(timeout);
                            timeout = null;
                            $("#loginBtn").removeClass("login-active");
                            deferred ? deferred.resolve() : $.noop();
                            _createUserFamilyGroup(); //move this to mutual link accounts?
                            flag ? redirectToHome() : $.noop();
                            console.log('successful signin refresh commences');
                            // refresh();
                        });
                }; //eo signinSuccess
                var signinError = function(error) {
                    //spinner.hide();
                    overlay ? overlay.hide() : $.noop();
                    _alert('Login error: the username and/or password does not match.');
                    clearTimeout(timeout);
                    timeout = null;
                    $("#loginBtn").removeClass("login-active");
                    _setSignedIn(false);
                    saveCheckBox();
                    deferred ? deferred.resolve() : $.noop();
                }; //eo signinError

				function noSignin() {
					overlay ? overlay.hide() : $.noop();
					deferred.resolve();
					_alert( "Please enter both a username and a password to sign in." );
				}; //eo noSignin
				function hasSignin() {
					$( "#loginBtn" ).addClass( "login-active" );
					saveCheckBox(); //Save checkbox
					overlay ? overlay.show() : $.noop();
					timeout = setTimeout( function () {
						overlay ? overlay.hide() : $.noop();
						_alert( "Could not connect to server, please try again later." );
					}, 30000 );
					ParseProxy.user.signin( username, password, signinSuccess, signinError ); //eo ParseProxy signin
				}; //eo hasSignin
				if ( timeout ) {
					return;
				} //debounce multiple clicks on the login button
				//spinner = _createSpinner('spinner');
				//spinner.show();
				deferred = $.Deferred();
				username.length > 0 && password.length > 0 ? hasSignin() : noSignin();
			}; //eo loginClick
			// Init The First Push Notification
			var initButtons = function () {
				//Init event handling from UI
				$( '.remember-me > .checkbox > ul' ).on( 'click', function ( e ) {
					setTimeout( function () {
						saveCheckBox();
					}, 500 ); //Gumby takes some time to render checkbox
				} ); //eo remember-me
				$( "#signupBtn" ).on( 'click', signupClick ); //eo signupBtn click
				$( "#resetpwdBtn" ).on( 'click', resetClick ); //eo resetpwdBtn
				$( "#loginBtn" ).on( 'click', loginClick ); //eo loginBtn click
			}; //eo initButtons
			var initNetwork = function () {
				function noNetwork() {
					$( '.p2' ).removeClass( 'p2' );
					$( '#connectivity-row' ).show();
				};
				_hasNetworkConnection === false ? noNetwork() : $.noop();
			};
			user = _getUserData() || {}; //1. Get user information
			initCheckboxes( user );
			initIsRemember( user );
			_setUserData( user ); //save setup
			/* MAIN ACTION IS HERE, WHEN THE USER CLICKS THE LOGIN BUTTON */
			initButtons();
			initNetwork(); //check if we are online
		    /* ---------------------------------------------------------- */

			touch.$("#terms").on('click', function (e) {
			    Chaplin.utils.redirectTo({
			        name: 'tos'
			    });
			});
			touch.$("#privacy").on('click', function (e) {
			    Chaplin.utils.redirectTo({
			        name: 'privacy'
			    });
			});
		}; //eo addedToDOM
		var __id = 'user-signin';
		var View = View.extend( {
			template: Template,
			autoRender: true,
			keepElement: false,
			id: __id,
			listen: {
				addedToDOM: addedToDOM
			},
			initialize: function ( options ) {
				_setCurrentView( _view.USER_SIGNIN, __id );
				isMobile = _isMobile(); //are we on the mobile platform
				// console.log('signin-view initialize--isMobile: ' + isMobile);
				Chaplin.View.prototype.initialize.call( this, arguments );
			}
		} ); //eo View.extend

        return View;
    });