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
			// edm.time to xsd:duration Odata Model liefert edm.time erwartet aber xsd:duration zum speichern :(
			//                             console.log(value);                        
			if (value) {

				var timeinmiliseconds = value.getTime();

				var oTimeFormat = sap.ui.core.format.DateFormat.getTimeInstance({
					pattern: "PTHH'H'mm'M'ss'S'",
					UTC: true
				});
				//falls Zeitzonen Konvertierung nötig
				var TZOffsetMs = 0; // new Date().getTimezoneOffset() * 60 * 1000;
				//                             console.log(TZOffsetMs);
				var timeStr = oTimeFormat.format(new Date(timeinmiliseconds + TZOffsetMs));
				return timeStr;
			} else {
				return value;
			}
		},
		UTCTimeToLocale: function(value) {
			return new Date(value.getTime() - value.getTimezoneOffset() * 60000);
		},
		LocaleTimeToUTC: function(value) {
			return new Date(value.getTime() + value.getTimezoneOffset() * 60000);
		},
		fnBooleanFormatter: function(value) {
			if (value === false) {
				value = null;
			}
			return value;
		},
		convertToBool: function(value) {
			//String zu bool umwandeln (invertiert)
			// return true;
			if (value == null || value == "") {
				return true;
			} else {
				return false;
			}
		},
		durationToTimestamp: function(value) {
			var oDateFormat = sap.ui.core.format.DateFormat.getTimeInstance({
				pattern: "'PT'HH'H'mm'M'ss'S'"
			});

			return oDateFormat.parse(value, true).getTime();
		}
	};

});