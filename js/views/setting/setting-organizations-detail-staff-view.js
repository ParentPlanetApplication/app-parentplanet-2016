define( [
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-organizations-detail-staff-view.hbs',
    'jquery',
    'spinner',
    'parse'
], function ( Chaplin, View, Template, $, midSpinner, Parse ) {
	'use strict';

	//var staffIdNameArray;
	var staffNameArray;
	var staffIdArray;
	var staffData;
	var staffRelationData;
	var permissionDataArray = [];
	var staffIdWithNewPermissionDataArray = [];
	var user;
	var selectedOrgId;
	var selectedOrgData;
	var spinner;

	var initData = function () {
		user = _getUserData();
		selectedOrgId = user.setting.selectedOrgId;
		selectedOrgData = user.setting.selectedOrgData;
		console.log( selectedOrgData );
		staffNameArray = [];
		staffIdArray = [];
		permissionDataArray = []; //in lower case
		staffIdWithNewPermissionDataArray = [];
	}; //eo initData
	var addFullItem = function ( staff ) {
		var firstName = staff.get( 'firstName' );
		firstName = firstName ? firstName : staff.get( 'email' );
		var lastName = staff.get( 'lastName' );
		lastName = lastName ? lastName : '';
		var selectedText4Admin = staffRelationData[ staffIdArray.indexOf( staff.id ) ].get( "permission" ).toLowerCase() == "admin" ? "selected" : "";
		var selectedText4Faculty = staffRelationData[ staffIdArray.indexOf( staff.id ) ].get( "permission" ).toLowerCase() == "faculty" ? "selected" : "";
		var selectedText4Teacher = staffRelationData[ staffIdArray.indexOf( staff.id ) ].get( "permission" ).toLowerCase() == "teacher" ? "selected" : "";
		var selectedText4Nurse = staffRelationData[ staffIdArray.indexOf( staff.id ) ].get( "permission" ).toLowerCase() == "nurse" ? "selected" : "";
		var selectedText4ClassParent = staffRelationData[ staffIdArray.indexOf( staff.id ) ].get( "permission" ).toLowerCase() == "class parent" ? "selected" : "";
		$( "#content" ).append( '<div id="' + staff.id + '" class="menu-staff-editor"><div class="circle-icon-wrapper"><i class="icon-fontello-circle icon-grey"></i></div>' +
			'<div class="info"><span>' + firstName + ' ' + lastName + '</span><div class="field-wrapper">Permissions ' +
			'<div class="field"><div class="picker"><select>' +
			'<option value="Admin" ' + selectedText4Admin + '>Admin</option>' +
			'<option value="Faculty" ' + selectedText4Faculty + '>Faculty</option>' +
			'<option value="Teacher" ' + selectedText4Teacher + '>Teacher</option>' +
			'<option value="Nurse" ' + selectedText4Nurse + '>Nurse</option>' +
			'<option value="Class Parent" ' + selectedText4ClassParent + '>Class Parent</option>' +
			'</select></div></div></div></div><div class="delete-btn hidden">Delete</div></div>' ); //eo content append
	}; //eo addFullItem
	var addItem = function ( staff ) {
		var firstName = staff.get( 'firstName' );
		firstName = firstName ? firstName : staff.get( 'email' );
		var lastName = staff.get( 'lastName' );
		lastName = lastName ? lastName : '';
		$( "#content" ).append( '<div id="' + staff.id + '" class="menu-staff-editor">' +
			'<div class="circle-icon-wrapper"><i class="icon-fontello-circle icon-grey"></i>' +
			'</div><div class="info"><span>' + firstName + ' ' + lastName + '</span>' +
			'<div class="field-wrapper">Permission: ' + _toTitleCase( staffRelationData[ staffIdArray.indexOf( staff.id ) ].get( "permission" ) ) +
			'</div></div></div>' );
	}; //eo addItem
	var loadOrganizationStaff = function () {
		spinner = _createSpinner( 'spinner' );
		//Get staffs
		var UserOrganizationRelation = Parse.Object.extend( "UserOrganizationRelation", {}, {
			query: function () {
				return new Parse.Query( this.className );
			}
		} );
		var query = UserOrganizationRelation.query();
		query.equalTo( "organizationId", selectedOrgId );
		query.notContainedIn( "relation", [ "parent", "student" ] );
		query.find( {
			success: function ( results ) {
				staffRelationData = results;
				staffIdArray = [];
				for ( var i = 0; i < results.length; i++ ) {
					var relation = results[ i ];
					staffIdArray.push( relation.get( "userId" ) );
				}
				//Load user who are staffs
				staffLoad();
			},
			error: function ( error ) {
				//Todo: show error message
				spinner.stop();
			}
		} ); //eo query find

		var staffLoad = function () {
			var query = new Parse.Query( Parse.User );

			function error( err ) {
				console.log( err.message );
				spinner.stop();
			} //eo error
			function success( results ) {
				staffData = results;
				//staffIdNameArray = [];
				//Reset
				if ( user.isAdmin || user.setting.permissonOfSelectedOrg == "admin" ) {
					$.each( results, function ( i, staff ) {
						var firstName = staff.get( 'firstName' );
						firstName = firstName ? firstName : staff.get( 'email' );
						var lastName = staff.get( 'lastName' );
						lastName = lastName ? lastName : '';
						staffNameArray.push( firstName + " " + lastName );
						permissionDataArray.push( staffRelationData[ staffIdArray.indexOf( staff.id ) ].get( "permission" ) );
						addFullItem( staff );
					} ); //eo each
				} else { //else user.isAdmin
					//For those who can only read
					$.each( results, function ( i, staff ) {
						var firstName = staff.get( 'firstName' );
						firstName = firstName ? firstName : staff.get( 'email' );
						var lastName = staff.get( 'lastName' );
						lastName = lastName ? lastName : '';
						staffNameArray.push( firstName + " " + lastName );
						addItem( staff );
					} ); //eo each
				} //eo else
				//Reset staff id array index to match staff data for search function
				staffIdArray = [];
				$.each( results, function ( i, staff ) {
					staffIdArray.push( staff.id );
				} );
				//Init event for admin and faculty
				if ( user.isAdmin || user.setting.permissonOfSelectedOrg == "admin" ) {
					$( ".circle-icon-wrapper" ).on( "click", function ( e ) {
						//If select to delete
						if ( $( this ).children().eq( 0 ).hasClass( "icon-fontello-circle" ) ) {
							$( this ).children().eq( 0 ).removeClass( "icon-fontello-circle" );
							$( this ).children().eq( 0 ).addClass( "icon-fontello-ok-circled" );
							$( this ).children().eq( 0 ).removeClass( "icon-grey" );
							$( this ).children().eq( 0 ).addClass( "icon-red" );
							//Show delete button
							$( this ).parent().children().eq( 2 ).removeClass( "hidden" );
						} else {
							$( this ).children().eq( 0 ).addClass( "icon-fontello-circle" );
							$( this ).children().eq( 0 ).removeClass( "icon-fontello-ok-circled" );
							$( this ).children().eq( 0 ).addClass( "icon-grey" );
							$( this ).children().eq( 0 ).removeClass( "icon-red" );
							//Hide delete button
							$( this ).parent().children().eq( 2 ).addClass( "hidden" );
						}
					} ); //eo circle-icon-wrapper click
				}

				$( ".info > span" ).on( "click", function ( e ) {
					var div = $( this ).parent().children().eq( 0 ).children().eq( 0 );
					//If select to delete
					if ( div.hasClass( "icon-fontello-circle" ) ) {
						div.removeClass( "icon-fontello-circle" );
						div.addClass( "icon-fontello-ok-circled" );
						div.removeClass( "icon-grey" );
						div.addClass( "icon-red" );
						//Show delete button
						$( this ).parent().children().eq( 2 ).removeClass( "hidden" );
					} else {
						div.addClass( "icon-fontello-circle" );
						div.removeClass( "icon-fontello-ok-circled" );
						div.addClass( "icon-grey" );
						div.removeClass( "icon-red" );
						//Hide delete button
						$( this ).parent().children().eq( 2 ).addClass( "hidden" );
					}
				} ); //eo info > span click

				$( ".delete-btn" ).on( "click", function ( e ) {
					var staffId = $( this ).parent().attr( "id" );
					var defer = _confirm( "Do you want to delete " + $( this ).parent().children().eq( 1 ).children().eq( 0 ).html() + " ?" );
					defer.done( function () {
						$( this ).parent().animate( {
							"opacity": 0
						}, 1000, function () {
							$( this ).remove();
						} );
						$( '#' + staffId ).addClass( "hidden" );
						deleteStaff( staffId );
					} ); //eo defer.done
				} ); //eo delete-btn click

				$( 'select' ).on( 'change', function () {
					var newPermission = $( this ).val().toLowerCase();
					var staffId = $( this ).parent().parent().parent().parent().parent().attr( "id" );
					var index = staffIdArray.indexOf( staffId );
					var permission = permissionDataArray[ index ];
					if ( permission != newPermission ) {
						permissionDataArray[ index ] = newPermission;
						if ( staffIdWithNewPermissionDataArray.indexOf( staffId ) == -1 ) {
							staffIdWithNewPermissionDataArray.push( staffId );
						}
					}
				} ); //eo select change
				$( ".upper-area" ).removeClass( "hidden" );
				$( ".lower-area" ).removeClass( "hidden" );
				if ( user.isAdmin || user.setting.permissonOfSelectedOrg == "admin" ) {
					$( "#doneBtn" ).removeClass( "hidden" );
				}
				spinner.stop();
			}; //eo success
			query.containedIn( "objectId", staffIdArray );
			query.ascending( "firstName" );
			query.find( {
				success: success,
				error: error
			} ); //eo query.find
		}; //eo staffLoad
	}; //eo loadOrganizationStaff

	var deleteStaff = function ( staffId ) {
		var UserOrganizationRelation = Parse.Object.extend( "UserOrganizationRelation", {}, {
			query: function () {
				return new Parse.Query( this.className );
			}
		} );
		var query = UserOrganizationRelation.query();
		query.equalTo( "userId", staffId );
		query.equalTo( "organizationId", selectedOrgId );
		//console.log(staffId + " " + selectedOrgId);
		var spinner = _createSpinner( 'spinner' );
		query.find( {
			success: function ( results ) {
			    var relation = results[0];
			    var relationId = relation.get("userId");
			    console.log(relationId);
			    removeOrganizationAdminIdList(relationId);
			  
				relation.destroy( {
				    success: function (relation) {
						deleteUserCustomLists( staffId );
						deleteFromAdminIdList( staffId );
						// The object was deleted from the Parse Cloud.
						console.log( "Successfully deleted staff" );
					},
					error: function ( relation, error ) {
						// The delete failed.
						// error is a Parse.Error with an error code and message.
						console.log( "Could not delete staff" );
					}
				} );
				spinner.stop();
			},
			error: function ( error ) {
				//Show error message
				spinner.stop();
			}
		} ); //eo query.find
		//Remove from memory cache ( global vars and arrays)
		var index = staffIdArray.indexOf( staffId );
		//staffIdNameArray.splice(index, 1);
		staffNameArray.splice( index, 1 );
		staffIdArray.splice( index, 1 );
		staffData.splice( index, 1 );
		staffRelationData.splice( index, 1 );
	}; //eo deleteStaff

	var deleteUserOrganizationGroupRelations = function ( staffId, orgGroupArray ) {
		var UserOrganizationGroupRelation = Parse.Object.extend( "UserOrganizationGroupRelation", {}, {
			query: function () {
				return new Parse.Query( this.className );
			}
		} );
		var query = UserOrganizationGroupRelation.query();
		query.equalTo( "userId", staffId );
		query.containedIn( "organizationGroupId", orgGroupArray );
		query.find( {
			success: function ( results ) {
				$.each( results, function ( i, groupRelation ) {
					groupRelation.destroy();
				} );
			},
			error: function ( error ) {
				console.log( 'Error: ' + JSON.stringify( error ) );
			}
		} );
	}; //eo deleteUserOrganizationGroupRelations

	var deleteUserCustomLists = function ( staffId ) {
		var UserCustomList = Parse.Object.extend( "UserCustomList", {}, {
			query: function () {
				return new Parse.Query( this.className );
			}
		} );
		var query = UserCustomList.query();
		query.equalTo( "ownerId", staffId );
		query.equalTo( "organizationId", selectedOrgId );
		query.find( {
			success: function ( results ) {
				$.each( results, function ( i, customList ) {
					customList.destroy();
				} )
			},
			error: function ( error ) {
				console.log( 'Error: ' + JSON.stringify( error ) );
			}
		} );
	}; //eo deleteUserCustomLists

	var deleteFromAdminIdList = function ( staffId ) {
		var OrganizationGroup = Parse.Object.extend( "OrganizationGroup", {}, {
			query: function () {
				return new Parse.Query( this.className );
			}
		} );
		var query = OrganizationGroup.query();
		query.equalTo( "organizationId", selectedOrgId );
		query.find( {
			success: function ( results ) {
				var orgGroupArray = [];
				$.each( results, function ( i, orgGroup ) {
					var adminIdList = orgGroup.get( "adminIdList" );
					if ( adminIdList.indexOf( staffId ) != -1 ) {
						var adminJsonList = orgGroup.get( "adminJsonList" );
						delete adminJsonList[ staffId ];
						orgGroup.remove( "adminIdList", staffId );
						orgGroup.save();
					}
					orgGroupArray.push( orgGroup.id );
				} );
				deleteUserOrganizationGroupRelations( staffId, orgGroupArray );
			},
			error: function ( error ) {
				console.log( 'Error: ' + JSON.stringify( error ) );
			}
		} );
	}; //eo deleteFromAdminIdList

	var initSearch = function () {
		var doSearch = function () {
			var targetStaffIdArray = [];
			//Re-init events
			$( ".circle-icon-wrapper" ).off( "click" );
			$( ".info" ).off( "click" );
			$( ".delete-btn" ).off( "click" );
			$( "select" ).off( "change" );
			var str = $( "#searchTxt" ).val().toLowerCase();
			$.each( staffNameArray, function ( i, name ) {
				if ( name.toLowerCase().indexOf( str ) != -1 ) {
					var id = staffIdArray[ i ];
					targetStaffIdArray.push( id );
				}
			} );
			//console.log(targetStaffIdArray)
			$( "#content" ).empty();
			user = _getUserData();
			if ( user.isAdmin || user.setting.permissonOfSelectedOrg == "admin" ) {
				$.each( targetStaffIdArray, function ( i, staffId ) {
					var staff = staffData[ staffIdArray.indexOf( staffId ) ];
					addFullItem( staff );
				} );
			} else {
				//For those who can only read
				$.each( targetStaffIdArray, function ( i, staffId ) {
					var staff = staffData[ staffIdArray.indexOf( staffId ) ];
					addItem( staff );
				} );
			} //eo else

			//Init event for admin and faculty
			if ( user.isAdmin || user.setting.permissonOfSelectedOrg == "admin" ) {
				$( ".circle-icon-wrapper" ).on( "click", function ( e ) {
					//If select to delete
					if ( $( this ).children().eq( 0 ).hasClass( "icon-fontello-circle" ) ) {
						$( this ).children().eq( 0 ).removeClass( "icon-fontello-circle" );
						$( this ).children().eq( 0 ).addClass( "icon-fontello-ok-circled" );
						$( this ).children().eq( 0 ).removeClass( "icon-grey" );
						$( this ).children().eq( 0 ).addClass( "icon-red" );
						//Show delete button
						$( this ).parent().children().eq( 2 ).removeClass( "hidden" );
					} else {
						$( this ).children().eq( 0 ).addClass( "icon-fontello-circle" );
						$( this ).children().eq( 0 ).removeClass( "icon-fontello-ok-circled" );
						$( this ).children().eq( 0 ).addClass( "icon-grey" );
						$( this ).children().eq( 0 ).removeClass( "icon-red" );
						//Hide delete button
						$( this ).parent().children().eq( 2 ).addClass( "hidden" );
					}
				} ); //eo circle-icon-wrapper click
			}

			$( ".info​ > span" ).on( "click", function ( e ) {
				var div = $( this ).parent().children().eq( 0 ).children().eq( 0 );
				//If select to delete
				if ( div.hasClass( "icon-fontello-circle" ) ) {
					div.removeClass( "icon-fontello-circle" );
					div.addClass( "icon-fontello-ok-circled" );
					div.removeClass( "icon-grey" );
					div.addClass( "icon-red" );
					//Show delete button
					$( this ).parent().children().eq( 2 ).removeClass( "hidden" );
				} else {
					div.addClass( "icon-fontello-circle" );
					div.removeClass( "icon-fontello-ok-circled" );
					div.addClass( "icon-grey" );
					div.removeClass( "icon-red" );
					//Hide delete button
					$( this ).parent().children().eq( 2 ).addClass( "hidden" );
				}
			} ); //eo info > span click

			$( ".delete-btn" ).on( "click", function ( e ) {
				var staffId = $( this ).parent().attr( "id" );
				var defer = _confirm( "Do you want to delete " + $( this ).parent().children().eq( 1 ).children().eq( 0 ).html() + " ?" );
				defer.done( function () {
					$( this ).parent().animate( {
						"opacity": 0
					}, 1000, function () {
						$( this ).remove();
					} );
					deleteStaff( staffId );
				} );
			} ); //eo delete-btn click

			$( 'select' ).on( 'change', function () {
				var newPermission = $( this ).val().toLowerCase();
				var staffId = $( this ).parent().parent().parent().parent().parent().attr( "id" );
				var index = staffIdArray.indexOf( staffId );
				var permission = permissionDataArray[ index ];
				if ( permission != newPermission ) {
					permissionDataArray[ index ] = newPermission;
					if ( staffIdWithNewPermissionDataArray.indexOf( staffId ) == -1 ) {
						staffIdWithNewPermissionDataArray.push( staffId );
					}
				}
			} ); //eo select change
		}; //eo doSearch

		$( "#searchTxt" ).keyup( function ( e ) {
			switch ( e.keyCode ) {
			case 8: // Backspace
				var str = $( "#searchTxt" ).val().toLowerCase();
				$( "#searchTxt" ).val( str.substring( 0, str.length ) );
				doSearch();
				break;
			case 9:
				doSearch();
				break; // Tab
			case 13:
				doSearch();
				break; // Enter
			case 37:
				doSearch();
				break; // Left
			case 38:
				doSearch();
				break; // Up
			case 39:
				doSearch();
				break; // Right
			case 40:
				doSearch();
				break; // Down
			default:
				doSearch();
			}
		} ); //eo keyUp

		$( "#searchBtn" ).on( 'click', function () {
			doSearch();
		} );
		$( "#doneBtn" ).on( "click", function ( e ) {
			midSpinner.show();
			var selectedOrgId = user.setting.selectedOrgId;
			//Update staffs
			var UserOrganizationRelation = Parse.Object.extend( "UserOrganizationRelation", {}, {
				query: function () {
					return new Parse.Query( this.className );
				}
			} );
			var query = UserOrganizationRelation.query();
			var spinner = _createSpinner( 'spinner' );
			user = _getUserData();
      var user_ = _getUserData();
			query.equalTo( "organizationId", selectedOrgId );
			query.containedIn( "userId", staffIdWithNewPermissionDataArray );
			query.find( {
				success: function ( results ) {
					$.each( results, function ( i, relation ) {
						var relationId = relation.get( "userId" );
						var newPermission = permissionDataArray[ staffIdArray.indexOf( relationId ) ];

						/*
						  Edit by phuongnh@vinasource
						  make sure before update permission, will clear current user out to adminIdList
						  and only re-add if permission is Admin or faculty
						  for 2 action: remove or add
						*/
						if ( newPermission == 'admin' || newPermission == 'faculty' ) {
							// adminIdList.push( relationId );
							// adminJsonList[ relationId ] = newPermission == "admin" ? "Admin" : "Faculty";

							addOrganizationAdminIdList( relationId );
							findOrgGroups( relationId, newPermission );
							user_.setting.selectedOrgData.adminIdList.push( relationId );
						} else {
							removeOrganizationAdminIdList( relationId );
							findOrgGroups( relationId, newPermission );
							user_.setting.selectedOrgData.adminIdList = jQuery.grep( user.setting.selectedOrgData.adminIdList, function ( value ) {
								return value != relationId;
							} );
						}

						relation.set( "permission", newPermission );
						relation.save( null, {
							success: function ( relation ) {
								// Now let's update it with some new data. In this case, only cheatMode and score
								// will get sent to the cloud. playerName hasn't changed.
                console.log( user_ );
                _setUserData( user_ );
							}
						} );
					} ); //eo each

					// updateOrgGroups();

					midSpinner.hide();
					redirect();
				},
				error: function ( error ) {
					//Todo: show error message
					midSpinner.hide();
				}
			} ); //eo query.find
		} ); //eo doneBtn click

		var updateOrgGroups = function () {
			var setAdminList4OrgGroup = function ( adminIdList, adminJsonList ) {
				var OrganizationGroup = Parse.Object.extend( "OrganizationGroup", {}, {
					query: function () {
						return new Parse.Query( this.className );
					}
				} );

				var query = OrganizationGroup.query();
				query.equalTo( "organizationId", selectedOrgId );
				query.find( {
					success: function ( results ) {
						$.each( results, function ( i, group ) {
							var groupId = group.id;
							var groupType = group.get( "groupType" );
							var name = group.get( "name" );

							group.set( 'adminIdList', adminIdList );
							group.set( 'adminJsonList', adminJsonList );
							group.save();

							$.each( adminIdList, function ( index, adminId ) {
								createRecipientList( groupId, groupType, name, adminId );
							} );
						} );
					},
					error: function ( error ) {
						console.log( 'Error: ' + JSON.stringify( error ) );
					}
				} );
			};

			var Organization = Parse.Object.extend( "Organization", {}, {
				query: function () {
					return new Parse.Query( this.className );
				}
			} );

			var query = Organization.query();
			query.equalTo( "objectId", selectedOrgId );
			query.find( {
				success: function ( results ) {
					$.each( results, function ( i, org ) {
						var adminIdList = org.get( "adminIdList" );
						var adminJsonList = {};

						$.each( adminIdList, function ( index, adminId ) {
							var permission = permissionDataArray[ staffIdArray.indexOf( adminId ) ];
							adminJsonList[ adminId ] = permission === "admin" ? "Admin" : "Faculty";
						} );

						setAdminList4OrgGroup( adminIdList, adminJsonList );
					} );
				},
				error: function ( error ) {
					console.log( 'Error: ' + JSON.stringify( error ) );
				}
			} );
		}

		var addOrganizationAdminIdList = function ( relationId ) {
			var Organization = Parse.Object.extend( "Organization", {}, {
				query: function () {
					return new Parse.Query( this.className );
				}
			} );
			var query = Organization.query();
			query.equalTo( "objectId", selectedOrgId );
			query.find( {
				success: function ( results ) {
					$.each( results, function ( i, org ) {
						org.addUnique( "adminIdList", relationId );
						org.save();
					} );
				},
				error: function ( error ) {
					console.log( 'Error: ' + JSON.stringify( error ) );
				}
			} );
		}; //eo addOrganizationAdminIdList



		var createRecipientList = function ( groupId, groupType, name, relationId ) {
			var recipientList = [];
			var parentIndex = [];
			//Find all students of the selected group
			var UserOrganizationGroupRelation = Parse.Object.extend( "UserOrganizationGroupRelation", {}, {
				query: function () {
					return new Parse.Query( this.className );
				}
			} );
			var query = UserOrganizationGroupRelation.query();
			query.equalTo( "organizationGroupId", groupId );
			query.equalTo( "relationType", "student" );
			query.find( {
				success: function ( results ) {

					//Collect user id of these students
					var studentUserIdArray = [];
					var studentRelation;
					$.each( results, function ( i, studentRelation ) {
						studentUserIdArray.push( studentRelation.get( "userId" ) );
					} );
					//Find parents of these students
					var UserParentRelation = Parse.Object.extend( "UserParentRelation", {}, {
						query: function () {
							return new Parse.Query( this.className );
						}
					} );
					var query = UserParentRelation.query();
					query.containedIn( "childId", studentUserIdArray );
					query.find( {
						success: function ( results ) {
							//Create json object that contains parent-children information
							var relation;
							var json = {};
							$.each( results, function ( i, relation ) {
								if ( parentIndex.indexOf( relation.get( "parentId" ) ) == -1 ) {
									parentIndex.push( relation.get( "parentId" ) );
									json.parent = relation.get( "parentId" );
									json.children = [];
									json.children.push( relation.get( "childId" ) );
									recipientList.push( json );
								} else {
									var index = parentIndex.indexOf( relation.get( "parentId" ) );
									var json = recipientList[ index ];
									if ( json.children.indexOf( relation.get( "childId" ) ) == -1 ) {
										json.children.push( relation.get( "childId" ) );
									}
								}
							} );
							//Check results
							//console.log(recipientList);
							//createUserCustomList(groupId, groupType, name, recipientList, relationId);
							createUserContactEmailList( groupId, groupType, name, recipientList, relationId, parentIndex );
						}, //eo success
						error: function ( error ) {
							spinner.stop();
							console.log( error );
						}

					} ); //eo query.find

				}, //eo success
				error: function ( error ) {
					spinner.stop();
					console.log( error );
				}

			} ); //eo query.find
		}; //eo createRecipientList

		var createUserContactEmailList = function ( groupId, groupType, name, recipientList, relationId, parentIndex ) {
			var userContactEmail = [];
			var query = new Parse.Query( Parse.User );
			query.containedIn( "objectId", parentIndex );
			query.find( {
				success: function ( results ) {
					$.each( results, function ( i, parent ) {
						var parentEmail = parent.get( "email" );
						if ( parent.get( "isEmailDelivery" ) && userContactEmail.indexOf( parent.id ) == -1 ) {
							userContactEmail.push( parentEmail );
						}
					} );
					createUserCustomList( groupId, groupType, name, recipientList, relationId, userContactEmail );
				},
				error: function ( error ) {
					console.log( 'Error: ' + JSON.stringify( error ) );
				}
			} );
		};

		var findOrgGroups = function ( relationId, newPermission ) {
			var OrganizationGroup = Parse.Object.extend( "OrganizationGroup", {}, {
				query: function () {
					return new Parse.Query( this.className );
				}
			} );
			var query = OrganizationGroup.query();
			query.equalTo( "organizationId", selectedOrgId );
			query.find( {
				success: function ( results ) {
					$.each( results, function ( i, group ) {
						var groupId = group.id;
						var groupType = group.get( "groupType" );
						var name = group.get( "name" );
						var position = newPermission == "admin" ? "Admin" : "Faculty";

						console.log( groupId + ':' + groupType + ':' + name + ':' + position );

						if ( newPermission == 'admin' || newPermission == 'faculty' ) {
							group.addUnique( "adminIdList", relationId );
							group.get( "adminJsonList" )[ relationId ] = position;
						} else {
							group.remove( "adminIdList", relationId );
							delete group.get( "adminJsonList" )[ relationId ];
						}

						group.save();
						createRecipientList( groupId, groupType, name, relationId );
					} );
				},
				error: function ( error ) {
					console.log( 'Error: ' + JSON.stringify( error ) );
				}
			} );
		}; //eo findOrgGroups
		var createUserCustomList = function ( groupId, groupType, name, recipientList, relationId, userContactEmail ) {
			var UserCustomList = Parse.Object.extend( "UserCustomList", {}, {
				query: function () {
					return new Parse.Query( this.className );
				}
			} );
			var query = UserCustomList.query();
			query.equalTo( "groupId", groupId );
			query.equalTo( "ownerId", relationId );
			query.find( {
				success: function ( results ) {
					var customList = null;
					if ( results.length > 0 ) {
						return;
					}
					customList = new UserCustomList();
					customList.set( "groupId", groupId );
					customList.set( "groupType", groupType );
					customList.set( "name", name );
					customList.set( "nonUserContactEmail", [] );
					customList.set( "organizationId", selectedOrgId );
					customList.set( "ownerId", relationId );
					customList.set( "recipientList", recipientList );
					customList.set( "type", "OrganizationGroup" );
					customList.set( "userContactId", [] );
					customList.set( "userContactEmail", userContactEmail );
					customList.save();
				},
				error: function ( error ) {
					console.log( 'Error: ' + JSON.stringify( error ) );
				}
			} );
		}; //eo createUserCustomList
	}; //eo initSearch

	var removeOrganizationAdminIdList = function (relationId) {
	    var Organization = Parse.Object.extend("Organization", {}, {
	        query: function () {
	            return new Parse.Query(this.className);
	        }
	    });
	    var query = Organization.query();
	    query.equalTo("objectId", selectedOrgId);
	    query.find({
	        success: function (results) {
	            $.each(results, function (i, org) {
	                org.remove("adminIdList", relationId);
	                org.save();
	            });
	        },
	        error: function (error) {
	            console.log('Error: ' + JSON.stringify(error));
	        }
	    });
	}; //eo removeOrganizationAdminIdList
	var redirect = function () {
		Chaplin.utils.redirectTo( {
			name: 'setting-organizations-detail'
		} );
	};
	var checkPermissons = function () {
		if ( user.isAdmin || user.setting.permissonOfSelectedOrg == "admin" ) {
			$( "#addNewStaffBtn" ).removeClass( "hidden" );
		}
	};
	var initAddButtons = function () {
		$( "#addNewStaffBtn" ).on( 'click', function ( e ) {
			Chaplin.utils.redirectTo( {
				name: 'setting-organizations-detail-staff-add'
			} );
		} );
	}; //eo initAddButtons

	var spinner = null;
	var addedToDOM = function () {
		initData();
		checkPermissons();
		loadOrganizationStaff();
		initSearch();
		initAddButtons();
		$( "#cancelBtn" ).on( 'click', function ( e ) {
			Chaplin.utils.redirectTo( {
				name: 'setting-organizations-detail'
			} );
		} );
	}; //eo addedToDOM

	var View = View.extend( {
		template: Template,
		autoRender: true,
		keepElement: false,
		container: '#main-container',
		id: 'setting-organizations-detail-staff-view',
		className: 'view-container',
		listen: {
			addedToDOM: addedToDOM
		},
		initialize: function ( options ) {
			//Reset footer
			$( "#footer-toolbar > li" ).removeClass( "active" );
			Chaplin.View.prototype.initialize.call( this, arguments );
		}
	} ); //eo View.extend

	return View;
} );
