sap.ui.define([ "sap/ui/core/Element"],
    /**
     * Heatmap Item
     * @param {sap.ui.core.Element} Element UI5 Base Element
     * @returns {*} VisualFilter item
     */
    function (Element) {
        'use strict';
        return Element.extend("sap.fiori.cri.control.VisualFilterItem",{
            metadata: {
                properties: {
                    "label" : {type: "string", group: "Misc", defaultValue: ""},
                    "color" : {type: "string", group: "Misc", defaultValue: null},
                    "value" : {type: "float", group: "Misc", defaultValue: 1.0},
                    "data" : {type: "any", group: "Misc", defaultValue: null}
                }
            }
        });
    }
);