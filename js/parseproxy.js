define( [ 'chaplin', 'parse', 'jquery', 'module', 'jqueryparse' ], function ( Chaplin, Parse, $, module ) {
	'use strict';


	function ParseProxy() {
		/* _.extend(this, { //grab the global config
          "applicationId": module.config().applicationId,
          "clientKey": module.config().clientKey,
          "javascriptKey": module.config().javascriptKey,
          "RESTKey": module.config().RESTKey,
          "$": $
      }, Parse);



      var initialize = function(applicationId, javascriptKey) {
          Parse.$ = $;
          // Initialize Parse with your Parse application javascript keys
          Parse.initialize(applicationId, javascriptKey);
          console.log("Parse is initialized");
      }

      //when constructing, initialize Parse with config
      initialize(this.applicationId, this.javascriptKey);*/

    console.log('Running ParentPlanet app on ' + MODESERVER + ' server');

		Parse.$ = $;
		Parse._initialize( module.config().applicationId, module.config().javascriptKey, module.config().masterKey );
		// Parse.serverURL = "http://192.168.1.18:1337/parse"
		// Parse.serverURL = "http://parseserver.mw-appdesign.vn/parse"
		Parse.serverURL = module.config().serverURL;
		Parse.masterKey = module.config().masterKey;
		// Parse.useMasterKey = true;
		//console.log("Parse is initialized");

		var proxy = {
			user: {
				signin: function ( username, password, onSuccess, onError ) {
					//Check login with Parse
					Parse.User.logIn( username, password, {
						success: function ( user ) {
							onSuccess( user );
						},
						error: function ( user, error ) {
							onError( user, error );
						}
					} );

				},

				requestPasswordReset: function ( username, onSuccess, onError ) {
					//Check login with Parse
					Parse.User.requestPasswordReset( username, {
            useMasterKey: true,
						success: function ( user ) {
							onSuccess( user );
						},
						error: function ( user, error ) {
							onError( user, error );
						}
					} );

				},

				signup: function ( email, password, mobilePhone, type, onSuccess, onError ) {
					//Check user on Parse
					var user = new Parse.User();
					user.set( "username", email );
					user.set( "email", email );
					user.set( "password", password );
					user.set( "mobilePhone", mobilePhone );
					user.set( "type", type );
					user.set( "firstName", "" );
					user.set( "lastName", "" );
					user.set( "homePhone", "" );
					user.set( "workPhone", "" );
					user.set( "addressLine1", "" );
					user.set( "addressLine2", "" );
					user.set( "city", "" );
					user.set( "state", "" );
					user.set( "zip", "" );
					user.set( "country", "" );
					user.signUp( null, {
						success: function ( user ) {
							onSuccess( user );
						},
						error: function ( user, error ) {
							onError( user, error );
						}
					} );

				},

				subsequentSignup: function ( user, firstName, lastName, homePhone, workPhone, addressLine1, addressLine2, city, state, zip, country, onSuccess, onError ) {
					//Check user on Parse
					user.set( "firstName", firstName );
					user.set( "lastName", lastName );
					user.set( "homePhone", homePhone );
					user.set( "workPhone", workPhone );
					user.set( "addressLine1", addressLine1 );
					user.set( "addressLine2", addressLine2 );
					user.set( "city", city );
					user.set( "state", state );
					user.set( "zip", zip );
					user.set( "country", country );

					user.save( null, {
						success: function ( user ) {
							onSuccess( user );
						},
						error: function ( user, error ) {
							onError( user, error );
						}
					} );
				},

				signoff: function () {

				}
			},

			event: {

				create: function ( fromEmail, toListId, title, location, allDay, starts, ends, repeat, reminder, note, onSuccess, onError ) {
					var P2Event = Parse.Object.extend( "Event" );
					var p2Event = new P2Event();


					//Get all recipient IDs
					//In this case, it should be all parent IDs
					/*
					    1. Get List Object
					    2. From List Object, get student IDs
					    3. From Student IDs, get Parent Objects
					    4. From Parent Objects, get Parent Emails
					    5. Construct Array of Parent Emails
					    6. Store New Event Object
					    7. Send Push Notification to all recipients
					*/

					//Step 1
					var P2List = Parse.Object.extend( "List", {}, {
						query: function () {
							return new Parse.Query( this.className );
						}
					} );
					var query = P2List.query();
					query.equalTo( "objectId", toListId );
					query.find( {
						error: function ( error ) {
							_alert( "Error: " + error.code + " " + error.message );
						},
						success: function ( results ) {
							var list = results[ 0 ];
							var studentIds = list.get( "listMembers" );

							//Step 2
							var P2Student = Parse.Object.extend( "Student", {}, {
								query: function () {
									return new Parse.Query( this.className );
								}
							} );
							query = P2Student.query();
							query.containedIn( "objectId", studentIds );
							query.exists( "parentId" );
							query.find( {
								error: function ( error ) {
									_alert( "Error: " + error.code + " " + error.message );
								},
								success: function ( results ) {
									var student, parentIds = []
									for ( var i = 0; i < results.length; i++ ) {
										student = results[ i ];
										if ( parentIds.indexOf( student.get( "parentId" ) ) == -1 ) {
											parentIds.push( student.get( "parentId" ) );
										}
									}

									//Step 3
									query = new Parse.Query( Parse.User );
									query.containedIn( "objectId", parentIds );
									query.equalTo( "type", "parent" );
									query.find( {
										error: function ( error ) {
											_alert( "Error: " + error.code + " " + error.message );
										},
										success: function ( results ) {
											//Step 4 and 5
											var parent, parentEmails = [],
												parentIds = [];
											for ( var i = 0; i < results.length; i++ ) {
												parent = results[ i ];

												if ( parentEmails.indexOf( parent.get( "email" ) ) == -1 ) {
													parentEmails.push( parent.get( "email" ) );
												}
												if ( parentIds.indexOf( parent.id ) == -1 ) {
													parentIds.push( parent.id );
												}
											}
											/*console.log(parentIds);
											console.log(parentEmails);*/

											//Step 6
											p2Event.set( "fromEmail", fromEmail );
											p2Event.set( "toList", toListId );
											p2Event.set( "parentIds", parentIds );
											p2Event.set( "parentEmails", parentEmails );
											p2Event.set( "title", title );
											p2Event.set( "location", location );
											p2Event.set( "allDay", allDay );
											p2Event.set( "starts", starts );
											p2Event.set( "ends", ends );
											p2Event.set( "repeat", repeat );
											p2Event.set( "reminder", reminder );
											p2Event.set( "reminder2", reminder2 );
											p2Event.set( "isRead", false );
											p2Event.set( "note", note );
											/*    Parse already provide these properties for us
											                                            p2Event.set("createdDate", new Date());
											                                            p2Event.set("editedDate", "");*/

											p2Event.save( null, {
												success: function ( result ) {
													// Execute any logic that should take place after the object is saved.
													//alert('New object created with objectId: ' + result.id);
													onSuccess( result );
												},
												error: function ( result, error ) {
													// Execute any logic that should take place if the save fails.
													// error is a Parse.Error with an error code and description.
													//alert('Failed to create new object, with error code: ' + error.description);
													onError( result, error );
												}
											} );



										}

									} );
								}

							} );


						}
					} );



				},

				edit: function ( id, title, location, allDay, starts, ends, repeat, reminder, note, onSuccess, onQueryError, onError ) {
					var P2Event = Parse.Object.extend( "Event", {}, {
						query: function () {
							return new Parse.Query( this.className );
						}
					} );
					var query = P2Event.query();
					query.get( id, {
						success: function ( p2Event ) {
							// The object was retrieved successfully.
							p2Event.set( "fromEmail", fromEmail );
							p2Event.set( "toEmail", toEmail );
							p2Event.set( "title", title );
							p2Event.set( "location", location );
							p2Event.set( "allDay", allDay );
							p2Event.set( "starts", starts );
							p2Event.set( "ends", ends );
							p2Event.set( "repeat", repeat );
							p2Event.set( "reminder", reminder );
							p2Event.set( "reminder2", reminder2 );
							p2Event.set( "note", note );
							/*
							                            p2Event.set("editedDate", new Date());*/

							p2Event.save( null, {
								success: function ( p2Event ) {
									// Execute any logic that should take place after the object is saved.
									//alert('New object created with objectId: ' + p2Event.id);
									onSuccess( p2Event );
								},
								error: function ( p2Event, error ) {
									// Execute any logic that should take place if the save fails.
									// error is a Parse.Error with an error code and description.
									//alert('Failed to create new object, with error code: ' + error.description);
									onError( p2Event, error );
								}
							} );
						},
						error: function ( object, error ) {
							// The object was not retrieved successfully.
							// error is a Parse.Error with an error code and description.
							onQueryError( object, error );
						}
					} );
				},

				delete: function () {

				}
			},

			message: {
				create: function ( fromEmail, fromUserFirstName, fromUserLastName, toListId, title, message, onSuccess, onError ) {

					//Get all recipient IDs
					//In this case, it should be all parent IDs
					/*
					    1. Get List Object
					    2. From List Object, get student IDs
					    3. From Student IDs, get Parent Objects
					    4. From Parent Objects, get Parent Emails
					    5. Construct Array of Parent Emails
					    6. Store New Message Object
					    7. Send Push Notification to all recipients
					*/

					//Step 1
					var P2List = Parse.Object.extend( "List", {}, {
						query: function () {
							return new Parse.Query( this.className );
						}
					} );
					var query = P2List.query();
					query.equalTo( "objectId", toListId );
					query.find( {
						error: function ( error ) {
							_alert( "Error: " + error.code + " " + error.message );
						},
						success: function ( results ) {
							var list = results[ 0 ];
							var studentIds = list.get( "listMembers" );

							//Step 2
							var P2Student = Parse.Object.extend( "Student", {}, {
								query: function () {
									return new Parse.Query( this.className );
								}
							} );
							query = P2Student.query();
							query.containedIn( "objectId", studentIds );
							query.exists( "parentId" );
							query.find( {
								error: function ( error ) {
									_alert( "Error: " + error.code + " " + error.message );
								},
								success: function ( results ) {
									var student, parentIds = []
									for ( var i = 0; i < results.length; i++ ) {
										student = results[ i ];
										if ( parentIds.indexOf( student.get( "parentId" ) ) == -1 ) {
											parentIds.push( student.get( "parentId" ) );
										}
									}

									//Step 3
									query = new Parse.Query( Parse.User );
									query.containedIn( "objectId", parentIds );
									query.equalTo( "type", "parent" );
									query.find( {
										error: function ( error ) {
											_alert( "Error: " + error.code + " " + error.message );
										},
										success: function ( results ) {
											//Step 4 and 5
											var parent, parentEmails = [],
												parentIds = [];
											for ( var i = 0; i < results.length; i++ ) {
												parent = results[ i ];

												if ( parentEmails.indexOf( parent.get( "email" ) ) == -1 ) {
													parentEmails.push( parent.get( "email" ) );
												}
												if ( parentIds.indexOf( parent.id ) == -1 ) {
													parentIds.push( parent.id );
												}
											}
											//Step 6

											var P2Message = Parse.Object.extend( "Message" );
											var p2Message = new P2Message();

											p2Message.set( "fromEmail", fromEmail );
											p2Message.set( "fromUserFirstName", fromUserFirstName );
											p2Message.set( "fromUserLastName", fromUserLastName );
											p2Message.set( "fromEmail", fromEmail );
											p2Message.set( "toList", toListId );
											p2Message.set( "parentIds", parentIds );
											p2Message.set( "parentEmails", parentEmails );
											p2Message.set( "title", title );
											p2Message.set( "message", message );
											p2Message.set( "isRead", false );

											p2Message.save( null, {
												success: function ( p2Message ) {
													// Execute any logic that should take place after the object is saved.
													//alert('New object created with objectId: ' + p2Event.id);
													onSuccess( p2Message );
												},
												error: function ( p2Message, error ) {
													// Execute any logic that should take place if the save fails.
													// error is a Parse.Error with an error code and description.
													//alert('Failed to create new object, with error code: ' + error.description);
													onError( p2Message, error );
												}
											} );



										}

									} );
								}

							} );


						}
					} );




				},
				edit: function () {
					//We shall not allow sent message to be edited
				},
				delete: function () {

				}
			},

			homework: {
				create: function ( fromEmail, toListId, title, type, assigned, due, repeat, reminder, note, onSuccess, onError ) {

					var P2List = Parse.Object.extend( "List", {}, {
						query: function () {
							return new Parse.Query( this.className );
						}
					} );
					var query = P2List.query();
					query.equalTo( "objectId", toListId );
					query.find( {
						error: function ( error ) {
							_alert( "Error: " + error.code + " " + error.message );
						},
						success: function ( results ) {
							var list = results[ 0 ];
							var studentIds = list.get( "listMembers" );

							//Step 2
							var P2Student = Parse.Object.extend( "Student", {}, {
								query: function () {
									return new Parse.Query( this.className );
								}
							} );
							query = P2Student.query();
							query.containedIn( "objectId", studentIds );
							query.exists( "parentId" );
							query.find( {
								error: function ( error ) {
									_alert( "Error: " + error.code + " " + error.message );
								},
								success: function ( results ) {
									var student, parentIds = []
									for ( var i = 0; i < results.length; i++ ) {
										student = results[ i ];
										if ( parentIds.indexOf( student.get( "parentId" ) ) == -1 ) {
											parentIds.push( student.get( "parentId" ) );
										}
									}

									//Step 3
									query = new Parse.Query( Parse.User );
									query.containedIn( "objectId", parentIds );
									query.equalTo( "type", "parent" );
									query.find( {
										error: function ( error ) {
											_alert( "Error: " + error.code + " " + error.message );
										},
										success: function ( results ) {
											//Step 4 and 5
											var parent, parentEmails = [],
												parentIds = [];
											for ( var i = 0; i < results.length; i++ ) {
												parent = results[ i ];

												if ( parentEmails.indexOf( parent.get( "email" ) ) == -1 ) {
													parentEmails.push( parent.get( "email" ) );
												}
												if ( parentIds.indexOf( parent.id ) == -1 ) {
													parentIds.push( parent.id );
												}
											}
											/*console.log(parentIds);
											console.log(parentEmails);*/
											var P2Homework = Parse.Object.extend( "Homework" );
											var p2Homework = new P2Homework();

											p2Homework.set( "fromEmail", fromEmail );
											p2Homework.set( "toList", toListId );
											p2Homework.set( "parentIds", parentIds );
											p2Homework.set( "parentEmails", parentEmails );
											p2Homework.set( "title", title );
											p2Homework.set( "type", type );
											p2Homework.set( "assigned", assigned );
											p2Homework.set( "due", due );
											p2Homework.set( "repeat", repeat );
											p2Homework.set( "reminder", reminder );
											p2Homework.set( "note", note );
											p2Homework.set( "isRead", false );

											p2Homework.save( null, {
												success: function ( p2Homework ) {
													// Execute any logic that should take place after the object is saved.
													//alert('New object created with objectId: ' + p2Event.id);
													onSuccess( p2Homework );
												},
												error: function ( p2Homework, error ) {
													// Execute any logic that should take place if the save fails.
													// error is a Parse.Error with an error code and description.
													//alert('Failed to create new object, with error code: ' + error.description);
													onError( p2Homework, error );
												}
											} );



										}

									} );
								}

							} );


						}
					} );
				},
				edit: function () {
					//We shall not allow sent message to be edited
				},
				delete: function () {

				}
			}

		}

		//return this === ParseProxy initialized!
		_.extend( proxy, { //grab the global config and add keys to proxy obj, include $.parse
			"applicationId": module.config().applicationId,
			"clientKey": module.config().clientKey,
			"javascriptKey": module.config().javascriptKey,
			"RESTKey": module.config().RESTKey,
			"REST": $.parse
		} );

		//initialize proxy.REST using applicationId / RESTKey
		proxy.REST.init( {
			app_id: proxy.applicationId,
			rest_key: proxy.RESTKey
		} );

		//return object for use in P2
		return proxy;
	};


	//return the ParseProxy constructor :)
	return ParseProxy();

} );
