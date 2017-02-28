sap.ui.define([], function() {
	"use strict";

	return {
		/**
		 * Rounds the currency value to 2 digits
		 *
		 * @public
		 * @param {string} sValue value to be formatted
		 * @returns {string} formatted currency value with 2 digits
		 */
		currencyValue: function(sValue) {
			jQuery.sap.require("sap.ui.core.format.NumberFormat");
			var oNumberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
				maxFractionDigits: 2,
				groupingEnabled: true,
				groupingSeparator: ",",
				decimalSeparator: "."
			});

			if (!sValue) {
				return "";
			}

			//		return parseFloat(sValue).toFixed(0);
			return oNumberFormat.format(sValue);
		},
		time: function(value) {
			//                             console.log(value);                        
			if (value) {

				var date = new Date(value.ms);
				//                             console.log("date po value.ms: "+ date);
				var timeinmiliseconds = date.getTime(); //date.getTime(); //date.getSeconds(); //date.getTime();
				//                             console.log(timeinmiliseconds);
				var oTimeFormat = sap.ui.core.format.DateFormat.getTimeInstance({
					pattern: "KK:mm:ss a"
				});
				var TZOffsetMs = new Date(0).getTimezoneOffset() * 60 * 1000;
				//                             console.log(TZOffsetMs);
				var timeStr = oTimeFormat.format(new Date(timeinmiliseconds + TZOffsetMs));
				//                             console.log(timeStr);

				return timeStr;
			} else {
				return value;
			}
		}
	};

});