define([
  'views/base/collection-view',
  'views/event-item-view',
  'text!templates/events-view.hbs'
], function(CollectionView, EventItemView, template) {
  'use strict';

  //Chaplin CollectionView does 99% of the work of handling the display/layout of a collection (array of models)
  //see: http://www.cremalab.com/blog/8-working-with-chaplin-js-part-1-inheritance-and-views
  //Basically, you tell it what id/className etc. to use for the div/tag wrapper that will be AUTOMATICALLY injected
  //into the DOM on instantiation (backbone). Then you tell it the container (selector) for the new element to be appended to
  //You give it a template for the new element and tell it which 'itemview' to use for each item in the associated (bound)
  //collection. Here the collection is bound at the level of the controller, after it has been fetched; so you do not see it here
  //the eventsview.hbs template contains an element (#calendargrid) which is the 'list' for the data being displayed
  //AFTER DATA IS BOUND THE: CollectionView will proceed as follows:
  // 1) loop over each item in the collection
  // 2) Create a new itemView = EventItemView for each item
  // 3) Bind the item to the new itemView model
  // 3a) In turn the new itemView will call up its bound template (event-item-view.hbs) and pass its model (event.js) data to it
  // 3b) The new itemView (event-item-view.js) wraps all the interaction within itself
  // 4) Append the new itemView to the listSelector element
  //
  // NOTE: The design here is to bind functionality as close to the object that uses that functionality
  // In other words clicking/tapping events on an event-item-view is handled by that view

  var EventsView = CollectionView.extend({
    container: '#homebottom', //this is the element (selector) that contains this list (#calendargrid-wrapper)
    id: 'calendargrid-wrapper', //the id for the EventsView 'wrapper' div that will be appended to the 'container'
    template: template, //how to construct the EventsView DOM element
    listSelector: '#calendargrid', //OK template has been created and injected into the container, now where do we append each of the items, here
    itemView: EventItemView, //what view to use for each item that is created from the collection
    animationDuration: 0 //evidently we can have a loader shown here that goes away when the data is fetched
  });

  return EventsView; //return the View to the containing view or controller
});