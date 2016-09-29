define([
  'controllers/base/controller',
  'models/site',
  'views/site-view'
], function(Controller, Site, SiteView) {
  'use strict';

  var SiteController = Controller.extend({
    show: function(params) {
      this.model = new Site();
      this.view = new SiteView({
        model: this.model,
        region: 'main-container'
      });
    },
    sidebarPanel: function(params) {
      console.log('controller sidebarPanel', this);
    }
  });

  return SiteController;
});
