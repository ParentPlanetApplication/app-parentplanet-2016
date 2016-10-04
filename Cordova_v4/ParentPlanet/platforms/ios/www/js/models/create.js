define([
    'chaplin',
    'models/base/model'
], function(Chaplin, Model) {
    'use strict';

    var User = Model.extend({
        defaults: {

            "index": {
                viewTitle: "Create New...",
                cancel: "Cancel",
                event: "Schedule Event",
                message: "Message",
                homework: "Homework"
            },

            "event": {
                viewTitle: "New Event",
                cancel: "Cancel",
                done: "Done",
                isMobile: true,
                sendTo: "Send to",
                title: "Title",
                location: "Location",
                allDay: "All-day",
                start: "Start",
                end: "End",
                repeat: "Repeat",
                until: "Until",
                reminder: "Reminder",
                reminder2: "Second Reminder",
                message: "Notes/Message",

                placeholder: {
                    title: "Type here",
                    location: "Type here",
                    start: "Pick a date and time here",
                    end: "Pick a date and time here",
                    repeat: "Never",
                    until: "1 year from today",
                    reminder: "Never",
                    reminder2: "Never"
                }
            },

            "message": {
                viewTitle: "New Message",
                cancel: "Cancel",
                done: "Done",
                isMobile: true,
                sendTo: "Send to",
                placeholder: {
                    title: "Title/Subject",
                    message: "Message"
                }
            },

            "homework": {
                viewTitle: "New Homework",
                cancel: "Cancel",
                done: "Done",
                isMobile: true,
                sendTo: "Send to",
                title: "Title",
                type: "Type",
                assigned: "Assigned",
                due: "Due",
                repeat: "Repeat",
                reminder: "Reminder",
                message: "Notes/Message",

                placeholder: {
                    title: "Title here...",
                    typeDaily: "Daily",
                    typeProject: "Test/Project",
                    assigned: "Input here...",
                    due: "Input here...",
                    repeat: "Input here...",
                    reminder: "Input here..."
                },
                demo: {
                    assigned: "Today",
                    due: "Tomorrow 9am",
                    repeat: "Never",
                    reminder: "1 hour before"
                }
            }
        }

    });

    return User;
});
