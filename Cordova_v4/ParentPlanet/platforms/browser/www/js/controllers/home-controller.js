define( [
    'controllers/base/controller',
    'models/home',
    'views/index/home-view',
    'views/index/filter-view',
    'views/index/search-view',
    'views/index/calendar-view',
    'views/index/contacts-view',
    'views/index/contacts-groups-view',
    'views/user/signin-view'
], function ( Controller, HomeModel, HomeView, FilterView, SearchView, CalendarView, ContactsView, ContactsGroupsView, SignInView ) {
	'use strict';
	var isSignedIn;

	var HomeController = Controller.extend( {
    /*
    * Add by phuongnh@vinasource.com
    * Need check status login before call home controller
    */
		beforeAction: function () {
			// Create a new Cars collection or preserve the existing.
			// This prevents the Cars collection from being disposed
			// in order to share it between controller actions.
			Controller.prototype.beforeAction(); //if we dont put this line here, there will be an error thrown
			console.log( 'beforeAction' );
			isSignedIn = _getSignedIn();
			console.log( isSignedIn );
		},

		show: function ( params ) {
			this.model = new HomeModel();
      if ( isSignedIn ) {
				this.view = new HomeView( {
					model: this.model,
					region: 'main'
				} );
			} else {
				this.view = new SignInView( {
					model: this.model,
					region: 'inner'
				} );
			}
		},
		filter: function ( params ) {
			this.model = new HomeModel();
			this.view = new FilterView( {
				model: this.model,
				region: 'main'
			} );
		},
		search: function ( params ) {
			this.model = new HomeModel();
			this.view = new SearchView( {
				model: this.model,
				region: 'main'
			} );
		},
		calendar: function ( params ) {
			this.model = new HomeModel();
			this.view = new CalendarView( {
				model: this.model,
				region: 'main'
			} );
		},
		contacts: function ( params ) {
			this.model = new HomeModel();
			this.view = new ContactsView( {
				model: this.model,
				region: 'main'
			} );
		},
		contactsgroup: function ( params ) {
			this.model = new HomeModel();
			this.view = new ContactsGroupsView( {
				model: this.model,
				region: 'main'
			} );
		}


	} );

	return HomeController;
} );
