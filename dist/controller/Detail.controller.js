/*global location */
sap.ui.define([
	"ch/portof/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"ch/portof/model/formatter"
], function(BaseController, JSONModel, formatter) {
	"use strict";
	return BaseController.extend("ch.portof.controller.Detail", {
		formatter: formatter,
		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */
		onInit: function() {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading")
			});
			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
			this.setModel(oViewModel, "detailView");
			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
			/*			var oModelTest = this.getView().getModel();
							var title = this.byId("debitorHeader1").getProperty("title");
							if (title) {
							title = title + "1";
							}
							else {
								title = "hui";
							}
							 console.log( oModelTest.getProperty("Name") );
									this.byId("debitorHeader1").setProperty("title", title );
								this.byId("debitorHeader1").setProperty("intro", oModelTest.getProperty("Name1"));*/
			//this.byId("debitorHeader1").setProperty( "titel" , "test");
			//var testvar = this.getModel("detailView").getProperty("{SchiffeSet/Name}");
			//var testvar = this.getModel("SchiffeSet").getProperty("Name");
			//this.byId("debitorHeader1").setProperty("title", testvar); 
			//var oModelNew = new sap.ui.model.odata.v2.ODataModel( this.getModel("detailView").getProperty("/Debitoren") );
			//oModelNew.getProperty("Name1");
			//sap.ui.getCore().byId("debitorHeader1").setProperty( "titel" , "test");
			//this.byId("debitorHeader1").setProperty( "title" , oModelNew.getProperty("Name1") );
			//this.byId("debitorHeader1").setProperty( "title" , "test" );
		},
		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onShareEmailPress: function() {
			var oViewModel = this.getModel("detailView");
			sap.m.URLHelper.triggerEmail(null, oViewModel.getProperty("/shareSendEmailSubject"), oViewModel.getProperty(
				"/shareSendEmailMessage"));
		},
		/**
		 * Updates the item count within the line item table's header
		 * @param {object} oEvent an event containing the total number of items in the list
		 * @private
		 */
		onListUpdateFinished: function(oEvent) {
			var sTitle, iTotalItems = oEvent.getParameter("total"),
				oViewModel = this.getModel("detailView");
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
		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */
		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function(oEvent) {
			var sObjectId = oEvent.getParameter("arguments").objectId;
			this.getModel().metadataLoaded().then(function() {
				var sObjectPath = this.getModel().createKey("SchiffeSet", {
					Schiffsnummer: sObjectId
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));
		},
		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function(sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");
			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);
			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function() {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function() {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},
		_onBindingChange: function() {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();
			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}
			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.Schiffsnummer,
				sObjectName = oObject.Name,
				oViewModel = this.getModel("detailView");
			this.getOwnerComponent().oListSelector.selectAListItem(sPath);
			oViewModel.setProperty("/shareSendEmailSubject", oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage", oResourceBundle.getText("shareSendEmailObjectMessage", [
				sObjectName,
				sObjectId,
				location.href
			])); //var oModelNew = new sap.ui.model.odata.v2.ODataModel( this.getModel("detailView").getProperty("/Debitoren") );
			//oModelNew.getProperty("Name1");
			//	sap.ui.getCore().byId("debitorHeader1").setProperty( "titel" , "test");
			//	this.byId("debitorHeader1").setProperty( "titel" , "test");
			///var oModelTest = this.getView().getModel();
			///var sPath = this.getView().byId("__attribute3").getBindingContext()["sPath"];
			///oModelTest.read(sPath); //console.log( oModelTest.getProperty("Name") );
			/*var title = this.byId("debitorHeader1").getProperty("title");
			if (title) {
			title = title + "1";
			}
			else {
				title = "hui";
			}
			 console.log( oModelTest.getProperty("Name") );
					this.byId("debitorHeader1").setProperty("title", title );
				this.byId("debitorHeader1").setProperty("intro", oModelTest.getProperty("Name1"));*/
		},
		_onMetadataLoaded: function() {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView"),
				oLineItemTable = this.byId("lineItemsList"),
				iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();
			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);
			oViewModel.setProperty("/lineItemTableDelay", 0);
			oLineItemTable.attachEventOnce("updateFinished", function() {
				// Restore original busy indicator delay for line item table
				oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
			});
			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},
		/**
		 *@memberOf ch.portof.controller.Detail
		 */
		testEvent: function() {
			//This code was generated by the layout editor.
			this.byId("debitorHeader1").setProperty("title", "afterInit");
		},
		/**
		 *@memberOf ch.portof.controller.Detail
		 */
		newRapport: function() {
			//This code was generated by the layout editor.
			//this.getRouter().navTo("rapport");
			//							this.getRouter().getTargets().display("detailNoObjectsAvailable");
			// this.getRouter().getTargets().display("rapportTarget");
			//var bReplace = !Device.system.phone;
			this.getRouter().navTo("rapportNewRoute", {
				objectId: this.getView().getBindingContext().getProperty("Schiffsnummer")
			}, true); //this.getRouter().navTo("rapport");
		},
		newRapportSSB: function() {

			this.getRouter().navTo("rapportNewSSBRoute", {
				objectId: this.getView().getBindingContext().getProperty("Schiffsnummer")
			}, true);
		},
		/**
		 *@memberOf ch.portof.controller.Detail
		 */
		_onListItemPressed: function(oEvent) {
			//This code was generated by the layout editor.
			//oEvent.getSource().getBindingContext().getObject();
			this.getRouter().navTo("rapportRoute", {
				objectId: oEvent.getSource().getBindingContext().getObject().Rapportid
			}, true); //this.getRouter().navTo("rapport");
		}
	});
});