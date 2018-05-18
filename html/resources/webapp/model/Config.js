sap.ui.define([],
    function () {
        'use strict';
        var  responderOn = jQuery.sap.getUriParameters().get("responderOn");
        /**
         * @class
         * @public
         * @name sap.fiori.cri.model.Config
         */
        var Config = {
            serviceUrl: "/destinations/CRI/",
            useMock: responderOn
        };

        return Config;
    }
);