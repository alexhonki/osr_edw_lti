sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/fiori/cri/service/DynamicLabel"
],
    /**
     * Base Controller
     * @param {sap.ui.core.mvc.Controller} Controller Controller
     * @param {sap.ui.model.json.JSONModel} JSONModel JSONModel
     * @param {sap.fiori.cri.service.DynamicLabel} DynamicLabel DynamicLabel
     * @returns {*} Base Controller
     */
    function (Controller, JSONModel, DynamicLabel) {
    "use strict";
    return Controller.extend("sap.fiori.cri.controller.BaseController", {
        loadLabels: function (page, language, fnCallback) {
            var criModel = this.getView().getModel("CRI");

            DynamicLabel.loadLabels(criModel, {
                language: language
            }, function (labels) {
                var transformedLabels = {};

                labels.forEach(function (rawLabel) {
                    if (rawLabel["Page"] == page) {
                        transformedLabels[rawLabel["Component"]] = rawLabel["Label"];
                    }
                });


                var labelModel = new JSONModel(transformedLabels);
                this.getView().setModel(labelModel, "Labels");
                if (fnCallback) { fnCallback(labelModel); }
            }.bind(this));
        },
        
        /**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function (sName) {
			return this.getView().getModel(sName);
		}
    });
});