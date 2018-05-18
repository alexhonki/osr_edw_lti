sap.ui.define([
    "sap/ui/core/Control",
    "sap/fiori/cri/service/DynamicLabel",
    "sap/ui/model/json/JSONModel",
    "sap/m/Text"
    ],
    /**
     * Base Control
     * @param {sap.ui.core.Control} Control UI5 Base Control
     * @param {sap.fiori.cri/.service.DynamicLabel} DynamicLabel DynamicLabel service
     * @param {sap.ui.model.json.JSONModel} JSONModel JSONModel
     * @param {sap.m.Text} Text Text
     * @returns {*} Visual Filter Horizontal Bars
     */
    function (Control, DynamicLabel, JSONModel, Text) {
        'use strict';
        return Control.extend("sap.fiori.cri.control.BaseControl", {
            loadLabels: function (page, language, fnCallback) {
                var criModel = this.getModel("CRI");

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
                    this.setModel(labelModel, "Labels");
                    if (fnCallback) { fnCallback(labelModel); }
                }.bind(this));
            },
            createContent: function () {
                return new Text();
            },
            render: function (oRm, oControl) {
                    var layout = oControl.createContent();
                    oRm.write("<div");
                    oRm.writeControlData(oControl);
                    oRm.writeClasses();
                    oRm.write(">");
                    oRm.renderControl(layout);
                    oRm.addClass("verticalAlignment");
                    oRm.write("</div>");
            },
            renderer: {
                render: this.render
            }
        });
    }
);