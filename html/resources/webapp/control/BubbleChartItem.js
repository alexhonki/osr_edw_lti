sap.ui.define(["sap/ui/core/Element"],
    /**
     * Bubble chart Item
     * @param {sap.ui.core.Element} Element UI5 Base Element
     * @returns {*} Bubble chart item
     */
    function (Element) {
        'use strict';
        return Element.extend("sap.fiori.cri.control.BubbleChartItem",{
            metadata: {
                properties: {
                    "name" : {type: "string", group: "Misc", defaultValue: null},
                    "value" : {type: "float", group: "Misc", defaultValue: null},
                    "intensity" : {type: "float", group: "Misc", defaultValue: null}
                }
            }
        });
    }
);