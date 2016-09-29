define( function () {
	'use strict';

	// The routes for the application. This module returns a function.
	// `match` is match method of the Router
	return function ( match ) {
		match( '', 'home#show', {
			name: 'home'
		} );
		match( 'signin', 'user#signin', {
			name: 'signin'
		} );
		// match('', 'user#signin', {    name: 'user'    });
		match( 'signup', 'user#signup', {
			name: 'signup'
		} );
		match( 'signup-if-match', 'user#signup-if-match', {
			name: 'signup-if-match'
		} );
		match( 'signup-enter-user-info', 'user#signup-enter-user-info', {
			name: 'signup-enter-user-info'
		} );
		match( 'signup-enter-kid-info', 'user#signup-enter-kid-info', {
			name: 'signup-enter-kid-info'
		} );
		match( 'signup-children-activity', 'user#children-activity', {
			name: 'children-activity'
		} );
		match( 'after-register', 'user#after-register', {
			name: 'after-register'
		} );
		match( 'home', 'home#show', {
			name: 'home'
		} );
		match( 'filter', 'home#filter', {
			name: 'filter'
		} );
		match( 'search', 'home#search', {
			name: 'search'
		} );
		match( 'create', 'create#index', {
			name: 'create'
		} );
		match( 'create-event', 'create#create-event', {
			name: 'create-event'
		} );
		match( 'create-message', 'create#create-message', {
			name: 'create-message'
		} );
		match( 'create-homework', 'create#create-homework', {
			name: 'create-homework'
		} );
		match( 'create-sendto', 'create#create-sendto', {
			name: 'create-sendto'
		} );
		match( 'custom-list', 'create#custom-list', {
			name: 'custom-list'
		} );
		match( 'custom-list-org', 'create#custom-list-org', {
			name: 'custom-list-org'
		} );
		match( 'custom-list-mygroups', 'create#custom-list-mygroups', {
			name: 'custom-list-mygroups'
		} );
		/*match('custom-list-groups', 'create#custom-list-groups', {
		    name: 'custom-list-groups'
		});*/
		match( 'show-group-info', 'create#show-group-info', {
			name: 'show-group-info'
		} );
		match( 'create-edit', 'create#edit', {
			name: 'create-edit'
		} );
		match( 'update-event', 'create#update-event', {
			name: 'update-event'
		} );
		match( 'update-homework', 'create#update-homework', {
			name: 'update-homework'
		} );
		//sxm edit capabilities
		match( 'edit-event', 'edit#edit-event', {
			name: 'edit-event'
		} );
		match( 'edit-homework', 'edit#edit-homework', {
			name: 'edit-homework'
		} );
		match( 'message', 'message#show', {
			name: 'message'
		} );
		match( 'read-message', 'message#read', {
			name: 'read-message'
		} );
		match( 'calendar', 'home#calendar', {
			name: 'calendar'
		} );
		match( 'read-calendar', 'calendar#read', {
			name: 'read-calendar'
		} );
		match( 'homework', 'homework#show', {
			name: 'homework'
		} );
		match( 'read-homework', 'homework#read', {
			name: 'read-homework'
		} );
		match( 'contacts', 'home#contacts', {
			name: 'contacts'
		} );
		match( 'contacts-groups', 'home#contactsgroup', {
			name: 'contacts-groups'
		} );
		match( 'contacts-groups-detail', 'contacts#groups-detail', {
			name: 'contacts-groups-detail'
		} );
		match( 'privacy', 'setting#privacy', {
			name: 'privacy'
		} );
		match( 'tos', 'setting#tos', {
			name: 'tos'
		} );
		match( 'setting-home', 'setting#home', {
			name: 'setting-home'
		} );
		match( 'setting-user-home', 'setting#user-home', {
			name: 'setting-user-home'
		} );
		match( 'setting-user-contactpermissions', 'setting#user-contactpermissions', {
			name: 'setting-user-contactpermissions'
		} );
		match( 'setting-user-default-list', 'setting#user-default-list', {
			name: 'setting-user-default-list'
		} );
		match( 'setting-user-access-home', 'setting#user-access-home', {
			name: 'setting-user-access-home'
		} );
		match( 'setting-user-access-detail', 'setting#user-access-detail', {
			name: 'setting-user-access-detail'
		} );
		match( 'setting-user-access-add', 'setting#user-access-add', {
			name: 'setting-user-access-add'
		} );
		match( 'setting-user-activities-home', 'setting#user-activities-home', {
			name: 'setting-user-activities-home'
		} );
		match( 'setting-user-activities-list', 'setting#user-activities-list', {
			name: 'setting-user-activities-list'
		} );
		match( 'setting-user-activities-detail', 'setting#user-activities-detail', {
			name: 'setting-user-activities-detail'
		} );
		match( 'setting-user-activities-detail-contactpermissions', 'setting#user-activities-detail-contactpermissions', {
			name: 'setting-user-activities-detail-contactpermissions'
		} );
		match( 'setting-user-kids-home', 'setting#user-kids-home', {
			name: 'setting-user-kids-home'
		} );
		match( 'setting-user-kids-detail', 'setting#user-kids-detail', {
			name: 'setting-user-kids-detail'
		} );
		match( 'setting-user-kids-addnew', 'setting#user-kids-addnew', {
			name: 'setting-user-kids-addnew'
		} );
		match( 'setting-add-new-activity-home', 'setting#add-new-activity-home', {
			name: 'setting-add-new-activity-home'
		} );
		match( 'setting-add-new-activity-qrcode-home', 'setting#add-new-activity-qrcode-home', {
			name: 'setting-add-new-activity-qrcode-home'
		} );
		match( 'setting-add-new-activity-qrcode-scan', 'setting#add-new-activity-qrcode-scan', {
			name: 'setting-add-new-activity-qrcode-scan'
		} );
		match( 'setting-add-new-activity-qrcode-detail', 'setting#add-new-activity-qrcode-detail', {
			name: 'setting-add-new-activity-qrcode-detail'
		} ); //K13
		match( 'setting-add-new-activity-entercode', 'setting#add-new-activity-entercode', {
			name: 'setting-add-new-activity-entercode'
		} );
		match( 'setting-add-new-activity-done', 'setting#add-new-activity-done', {
			name: 'setting-add-new-activity-done'
		} );
		match( 'setting-user-contact-info', 'setting#user-contact-info', {
			name: 'setting-user-contact-info'
		} );

		match( 'setting-organizations-add', 'setting#organizations-add', {
			name: 'setting-organizations-add'
		} ); //I1
		match( 'setting-organizations-home', 'setting#organizations-home', {
			name: 'setting-organizations-home'
		} ); //M1
		match( 'setting-organizations-detail', 'setting#organizations-detail', {
			name: 'setting-organizations-detail'
		} ); //M2
		match( 'setting-organizations-groups-list', 'setting#organizations-groups-list', {
			name: 'setting-organizations-groups-list'
		} ); //M3
		match( 'setting-organizations-groups-add', 'setting#organizations-groups-add', {
			name: 'setting-organizations-groups-add'
		} ); //I2.1
		match( 'setting-organizations-groups-detail', 'setting#organizations-groups-detail', {
			name: 'setting-organizations-groups-detail'
		} ); //M4
		match( 'setting-organizations-groups-detail-edit', 'setting#organizations-groups-detail-edit', {
			name: 'setting-organizations-groups-detail-edit'
		} ); //M5
		match( 'setting-organizations-groups-detail-students', 'setting#organizations-groups-detail-students', {
			name: 'setting-organizations-groups-detail-students'
		} ); //M6
		match( 'setting-organizations-groups-detail-students-add', 'setting#organizations-groups-detail-students-add', {
			name: 'setting-organizations-groups-detail-students-add'
		} ); //M7
		match( 'setting-organizations-groups-detail-students-add-byid', 'setting#organizations-groups-detail-students-add-byid', {
			name: 'setting-organizations-groups-detail-students-add-byid'
		} );
		// match('setting-organizations-groups-detail-students-add-byname', 'setting#organizations-groups-detail-students-add-byname', {
		//     name: 'setting-organizations-groups-detail-students-add-byname'
		// });
		match( 'setting-organizations-groups-detail-students-add-bynameemail', 'setting#organizations-groups-detail-students-add-bynameemail', {
			name: 'setting-organizations-groups-detail-students-add-bynameemail'
		} );
		match( 'setting-organizations-groups-detail-students-add-bynamemobile', 'setting#organizations-groups-detail-students-add-bynamemobile', {
			name: 'setting-organizations-groups-detail-students-add-bynamemobile'
		} );
		match( 'setting-organizations-groups-detail-students-add-organization', 'setting#organizations-groups-detail-students-add-organization', {
			name: 'setting-organizations-groups-detail-students-add-organization'
		} ); //M8
		match( 'setting-organizations-groups-detail-students-add-organization-individual', 'setting#organizations-groups-detail-students-add-organization-individual', {
			name: 'setting-organizations-groups-detail-students-add-organization-individual'
		} ); //M9
		match( 'setting-organizations-groups-detail-qrcode', 'setting#organizations-groups-detail-qrcode', {
			name: 'setting-organizations-groups-detail-qrcode'
		} ); //M10
		match( 'setting-organizations-groups-detail-groupadmin', 'setting#organizations-groups-detail-groupadmin', {
			name: 'setting-organizations-groups-detail-groupadmin'
		} ); //M11
		match( 'setting-organizations-groups-detail-groupadmin-add', 'setting#organizations-groups-detail-groupadmin-add', {
			name: 'setting-organizations-groups-detail-groupadmin-add'
		} ); //M12
		match( 'setting-organizations-groups-detail-groupadmin-add-fromorg', 'setting#organizations-groups-detail-groupadmin-add-fromorg', {
			name: 'setting-organizations-groups-detail-groupadmin-add-fromorg'
		} ); //M13
		match( 'setting-organizations-detail-qrcode', 'setting#organizations-detail-qrcode', {
			name: 'setting-organizations-detail-qrcode'
		} ); //M14
		match( 'setting-organizations-detail-edit', 'setting#organizations-detail-edit', {
			name: 'setting-organizations-detail-edit'
		} ); //M15
		match( 'setting-organizations-detail-staff', 'setting#organizations-detail-staff', {
			name: 'setting-organizations-detail-staff'
		} ); //M16
		match( 'setting-organizations-detail-staff-add', 'setting#organizations-detail-staff-add', {
			name: 'setting-organizations-detail-staff-add'
		} ); //M16
		match( 'setting-organizations-detail-staff-add-byid', 'setting#organizations-detail-staff-add-byid', {
			name: 'setting-organizations-detail-staff-add-byid'
		} ); //M16
		match( 'setting-organizations-detail-staff-add-byemail', 'setting#organizations-detail-staff-add-byemail', {
			name: 'setting-organizations-detail-staff-add-byemail'
		} ); //M16
		match( 'setting-organizations-detail-students', 'setting#organizations-detail-students', {
			name: 'setting-organizations-detail-students'
		} );
		match( 'setting-organizations-detail-students-add', 'setting#organizations-detail-students-add', {
			name: 'setting-organizations-detail-students-add'
		} );
		match( 'setting-organizations-detail-students-add-byid', 'setting#organizations-detail-students-add-byid', {
			name: 'setting-organizations-detail-students-add-byid'
		} );
		match( 'setting-organizations-detail-students-add-byemail', 'setting#organizations-detail-students-add-byemail', {
			name: 'setting-organizations-detail-students-add-byemail'
		} );
		match( 'setting-organizations-detail-students-add-byname', 'setting#organizations-detail-students-add-byname', {
			name: 'setting-organizations-detail-students-add-byname'
		} );
		match( 'setting-organizations-detail-students-add-bynameemail', 'setting#organizations-detail-students-add-bynameemail', {
			name: 'setting-organizations-detail-students-add-bynameemail'
		} );
		match( 'setting-organizations-detail-students-add-bynamemobile', 'setting#organizations-detail-students-add-bynamemobile', {
			name: 'setting-organizations-detail-students-add-bynamemobile'
		} );
		/* My Group Settings */
		match( 'setting-mygroups', 'setting#mygroups', {
			name: 'setting-mygroups'
		} );
		match( 'setting-mygroups-add', 'setting#mygroups-add', {
			name: 'setting-mygroups-add'
		} );
		match( 'setting-mygroups-edit', 'setting#mygroups-edit', {
			name: 'setting-mygroups-edit'
		} );
		match( 'setting-mygroups-detail', 'setting#mygroups-detail', {
			name: 'setting-mygroups-detail'
		} );
		match( 'setting-mygroups-detail-contacts', 'setting#mygroups-detail-contacts', {
			name: 'setting-mygroups-detail-contacts'
		} );
		match( 'setting-mygroups-detail-contacts-add', 'setting#mygroups-detail-contacts-add', {
			name: 'setting-mygroups-detail-contacts-add'
		} );
		match( 'setting-mygroups-detail-contacts-add-byemail', 'setting#mygroups-detail-contacts-add-byemail', {
			name: 'setting-mygroups-detail-contacts-add-byemail'
		} );
		match( 'setting-mygroups-detail-contacts-add-mobilephone', 'setting#mygroups-detail-contacts-add-mobilephone', {
			name: 'setting-mygroups-detail-contacts-add-mobilephone'
		} );
		match( 'setting-mygroups-detail-contacts-add-byid', 'setting#mygroups-detail-contacts-add-byid', {
			name: 'setting-mygroups-detail-contacts-add-byid'
		} );
		match( 'setting-mygroups-detail-groupadmin', 'setting#mygroups-detail-groupadmin', {
			name: 'setting-mygroups-detail-groupadmin'
		} );
	};
} );
