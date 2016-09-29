define([
  'chaplin',
  'views/base/view',
  'text!templates/event-navbar-view.hbs'
], function(Chaplin, View, template) {
  'use strict';
  var args = arguments; //local arguments array for Chanat's multiple templates; template = args[2]
  var EventNavbarView = View.extend({
    container: '#header-container', //this is the element (selector) that contains this list (#calendargrid-wrapper)
    autoRender: true,
    tagName: 'header',
    className: 'navbar row',
    template: template,
    back: function() {
      Chaplin.utils.redirectTo({url:'home'});
    }
  });

  EventNavbarView.prototype.initialize = function(o) {
   // _.extend(this, o);
    this.delegate('click', '.icon-left-open-big', this.back);
  }

  EventNavbarView.prototype.getTemplateData = function() {
    return this.model.toJSON();
  }

  return EventNavbarView; //return the View to the containing view or controller
});