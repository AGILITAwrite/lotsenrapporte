sap.ui.define([
		"sap/ui/model/json/JSONModel",
		"sap/ui/Device"
	], function (JSONModel, Device) {
		"use strict";

		return {
			createDeviceModel : function () {
				var oModel = new JSONModel(Device);
				oModel.setDefaultBindingMode("OneWay");
				//oModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
				return oModel;
			}
		};

	}
);