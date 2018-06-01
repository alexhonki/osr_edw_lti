describe("Exits test suite", function() {
	var originalTimeout;
	beforeEach(function() {
		originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    	jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
	});
	
	afterEach(function() {
    	jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
	});

	it("set config attributes", function() {
		$.import("exits", "Config");
		var config = $.exits.Config;
		var oConfig = {
			ATTRIBUTE_ID: 0,
			IS_FILTER: 0,
			IS_SENSITIVE: 0,
			IS_SHOW_DETAILS: 0
		};
		var oRow = {
			ATTRIBUTE_ID: 1,
			IS_FILTER: 1,
			IS_SENSITIVE: 1,
			IS_SHOW_DETAILS: 1
		};
		var result = config.setConfigAttributes(oConfig, oRow);
		expect(result.ATTRIBUTE_ID).toBe(1);
	});
	
	it("update event", function() {
		$.import("exits", "Config");
		var config = $.exits.Config;
		var oEvent = {
			DESCRIPTION: 0,
			IS_ENABLED: 0,
			CHANGED_ON: 0,
			CHANGED_BY: 0
		};
		var oRow = {
			DESCRIPTION: 1,
			IS_ENABLED: 1,
			CHANGED_ON: 1,
			CHANGED_BY: 1
		};
		var result = config.updateEvent(oEvent, oRow);
		expect(result.DESCRIPTION).toBe(1);
	});
	
	it("valid value", function() {
		$.import("exits", "Config");
		var config = $.exits.Config;
		expect(config.validValue(1,undefined)).toBe(1);
	});
	
	it("update Event Management", function() {
		$.import("exits", "Config");
		$.import("exits", "Utils");
		var config = $.exits.Config;
		var utils = $.exits.Utils;
		var param = {
			connection: {
				prepareStatement: function(a){
					return {
						close: function(){},
						executeQuery: function(){
							return "";
						}
					};
				}                            
			}
		};
		var oRow = {
			DESCRIPTION: 1,
			IS_ENABLED: 1,
			CHANGED_ON: 1,
			CHANGED_BY: 1
		};
		var oData = {
			EventManagement: [oRow]
		};
		spyOn(utils, "recordSetToJSON").and.returnValue(oData);
		config.updateEventManagement(param);       
		expect(utils.recordSetToJSON).toHaveBeenCalled();
	});
	
	it("update Attribute Types", function() {
		$.import("exits", "Config");
		$.import("exits", "Utils");
		var config = $.exits.Config;
		var utils = $.exits.Utils;
		var param = {
			connection: {
				prepareStatement: function(a){
					return {
						close: function(){},
						executeQuery: function(){
							return "";
						}
					};
				}                            
			}
		};
		var oRow = {
			DESCRIPTION: 1,
			IS_ENABLED: 1,
			CHANGED_ON: 1,
			CHANGED_BY: 1
		};
		var oData = {
			"Attribute": [oRow]
		};
		spyOn(utils, "recordSetToJSON").and.returnValue(oData);
		config.updateAttributeTypes(param);       
		expect(utils.recordSetToJSON).toHaveBeenCalled();
	});
	
	it("update Prediction Date", function() {
		$.import("exits", "Config");
		$.import("exits", "Utils");
		var config = $.exits.Config;
		var utils = $.exits.Utils;
		var param = {
			connection: {
				prepareStatement: function(a){
					return {
						close: function(){},
						executeQuery: function(){
							return "";
						}
					};
				}                            
			}
		};
		var oRow = {
			DESCRIPTION: 1,
			IS_ENABLED: 1,
			CHANGED_ON: 1,
			CHANGED_BY: 1
		};
		var oData = {
			ConfigBucket: [oRow]
		};
		spyOn(utils, "recordSetToJSON").and.returnValue(oData);
		config.updatePredictionDate(param);       
		expect(utils.recordSetToJSON).toHaveBeenCalled();
	});
	
	it("update Config", function() {
		$.import("exits", "Config");
		$.import("exits", "Utils");
		var config = $.exits.Config;
		var utils = $.exits.Utils;
		var param = {
			connection: {
				prepareStatement: function(a){
					return {
						close: function(){},
						executeQuery: function(){
							return "";
						}
					};
				}                            
			}
		};
		var oRow = {
			DESCRIPTION: 1,
			IS_ENABLED: 1,
			CHANGED_ON: 1,
			CHANGED_BY: 1
		};
		var oData = {
			ConfigBucket: [oRow]
		};
		spyOn(utils, "recordSetToJSON").and.returnValue(oData);
		spyOn(utils, "getTxFindPromise").and.returnValue(Promise.resolve([]));
		config.updateConfig(param);       
		expect(utils.recordSetToJSON).toHaveBeenCalled();
	});
	
	it("update Config Reaction Type", function() {
		$.import("exits", "Config");
		$.import("exits", "Utils");
		var config = $.exits.Config;
		var utils = $.exits.Utils;
		var param = {
			connection: {
				prepareStatement: function(a){
					return {
						close: function(){},
						executeQuery: function(){
							return "";
						}
					};
				}                            
			}
		};
		var oRow = {
			DESCRIPTION: 1,
			IS_ENABLED: 1,
			CHANGED_ON: 1,
			CHANGED_BY: 1
		};
		var oData = {
			ConfigBucket: [oRow]
		};
		spyOn(utils, "recordSetToJSON").and.returnValue(oData);
		config.updateConfigReactionType(param);       
		expect(utils.recordSetToJSON).toHaveBeenCalled();
	});
	
		it("Should be async: getImportEntitiesPromise", function(done) {
		$.import("exits", "Utils");
		
		var utils = $.exits.Utils;
		var importPromise = utils.getImportEntitiesPromise(["db::app.AttributeTypes"]);
		expect(importPromise).toEqual(jasmine.any(Promise));
		//
		importPromise.then((result) => {
				done();
		});
		
	});

		it("Should be async: getTxPromise", function(done) {
		$.import("exits", "Utils");
		
		var utils = $.exits.Utils;
		var txPromise = utils.getTxPromise([]);
		expect(txPromise).toEqual(jasmine.any(Promise));
		//
		txPromise.then((result) => {
				done();
		});
		
	});
	
		it("Should be async: getTxFindPromise", function(done) {
		$.import("exits", "Utils");
		var utils = $.exits.Utils;
		const aPromise = Promise.resolve([]);
		var oTx = {
			$find : function({},{},{}){
				return aPromise;
			}
		};
	
		utils.getTxFindPromise({},{},oTx);
		aPromise.then((result) => {
				expect(result.length).toEqual(0);
				done();
		});
		
	});
	
	it("Escape Special Characters", function() {
		$.import("exits", "Utils");
		var utils = $.exits.Utils;
		expect(utils.escapeSpecialChars("\tabs")).toEqual("\\tabs");
		expect(utils.escapeSpecialChars(null)).toEqual("");	
	});

});