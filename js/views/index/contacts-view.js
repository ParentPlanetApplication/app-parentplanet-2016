define(
    [
        'chaplin',
        'views/base/view',
        'text!templates/index/contacts-view.hbs',
        'jquery',
        'parseproxy',
        'moment',
        'parse'
    ],
	function ( Chaplin, View, Template, $, ParseProxy, moment, Parse ) {
		'use strict';

		var organizationsList = null; //use thoughout, place in top scope
		var hasContacts = false;
		var loadContacts = function () {
			var children = _getUserChildren();
			var arr = [];
			var OrganizationGroup = Parse.Object.extend(
				"OrganizationGroup", {}, {
					query: function () {
						return new Parse.Query( this.className );
					}
				}
			);
			// var query = new Parse.Query(OrganizationGroup);
			var query = OrganizationGroup.query();

			function getGroups() {
				query.containedIn( "studentIdList", arr );
				query.ascending( "name" );
				query.find( {
					success: function ( results ) {
						function hasGroups() {
							__this.render();
							$( ".content-item.contact" ).click( function ( e ) {
								var index = $( this ).data( 'index' );
								_selectedContact.o = organizationsList[ index ];
								_selectedContact.orgId = $( this ).attr( "id" );
								$( this ).addClass( "bg-highlight-grey" );
								Chaplin.utils.redirectTo( {
									name: 'contacts-groups'
								} );
								// setTimeout(function() {
								//     _setPreviousView();
								//     Chaplin.utils.redirectTo({
								//         name: 'contacts-groups'
								//     });
								// }, DEFAULT_ANIMATION_DELAY);
							} ); //eo click handler
						}; //eo hasGroups
						organizationsList = [];
						$.each( results, function ( i, group ) {
							var attributes = JSON.parse( JSON.stringify( group.attributes ) );
							attributes.i = i;
							organizationsList.push( attributes );
						} );
						organizationsList.length == 0 ? __this.render() : hasGroups();
						//Init touch events
						$( "#createBtn" ).on( 'click', function () {
							_setPreviousView();
							Chaplin.utils.redirectTo( {
								name: 'create'
							} );
						} );
						$( "#settingBtn" ).on( 'click', function () {
							_setPreviousView();
							Chaplin.utils.redirectTo( {
								name: 'setting-home'
							} );
						} );
						$( "#filter" ).on( 'click', function () {
							_setPreviousView();
							Chaplin.utils.redirectTo( {
								name: 'filter'
							} );
						} );
						$( "#search" ).on( 'click', function () {
							_setPreviousView();
							Chaplin.utils.redirectTo( {
								name: 'search'
							} );
						} );
					},
					error: function ( err ) {
							_alert( "Internal Error, Contacts loading groups data:" + err.code + " " + err.message );
							__this.render();
						} //eo error
				} ); //eo query.find
			}; //eo getGroups();
			$.each( children, function ( i, child ) {
				arr.push( child.id );
			} );
			getGroups();
			spinner ? spinner.stop() : $.noop();
		}; //eo loadContacts

		var spinner = null;
		var children = {
			id: [],
			color: []
		};
		var addedToDOM = function () {
			spinner = _createSpinner( 'spinner' );
			children = {
				id: [],
				color: []
			};
			_loadChildrenColors( function () {
				_checkUnreadMessages( Parse );
				_checkUnreadEvent( Parse );
				_checkUnreadHomework( Parse );
				loadContacts();
			}, children );
			// Fix by phuongnh@vinasource.com
			// need set event for element when add element into DOM, don't set when load success
			// _isRedirect ? refreshView() : $.noop();
			refreshView();
			spinner.stop();
		}; //eo addedToDOM
		var dispose = function () {
			_notify( 'refresh' ).unsubscribe( refreshView );
			Chaplin.View.prototype.dispose.call( this, arguments );
		}; //eo dispose
		var refreshView = function () {
			if ( __id !== _currentViewId() ) {
				return;
			}
			_isRedirect = false;
			loadContacts();
		}; //eo refreshView
		var __id = 'contacts-view';
		var __this = null;
		var view = View.extend( {
			template: Template,
			autoRender: true,
			keepElement: false,
			container: '#main-container',
			className: 'view-container',
			id: __id,
			listen: {
				addedToDOM: addedToDOM,
				dispose: dispose
			},
			initialize: function ( options ) {
				__this = this;
				_setCurrentView( _view.CONTACTS_INDEX, __id );
				//Reset footer
				$( "#footer-toolbar > li" ).removeClass( "active" );
				$( "#contacts-tool" ).addClass( "active" );
				_notify( 'refresh' ).subscribe( refreshView );
				Chaplin.View.prototype.initialize.call( this, arguments );
				// refreshView();
			},
			getTemplateData: function () { //this is called before addedToDOM is
				// hasContacts = organizationsList.length > 0;
				// Fix by phuongnh@vinasource.com
				// if not check valid data, it will broken event for header button
				hasContacts = organizationsList != undefined ? organizationsList.length > 0 : false;
				return {
					hasContacts: hasContacts,
					organizations: organizationsList
				}; //send data to template
			}
		} ); //eo View.extend

		return view;
	} );
