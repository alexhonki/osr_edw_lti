sap.ui.define([
	"sap/m/MessageBox"
], function(MessageBox) {
	"use strict";
	return {
		raiseGenericError: function(oError) {
			if (oError && oError.statusCode == 401) {
				MessageBox.error(oError.message + " : " + oError.statusText);
			} else {

				MessageBox.error("Something went wrong");
			}

			jQuery.sap.log.error(oError);
		}
	};
});