sap.ui.define([
	"ch/portof/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"ch/portof/model/formatter",
	"ch/portof/controller/ErrorHandler"
], function(BaseController, JSONModel, formatter, ErrorHandler) {
	"use strict";
	return BaseController.extend("ch.portof.controller.Reporting", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf ch.portof.view.Reporting
		 */
		onInit: function() {
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				username: "XYLAN",
				lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading")
			});
			if (typeof sap.ushell.Container !== 'undefined') {
				// the variable is defined
				oViewModel.setProperty("/username", sap.ushell.Container.getUser().getId());
			}

			this.setModel(oViewModel, "reportView");
			this.getRouter().getRoute("showReportingRoute").attachMatched(this._onRouteMatched, this);
			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
		},
		_onRouteMatched: function(oEvent) {
			// var sObjectId = oEvent.getParameter("arguments").objectId;
			this.getModel().metadataLoaded().then(function() {
				var sObjectPath = "RapporteSet";
				this._bindView("/" + sObjectPath);
			}.bind(this));
		},

		_bindView: function(sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("reportView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);
			var oSelect, oBinding, aFilters;

			var sFilterValue = oViewModel.getProperty("/username"); // I assume you can get the filter value from somewhere...
			oSelect = this.getView().byId("lineItemsList"); //get the reference to your Select control
			oBinding = oSelect.getBinding("items");
			aFilters = [];

			if (sFilterValue) {
				aFilters.push(new sap.ui.model.Filter("Ernam", sap.ui.model.FilterOperator.EQ, sFilterValue));
			}
			oBinding.filter(aFilters, sap.ui.model.FilterType.Control); //apply the filter sap.ui.model.FilterType.Application
			/*			this.getView().bindElement({
							path: sObjectPath,
							filters: aFilters,
							events: {
								change: this._onBindingChange.bind(this),
								dataRequested: function() {
									oViewModel.setProperty("/busy", true);
								},
								dataReceived: function() {

									oViewModel.setProperty("/busy", false);
								}
							}

						});*/
		},
		_onBindingChange: function() {

			/*			var oView = this.getView(),
							oElementBinding = oView.getElementBinding();*/
			// No data for the binding
			/*if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}*/
			/*			var sPath = oElementBinding.getPath(),
							oResourceBundle = this.getResourceBundle(),
							oObject = oView.getModel().getObject(sPath),
							//	sObjectId = oObject.Schiffsnummer,
							//	sObjectName = oObject.Name,
							oViewModel = this.getModel("reportView");
						this.getOwnerComponent().oListSelector.selectAListItem(sPath);*/
			// oViewModel.setProperty("/shareSendEmailSubject", oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));

			// oViewModel.setProperty("/shareSendEmailMessage", oResourceBundle.getText("shareSendEmailObjectMessage", [
			// 	sObjectName,
			// 	sObjectId,
			// 	location.href
			// ]));
			/*			var oSelect, oBinding, aFilters;

						var sFilterValue = oViewModel.getProperty("/username"); // I assume you can get the filter value from somewhere...
						oSelect = this.getView().byId("lineItemsList"); //get the reference to your Select control
						oBinding = oSelect.getBinding("items");
						aFilters = [];

						if (sFilterValue) {
							aFilters.push(new sap.ui.model.Filter("Ernam", sap.ui.model.FilterOperator.EQ, sFilterValue));
						}
						oBinding.filter(aFilters, sap.ui.model.FilterType.Control); //apply the filter sap.ui.model.FilterType.Application*/
		},
		_onMetadataLoaded: function() {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("reportView");
			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);
			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},
		/**
		 * Updates the item count within the line item table's header
		 * @param {object} oEvent an event containing the total number of items in the list
		 * @private
		 */
		onListUpdateFinished: function(oEvent) {
			var sTitle, iTotalItems = oEvent.getParameter("total"),
				oViewModel = this.getModel("reportView");
			// only update the counter if the length is final
			if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
				if (iTotalItems) {
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
				} else {
					//Display 'Line Items' instead of 'Line items (0)'
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
				}
				oViewModel.setProperty("/lineItemListTitle", sTitle);
			}
		},
		/**
		 *@memberOf ch.portof.controller.Detail
		 */
		_onListItemPressed: function(oEvent) {
			//This code was generated by the layout editor.
			//oEvent.getSource().getBindingContext().getObject();
			/*this.getRouter().navTo("rapportRouteReport", {
				objectId: oEvent.getSource().getBindingContext().getObject().Rapportid
			}, true); //this.getRouter().navTo("rapport");*/

			if (oEvent.getSource().getBindingContext().getObject().RapportArt === "S") {
				this.getRouter().navTo("rapportSSBRoute", {
					objectId: oEvent.getSource().getBindingContext().getObject().Rapportid
				}, true); //this.getRouter().navTo("rapport");
			} else {
				this.getRouter().navTo("rapportRouteReport", {
					objectId: oEvent.getSource().getBindingContext().getObject().Rapportid
				}, true); //this.getRouter().navTo("rapport");				
			}
		}

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf ch.portof.view.Reporting
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf ch.portof.view.Reporting
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf ch.portof.view.Reporting
		 */
		//	onExit: function() {
		//
		//	}
	});
});