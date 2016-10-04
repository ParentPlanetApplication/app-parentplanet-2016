define([
    'jquery' 
], function($) {
    'use strict';

    function EventService() {
        var service = {
            getUpdateStrategy: function (localEvent, serverEvent, selectedUpdateOption) {
                if (serverEvent.get('isModifySingleEvent')) {
                    return UpdateStrategy.RepeatInstanceUpdated;
                }

                if (!_isRepeat(localEvent.repeat) && !_isRepeat(serverEvent.get('repeat'))) {
                    return UpdateStrategy.SingleUpdated;
                }

                if (_isRepeat(localEvent.repeat) && !_isRepeat(serverEvent.get('repeat'))) {
                    return UpdateStrategy.SingleToRepeat;
                }

                if (_isRepeat(serverEvent.get('repeat'))) {
                    if (!_isRepeat(localEvent.repeat)) {
                        return UpdateStrategy.RepeatToSingle;
                    }

                    if (selectedUpdateOption === UpdateOption.AllFutureEvents) {
                        return UpdateStrategy.RepeatUpdated;
                    } else {
                        return UpdateStrategy.RepeatInstanceUpdated;
                    }
                }

                throw Error("Can't find update event strategy");
            },

            updateEvent: function(localEvent, serverEvent, selectedUpdateOption) {
                return this.getUpdateEventStrategy(
                    localEvent, serverEvent, selectedUpdateOption,
                    this.getUpdateStrategy(localEvent, serverEvent, selectedUpdateOption)).updateEvent();
            },

            getUpdateEventStrategy: function (localEvent, serverEvent, selectedUpdateOption, selectedStrategy) {
                switch (selectedStrategy) {
                    case UpdateStrategy.SingleToRepeat:
                        return new EventSingleToRepeatStrategy(localEvent, serverEvent, selectedUpdateOption);
                    case UpdateStrategy.SingleUpdated:
                        return new EventSingleUpdatedStrategy(localEvent, serverEvent, selectedUpdateOption);
                    case UpdateStrategy.RepeatToSingle:
                        return new EventRepeatToSingleStrategy(localEvent, serverEvent, selectedUpdateOption);
                    case UpdateStrategy.RepeatUpdated:
                        return new EventRepeatUpdatedStrategy(localEvent, serverEvent, selectedUpdateOption);
                    case UpdateStrategy.RepeatInstanceUpdated:
                        return new EventRepeatInstanceUpdatedStrategy(localEvent, serverEvent, selectedUpdateOption);
                    default:
                        throw new Error("Specified Strategy is not supported: " + selectedStrategy);
                }
            }
        };

        return service;
    }; //eo Spinner
    //return the ParseProxy constructor :)
    return EventService();
});
