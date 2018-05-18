sap.ui.define([
    "sap/m/MessageBox"
], function (MessageBox) {
    "use strict";
    return {
        raiseGenericError: function (oError) {
            MessageBox.error("Something went wrong");
            jQuery.sap.log.error(oError);
        }
    };
});