define( [
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-organizations-groups-add-view.hbs',
    'jquery',
    'spinner',
    'parse'
], function ( Chaplin, View, Template, $, spinner, Parse ) {
	'use strict';
	var user;
	var selectedOrgId;
	var selectedOrgData;
	var group;
	var position;
	var name;
	var userId = null;
	var subGroupOfId = '' //Can be none
	var dropdown;

	var initData = function () {
		user = JSON.parse( localStorage.getItem( "user" ) );
		selectedOrgId = user.setting.selectedOrgId;
		selectedOrgData = user.setting.selectedOrgData;
	}; //eo initData

	var initButtons = function () {
		$( "#cancelBtn" ).on( 'click', function ( e ) {
			Chaplin.utils.redirectTo( {
				name: 'setting-organizations-groups-list'
			} );
		} );
	}; //eo initButtons

	var initForms = function () {
		spinner.show();
		//Load groups for sub-group form
		var OrganizationGroup = Parse.Object.extend( "OrganizationGroup", {}, {
			query: function () {
				return new Parse.Query( this.className );
			}
		} );
		var query = OrganizationGroup.query();
		query.equalTo( "organizationId", selectedOrgId );
		query.ascending( "name" );
		query.find( {
			success: function ( results ) {
				if ( results.length == 0 ) {} else {
					for ( var i = 0; i < results.length; i++ ) {
						var orgGroup = results[ i ];
						$( "#subGroupSelector" ).append( '<li class="subGroupLi" value="' + orgGroup.id + '"><a href="#">' + orgGroup.get( "name" ) + '</a></li>' );
					}
				}
				$( "#content" ).removeClass( "hidden" );
				new DropDown( $( '#dd2' ) );
				spinner.hide();
			},
			error: function ( error ) {
				console.log( error );
				$( "#content" ).removeClass( "hidden" );
				$( "#subGroupWrapper" ).addClass( "hidden" );
				_confirm( "There was an error loading sub-groups from the server, please try again" );
				spinner.hide();
			}
		} );
	}; //eo initForms

	var initDoneBtn = function () {
		$( "#doneBtn" ).on( "click", function ( e ) {
			spinner.show();
			checkUserOrgRelation();
		} );
	}; //eo initDoneBtn

	var checkUserOrgRelation = function () {
		name = $( "#groupName" ).val();
		var UserOrganizationRelation = Parse.Object.extend( "UserOrganizationRelation", {}, {
			query: function () {
				return new Parse.Query( this.className );
			}
		} );
		var query = UserOrganizationRelation.query();
		query.equalTo( "organizationId", selectedOrgId );
		query.equalTo( "userId", user.id );
		query.equalTo( "relation", "staff" );
		query.find( {
			success: function ( results ) {
				if ( results.length == 0 ) {
					//Meaning that the creator is P2 admin, we do not add this user as admin of the group
					createGroup( null, null );
					spinner.hide();
					redirect();
				} else {
					var orgRelation = results[ 0 ];
					position = orgRelation.get( "position" );
					var userId = user.id;
					createGroup( position, userId );
				}
			},
			error: function ( error ) {
				spinner.hide();
				_confirm( "Error, could not create a new group!" );
			}
		} ); //eo query.find
	}; //eo checkUserOrgRelation

	var createGroup = function ( position, userId ) {
		var label = $( "#groupType" ).text(); //Group Type
		var desc = $( "#groupDesc" ).val(); //Can be null
		if ( name == "" ) {
			spinner.hide();
			_confirm( "Please enter name" );
		} else {
			spinner.show();
			if ( subGroupOfId == "none" ) {
				subGroupOfId = "";
			}
			//Create organization groups
			var OrganizationGroup = Parse.Object.extend( "OrganizationGroup" );
			group = new OrganizationGroup();
			group.set( "organizationId", selectedOrgId );
			group.set( "name", name );
			group.set( "adminIdList", [] );
			group.set( "adminJsonList", {} );
			group.set( "description", desc );
			group.set( "groupType", dropdown.val ); //This is confusing, either label or groupType should be used, but not both of them //Chanat
			group.set( "label", label );
			group.set( "studentIdList", [] );
			group.set( "subGroupOf", subGroupOfId );
			group.save( null, {
				success: function ( group ) {
					/*
					  Edit by phuongnh@vinasource.com
					  Build sub function to update adminJsonList
					*/
					var updateAdminGroup = function ( userAdminID ) {
						var adminJson = group.get( "adminJsonList" );
						adminJson[ userAdminID ] = position;

						group.addUnique( "adminIdList", userAdminID );
						group.save();
					}

					var UserCustomList = Parse.Object.extend( "UserCustomList" );
					for ( var i = 0; i < selectedOrgData.adminIdList.length; i++ ) { //add custom lists for org admins
						var orgAdminCustomList = new UserCustomList();
						orgAdminCustomList.set( "type", "OrganizationGroup" );
						orgAdminCustomList.set( "organizationId", selectedOrgId );
						orgAdminCustomList.set( "groupId", group.id );
						orgAdminCustomList.set( "groupType", group.get( "groupType" ) );
						orgAdminCustomList.set( "name", name );
						orgAdminCustomList.set( "ownerId", selectedOrgData.adminIdList[ i ] );
						orgAdminCustomList.set( "nonUserContactEmail", [] ); //Only use for custom list created from my groups
						orgAdminCustomList.set( "userContactId", [] ); //Only use for custom list created from my groups
						orgAdminCustomList.set( "userContactEmail", [] );
						orgAdminCustomList.set( "recipientList", [] );
						orgAdminCustomList.save();

						/*
						  Add by phuongnh@vinasource.com
						  Will update adminJsonList with user info from adminIdList
						*/
						updateAdminGroup( selectedOrgData.adminIdList[ i ] );
					}
					// Execute any logic that should take place after the object is saved.
					//alert('New object created with objectId: ' + relation.id);
					group.set( "adminIdList", selectedOrgData.adminIdList );

					if ( userId ) {
						/*
						  Remove by phuongnh@vinasource.com
						  We don't need re-update adminJsonList while uddated from list adminIdList
						  var adminJson = group.get("adminJsonList");
						  adminJson[userId] = position;
						  group.addUnique("adminIdList", userId);
						  group.save();
						*/
						if ( selectedOrgData.adminIdList.indexOf( userId ) == -1 ) {
							createCustomList( group );
						}

						addAdmin( group, name );
					}

					user.setting.selectedOrgGroupId = group.id;
					user.setting.selectedOrgGroupData = group;
					localStorage.setItem( "user", JSON.stringify( user ) );
					spinner.hide();
				},
				error: function ( group, error ) {
					// Execute any logic that should take place if the save fails.
					// error is a Parse.Error with an error code and message.
					//alert('Failed to add child to organization: ' + error.message);
					spinner.hide();
					_alert( "Error, could not create group" );
				}
			} ); //eo group.save
		} //eo else
	}; //eo createGroup

	var createCustomList = function ( group ) {
		var UserCustomList = Parse.Object.extend( "UserCustomList" );
		var customList = new UserCustomList();
		customList.set( "type", "OrganizationGroup" );
		customList.set( "organizationId", selectedOrgId );
		customList.set( "groupId", group.id );
		customList.set( "groupType", group.get( "groupType" ) );
		customList.set( "name", name );
		customList.set( "ownerId", user.id );
		customList.set( "nonUserContactEmail", [] ); //Only use for custom list created from my groups
		customList.set( "userContactId", [] ); //Only use for custom list created from my groups
		customList.set( "userContactEmail", [] );
		customList.set( "recipientList", [] );
		customList.save( null, {
			success: function ( customList ) {
				// Execute any logic that should take place after the object is saved.
				//alert('New object created with objectId: ' + relation.id);
				/*if (user.setting == null) {
				    user.setting = {};
				}
				user.setting.selectedMyGroupId = group.id;
				user.setting.selectedMyGroupData = group;
				localStorage.setItem("user", JSON.stringify(user));*/
			},
			error: function ( customList, error ) {
					// Execute any logic that should take place if the save fails.
					// error is a Parse.Error with an error code and message.
					//alert('Failed to add child to organization: ' + error.message);
					_alert( "Error, could not create new custom list" );
					spinner.hide();
				} //eo error
		} ); //eo customList.save
	}; //eo createCustomList

	var addAdmin = function ( group, name ) {
		//Add staff to the selected group
		var UserOrganizationGroupRelation = Parse.Object.extend( "UserOrganizationGroupRelation" );
		var relation = new UserOrganizationGroupRelation();
		var groupId = group.id;
		var groupName = name;
		relation.set( "organizationGroupId", groupId );
		relation.set( "userId", user.id );
		relation.set( "relationType", "staff" );
		relation.set( "position", position );
		relation.set( "groupName", groupName );
		relation.set( "calendarAutoSync", false );
		relation.set( "alert", true );
		relation.set( "showParentFirstName", true );
		relation.set( "showParentLastName", true );
		relation.set( "showChildFirstName", true );
		relation.set( "showChildLastName", true );
		relation.set( "showEmail", true );
		relation.set( "showHomePhone", true );
		relation.set( "showMobilePhone", true );
		relation.set( "showWorkPhone", true );
		relation.set( "showAddress", true );
		relation.set( "firstName", user.firstName );
		relation.set( "lastName", user.lastName );

		relation.save( null, {
			success: function ( relation ) {
				spinner.hide();
				redirect();
			},
			error: function ( relation, error ) {
				// Execute any logic that should take place if the save fails.
				// error is a Parse.Error with an error code and message.
				console.log( 'Failed to create new object, with error code: ' + error.message );
				spinner.hide();
			}
		} ); //eo relation.save
	}; //eo addAdmin

	var redirect = function () {
		Chaplin.utils.redirectTo( {
			name: 'setting-organizations-groups-list'
		} );
	}; //eo redirect

	// http://tympanus.net/codrops/2012/10/04/custom-drop-down-list-styling/
	// EXAMPLE 3
	function DropDown( el ) {
		this.dd = el;
		this.placeholder = this.dd.children( 'span' );
		this.opts = this.dd.find( 'ul.dropdown > li' );
		this.val = '';
		this.index = -1;
		this.initEvents();
	}
	DropDown.prototype = {
		initEvents: function () {
			var obj = this;

			obj.dd.on( 'click', function ( event ) {
				$( this ).toggleClass( 'active' );
				return false;
			} );

			obj.opts.on( 'click', function () {
				var opt = $( this );
				obj.val = opt.text();
				obj.index = opt.index();
				obj.placeholder.text( obj.val );
				subGroupOfId = opt.attr( 'value' ) ? opt.attr( 'value' ) : subGroupOfId; //check if setting subGroup and not label type
			} );
		},
		getValue: function () {
			return this.val;
		},
		getIndex: function () {
			return this.index;
		}
	}

	var addedToDOM = function () {
		initData();
		initButtons();
		initForms();
		initDoneBtn();
		$( "#groupDesc" ).focus( function ( e ) {
			$( ".innerview-container" ).scrollTop( $( ".info-wrapper" ).height() );
		} ); //eo #desc .focus
		dropdown = new DropDown( $( '#dd' ) );
	}; //eo addedToDOM

	var View = View.extend( {
		template: Template,
		autoRender: true,
		keepElement: false,
		container: '#main-container',
		id: 'setting-organizations-groups-add-view',
		className: 'view-container',
		listen: {
			addedToDOM: addedToDOM
		},
		initialize: function ( options ) {
			//Reset footer
			$( "#footer-toolbar > li" ).removeClass( "active" );
			Chaplin.View.prototype.initialize.call( this, arguments );
		},
		getTemplateData: function () {
			return {
				religious: _religious
			};
		}
	} ); //eo View.extend

	return View;
} );
