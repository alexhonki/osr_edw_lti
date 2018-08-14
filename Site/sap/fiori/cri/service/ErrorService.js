sap.ui.define([
	"sap/m/MessageBox"
], function(MessageBox) {
	"use strict";
	return {
		raiseGenericError: function(oError) {
			if (oError && oError.statusCode == 401) {
				MessageBox.error("Your session has timed out! Please Re-login again");
			} else {

				MessageBox.error("Something went wrong");
			}

			jQuery.sap.log.error(oError);
		}
	};
});