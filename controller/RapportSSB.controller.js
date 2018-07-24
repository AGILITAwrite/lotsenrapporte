sap.ui.define([
			//	"sap/ui/core/mvc/Controller"
			"ch/portof/controller/BaseController",
			"sap/ui/model/json/JSONModel",
			"ch/portof/model/formatter",
			"ch/portof/controller/ErrorHandler",
			"sap/ui/core/routing/History"
		], function(BaseController, JSONModel, formatter, ErrorHandler, History) {
			"use strict";
			return BaseController.extend("ch.portof.controller.RapportSSB", {
					/**
					 * Called when a controller is instantiated and its View controls (if available) are already created.
					 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
					 * @memberOf ch.portof.view.Rapport
					 */
					formatter: formatter,
					onInit: function() {
						var oViewModel = new JSONModel({
							busy: false,
							delay: 0,
							initSignature: false,
							poweruser: false,
							reporting: false,
							newRapport: false,
							changeMode: false,
							annullierenVisible: false,
							confirmed: false,
							fahrtrichtung: "",
							total: 0,
							lotsenname: "",
							effektiveEinsatzZeit: 0,
							rapportart: "S", //Schlepp und Schubboot Rapport
							pauschalPreis: false, //pauschalpreis bei Material Pauschal
						});
						this.setModel(oViewModel, "rapportSSBView");
						this.getView().getModel("rapportSSBView").setProperty("/changeMode", true);
						this._getBenutzer();
						this.getRouter().getRoute("rapportNewSSBRoute").attachMatched(this._onRouteMatchedNew, this);
						this.getRouter().getRoute("rapportSSBRoute").attachMatched(this._onRouteMatchedOld, this);
						this.getRouter().getRoute("rapportRouteReport").attachMatched(this._onRouteMatchedReport, this);
						this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
					},
					/**
					 * If the master route was hit (empty hash) we have to set
					 * the hash to to the first item in the list as soon as the
					 * listLoading is done and the first item in the list is known
					 * @private
					 */
					_onRouteMatchedNew: function(oEvent) {
						//this._resetModel();
						this.getView().getModel("rapportSSBView").setProperty("/newRapport", true);
						this.getView().getModel("rapportSSBView").setProperty("/changeMode", true);
						this.getView().getModel("rapportSSBView").setProperty("/annullierenVisible", false);
						this.getView().getModel("rapportSSBView").setProperty("/confirmed", false);
						this.getView().getModel("rapportSSBView").setProperty("/reporting", false);

						this.getView().getModel("rapportSSBView").setProperty("/fahrtrichtung", "");
						this.getView().getModel("rapportSSBView").setProperty("/poweruser", false);
						this.getView().getModel("rapportSSBView").setProperty("/total", 0);
						this.getView().getModel("rapportSSBView").setProperty("/lotsenname", "");
						this.getView().getModel("rapportSSBView").setProperty("/effektiveEinsatzZeit", 0);

						var dateForTime = new Date();
						dateForTime.setYear(1970);
						dateForTime.setMonth(1);
						dateForTime.setDate(1);
						// Annullieren von neuen Rapporten nicht möglich
						var sObjectId = oEvent.getParameter("arguments").objectId;
						this.getModel().resetChanges();
						//var dateTime = new Date();
						this.getModel().metadataLoaded().then(function() {
							var oRapporteModel = this.getView().getModel();
							var onewRapport = oRapporteModel.createEntry("/RapporteSet");
							oRapporteModel.setProperty("Datum", new Date(), onewRapport);
							oRapporteModel.setProperty("DatumTo", new Date(), onewRapport);
							//keine Zeiten vorschlagen
							/*				oRapporteModel.setProperty("ZeitTo", {
												// ms: formatter.UTCTimeToLocale(new Date()).getTime(),
												ms: formatter.UTCTimeToLocale(dateForTime).getTime(),
												__edmtype: "Edm.Time"
											}, onewRapport);*/
							// statdessen leer 
							//RapporteModel.setProperty("ZeitTo", null, onewRapport);
							oRapporteModel.setProperty("ZeitTo", {
									ms: (new Date(0)).getTime(),
									__edmtype: "Edm.Time"
								},
								onewRapport);

							//dateForTime.setHours( dateForTime.getHours() + 1 );

							//keine Zeiten vorschlagen
							dateForTime.setMinutes(dateForTime.getMinutes() - 30);
							/*				oRapporteModel.setProperty("Zeit", {
												//ms: formatter.UTCTimeToLocale(new Date()).getTime(),
												ms: formatter.UTCTimeToLocale(dateForTime).getTime(),
												__edmtype: "Edm.Time"
											}, onewRapport);*/
							// statdessen leer 
							// oRapporteModel.setProperty("Zeit", null, onewRapport);
							oRapporteModel.setProperty("Zeit", {
									ms: (new Date(0)).getTime(),
									__edmtype: "Edm.Time"
								},
								onewRapport);

							oRapporteModel.setProperty("EniNr", sObjectId, onewRapport);
							oRapporteModel.setProperty("Lotsenname", this.getModel("rapportSSBView").getProperty("/lotsenname"), onewRapport);
							oRapporteModel.setProperty("RapportArt", this.getModel("rapportSSBView").getProperty("/rapportart"), onewRapport);
							oRapporteModel.setProperty("Talfahrt", true, onewRapport);
							//oRapporteModel.setProperty("OrtVon", "TNKLP", onewRapport);

							var sObjectPath = onewRapport.getPath();
							this._bindView(sObjectPath);
						}.bind(this));
					},
					_onRouteMatchedOld: function(oEvent) {
						this.getView().getModel("rapportSSBView").setProperty("/newRapport", false);
						this.getView().getModel("rapportSSBView").setProperty("/changeMode", false);
						this.getView().getModel("rapportSSBView").setProperty("/confirmed", true);
						// Rapport kann nur gespeichert werden wenn Flag gesetzt
						this.getView().getModel("rapportSSBView").setProperty("/reporting", false);
						// zum Editeren von bestehenden rapporten hier aktivieren.
						this.getView().getModel("rapportSSBView").setProperty("/annullierenVisible", true);
						// Annullieren von gespeicherten Rapporten möglich
						var sObjectId = oEvent.getParameter("arguments").objectId;
						this.getModel().metadataLoaded().then(function() {
							var sObjectPath = this.getModel().createKey("RapporteSet", {
								Rapportid: sObjectId
							});
							this._bindView("/" + sObjectPath);
						}.bind(this));
					},
					_onRouteMatchedReport: function(oEvent) {
						//property reporting setzen und dann normale route für bestehenden Rapport aufrufen
						this._onRouteMatchedOld(oEvent);
						this.getView().getModel("rapportSSBView").setProperty("/reporting", true);
					},
					/**
					 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
					 * @memberOf ch.portof.view.Rapport
					 */
					//	onExit: function() {
					//
					//	}	,
					/**
					 * Binds the view to the object path. Makes sure that detail view displays
					 * a busy indicator while data for the corresponding element binding is loaded.
					 * @function
					 * @param {string} sObjectPath path to the object to be bound to the view.
					 * @private
					 */
					_bindView: function(sObjectPath) {
						// Set busy indicator during view binding
						var oViewModel = this.getModel("rapportSSBView");
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
						/*			if (!oElementBinding.getBoundContext()) {
										this.getRouter().getTargets().display("detailObjectNotFound");
										// if object could not be found, the selection in the master list
										// does not make sense anymore.
										this.getOwnerComponent().oListSelector.clearMasterListSelection();
										return;
									}*/
						var sPath = oElementBinding.getPath(),
							oResourceBundle = this.getResourceBundle(),
							oObject = oView.getModel().getObject(sPath),
							sObjectId = oObject.Schiffsnummer,
							sObjectName = oObject.Name,
							oViewModel = this.getModel("rapportSSBView");
						//this.getOwnerComponent().oListSelector.selectAListItem(sPath);
						var oContext = this.getView().getBindingContext();
						//* Signatur auskommentiert* var oSignature = oContext.getProperty("Signatur");
						//* Signatur auskommentiert* this._createSignatureModel(oSignature);
						this._createTarifModel();
						this._createSelTarifModel();
						this._createOrteModel();
						this._createSchiffsModel();
						this._createDebitorModel();
						this._updateTarife();
						//this._updateTarifeNewDate();
						//this._updateSelTarife();
						this._setFahrtrichtung();
						// Bei annullierten Rapporten löschvermerk ausblenden
						if (oContext.getProperty("Loevm") === true) {
							this.getView().getModel("rapportSSBView").setProperty("/annullierenVisible", false);
						}
					},
					_onMetadataLoaded: function() {
						// Store original busy indicator delay for the detail view
						var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
							oViewModel = this.getModel("rapportSSBView");
						// Make sure busy indicator is displayed immediately when
						// detail view is displayed for the first time
						oViewModel.setProperty("/delay", 0);
						// Binding the view will set it to not busy - so the view is always busy if it is not bound
						oViewModel.setProperty("/busy", true);
						// Restore original busy indicator delay for the detail view
						oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
					},
					/**
					 *@memberOf ch.portof.controller.Rapport
					 */
					onCancel: function() {
						var oViewModel = this.getModel("rapportSSBView");
						var oContext = this.getView().getBindingContext();
						var schiffsnr = oContext.getProperty("EniNr");
						//* Signatur auskommentiert* this.onSignatureReset();
						this._destory(false);
						if (oViewModel.getProperty("/reporting") === true) {
							this.getRouter().navTo("showReportingRoute", {}, true);
						} else {
							this.getRouter().navTo("object", {
								objectId: schiffsnr
							}, true);
						}
					},
					/**
					 *@memberOf ch.portof.controller.Rapport
					 */
					onSave: function() {
						var error = false;
						var oRapportModel = this.getModel();
						var oContext = this.getView().getBindingContext();

						/* Signatur auskommentiert*
			var oSignature = $("#signature");
			if (oSignature) {
				var oSignatureBase30 = oSignature.jSignature("getData", "base30");
				if (oSignatureBase30) {
					var isSignatureProvided = oSignatureBase30[1].length > 1 ? true : false;
					if (isSignatureProvided) {
						oRapportModel.setProperty("Signatur", oSignatureBase30[1], oContext);
					} else {
						oRapportModel.setProperty("Signatur", null, oContext);
					}
				}

				var oSignaturImage = oSignature.jSignature("getData", "image");
				// var oSignaturImage = oSignature.jSignature("getData", "image");
				if (oSignaturImage) {
					var isSignatureProvidedImage = oSignaturImage[1].length > 1 ? true : false;
					if (isSignatureProvidedImage) {
						oRapportModel.setProperty("Signaturimage", oSignaturImage[1], oContext);
					} else {
						oRapportModel.setProperty("Signaturimage", null, oContext);
					}
				}
			}
*/
						if (!oContext.getProperty("OrtVon")) {
							sap.m.MessageBox.show("Bitte Ort von auswählen!", {
								icon: sap.m.MessageBox.Icon.ERROR,
								title: "Fehler"
							});
							return;
						}
						if (!oContext.getProperty("OrtBis")) {
							sap.m.MessageBox.show("Bitte Ort bis auswählen!", {
								icon: sap.m.MessageBox.Icon.ERROR,
								title: "Fehler"
							});
							return;
						}
						if (!oContext.getProperty("SsbTarif")) {
							sap.m.MessageBox.show("Bitte Tarif auswählen!", {
								icon: sap.m.MessageBox.Icon.ERROR,
								title: "Fehler"
							});
							return;
						}
						if (!oContext.getProperty("SsbMenge")) {
							sap.m.MessageBox.show("Bitte Menge von erfassen!", {
								icon: sap.m.MessageBox.Icon.ERROR,
								title: "Fehler"
							});
							return;
						}
						var minDate = new Date();
						minDate.setDate(minDate.getDate() - 2);
						//Lotsenrapporte nur bis und mit Vortag erfassbar
						if (oContext.getProperty("Datum") >= new Date() || oContext.getProperty("Datum").toDateString() === new Date().toDateString() &&
							this.formatter.time(new Date(oContext.getProperty("Zeit/ms"))) >= this.formatter.time(this.formatter.UTCTimeToLocale(new Date())) // Datum in der Zukunft 
						) {
							sap.m.MessageBox.show("Der Lotsenrapport darf nicht in die Zukunft erfasst werden!  Bitte das Datum anpassen", {
								icon: sap.m.MessageBox.Icon.ERROR,
								title: "Fehler" //,
									//actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
									//onClose: function(oAction) { error = true; } 
							});
						} else if (oContext.getProperty("Datum") < minDate && //Lotsenrapporte nur bis und mit Vortag erfassbar
							!this.getModel("rapportSSBView").getProperty("/poweruser") // Ausnahme für 
						) {
							sap.m.MessageBox.show("Der Lotsenrapport nicht mehr als 1 Tag in die Vergangeheit erfasst werden!  Bitte das Datum anpassen", {
								icon: sap.m.MessageBox.Icon.ERROR,
								title: "Fehler" //,
									//actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
									//onClose: function(oAction) { error = true; } 
							});
						} else {
							// if (!oContext.getProperty("Signatur") // Muss unterschrieben sein 
							// 	&& !this.getModel("rapportSSBView").getProperty("/poweruser") // oder Poweruser 
							// 	|| !this.getModel("rapportSSBView").getProperty("/confirmed")) {
							// 	// 
							// 	//!this.getView().byId("__boxCheckConfirm0").getSelected()) { // 
							// 	sap.m.MessageBox.show("Der Lotsenrapport muss vor dem Speichern best\xE4tigt und unterschrieben werden!", {
							// 		icon: sap.m.MessageBox.Icon.ERROR,
							// 		title: "Fehler" //,
							// 			//actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
							// 			//onClose: function(oAction) { error = true; } 
							// 	});
							// } else {
							if (!oContext.getProperty("Bemerkung") && !this.getModel("Debitor").getProperty("/d/Kunnr")) {
								// 
								//!this.getView().byId("__boxCheckConfirm0").getSelected()) { // 
								sap.m.MessageBox.show("Rechnungsadresse unbekannt. Bitte Rechnungsadresse ins Bemerkungsfeld schreiben!", {
									icon: sap.m.MessageBox.Icon.ERROR,
									title: "Fehler" //,
										//actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
										//onClose: function(oAction) { error = true; } 
								});
							} else {
								// if (this.getModel("rapportSSBView").getProperty("/total") === 0) {
								// 	// 
								// 	//!this.getView().byId("__boxCheckConfirm0").getSelected()) { // 
								// 	sap.m.MessageBox.show("Bitte eine Leistung ausw\xE4hlen!", {
								// 		icon: sap.m.MessageBox.Icon.ERROR,
								// 		title: "Fehler" //,
								// 			//actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
								// 			//onClose: function(oAction) { error = true; } 
								// 	});
								// } else {
								oRapportModel.setProperty("Zeit", this.formatter.time(new Date(oContext.getProperty("Zeit/ms"))), oContext);
								oRapportModel.setProperty("ZeitTo", this.formatter.time(new Date(oContext.getProperty("ZeitTo/ms"))), oContext);
								oRapportModel.submitChanges({
									success: jQuery.proxy(this._submitSuccess, this),
									error: jQuery.proxy(this._submitError, this)
								});
								//}
							}
							// }
						}
					},
					onSignatureReset: function() {
						var oViewModel = this.getModel("rapportSSBView");
						// Model Korrigieren
						var initSignature = oViewModel.getProperty("/initSignature");
						if (initSignature === true) {
							$("#signature").jSignature("clear");
						}
					},
					_initSignature: function() {
						var oViewModel = this.getModel("rapportSSBView");
						var initSignature = oViewModel.getProperty("/initSignature");
						if (initSignature === false) {
							var oSignaturePanel = this.getView().byId("signaturePanel");
							var oSignatureDiv = new sap.ui.core.HTML("signature", {
								// the static content as a long string literal
								content: "<div id='signatureparent' class='signature' ><div id='signature' ></div> </div>",
								afterRendering: function(e) {
									// Init darf nur einmal aufgerufen
									if (this.init === true) {
										$("#signature").jSignature("init");
										this.init = false;
									} else {
										$("#signature").jSignature("clear");
									}

									if (this.getBindingContext()) {
										var oSignature = this.getBindingContext().getProperty("Signatur");
										if (oSignature) {
											var signatureArray = [
												"image/jsignature;base30",
												oSignature
											];
											$("#signature").jSignature("setData", "data:" + signatureArray.join(","));
										}
									}

								}
							});
							oSignatureDiv.init = true;
							if (oSignaturePanel !== null) {
								oSignatureDiv.placeAt(oSignaturePanel);
							}
							oViewModel.setProperty("/initSignature", true);
						}

					},
					/**
					 *@memberOf ch.portof.controller.Rapport
					 */
					_calc: function() {
						var oRapporteContext = this.getView().getBindingContext();
						var oRapporteModel = this.getView().getModel();
						var oTarifModel = this.getView().getModel("sel_tarifeSet");
						var lowest_value = oTarifModel.getProperty("/d/KleinsteEinheit");

						// rechnen des Totalbetrags
						var total = 0;
						this.getView().getModel("rapportSSBView").setProperty("/total", total);

						if (parseFloat(oRapporteContext.getProperty("SsbMenge"), 10) < parseFloat(lowest_value, 10)) {
							// Falls die erfasste zeit kleiner als die Mindestzeit ist 
							oRapporteModel.setProperty("SsbMenge", lowest_value, oRapporteContext);
						}

						if (parseFloat(oRapporteContext.getProperty("SsbMenge"), 10) !== 0 && oRapporteContext.getProperty(
								"SsbMenge") !== "" && oRapporteContext.getProperty("SsbMenge") != null) {
							total = parseFloat(total) + parseFloat(oTarifModel.getProperty("/d/Preis")) *
								parseFloat(oRapporteContext.getProperty("SsbMenge"));
						} else {
							total = 0;
						}
						this.getView().getModel("rapportSSBView").setProperty("/total", total);
					},
					/**
					 *@memberOf ch.portof.controller.Rapport
					 */
					_calcDateDiffrence: function() {
						//var oRapporteModel = this.getView().getBindingContext();
						var oRapporteContext = this.getView().getBindingContext();
						var oRapporteModel = this.getView().getModel();
						var oTarifModel = this.getView().getModel("sel_tarifeSet");
						// var lowest_value = parseFloat( this.getView().getModel("sel_tarifeSet").getProperty("/d/KleinsteEinheit"), 10);

						//var date_from = this.formatter.UTCTimeToLocale(oRapporteContext.getProperty("Datum")).toJSON().slice(0, -1);
						var date_from = this.formatter.UTCTimeToLocale(oRapporteContext.getProperty("Datum"));
						// var time_from = this.formatter.UTCTimeToLocale(new Date(oRapporteContext.getProperty("Zeit/ms")));
						var time_from = this.formatter.LocaleTimeToUTC(new Date(oRapporteContext.getProperty("Zeit/ms")));

						//var date_to = this.formatter.UTCTimeToLocale(oContext.getProperty("DatumTo")).toJSON().slice(0, -1);
						var date_to = this.formatter.UTCTimeToLocale(oRapporteContext.getProperty("DatumTo"));
						// var time_to = this.formatter.UTCTimeToLocale(new Date(oRapporteContext.getProperty("ZeitTo/ms")));
						var time_to = this.formatter.LocaleTimeToUTC(new Date(oRapporteContext.getProperty("ZeitTo/ms")));

						var dateTimeFrom = new Date(date_from.getFullYear(), date_from.getMonth(), date_from.getDate(), time_from.getHours(), time_from.getMinutes(),
							time_from.getSeconds(), time_from.getMilliseconds());
						var dateTimeTo = new Date(date_to.getFullYear(), date_to.getMonth(), date_to.getDate(), time_to.getHours(), time_to.getMinutes(),
							time_to.getSeconds(), time_to.getMilliseconds());

						//var diff = dateTimeTo - dateTimeFrom;
						//			var diff = new Date( Math.abs(dateTimeTo - dateTimeFrom) / 36e5 );

						var oDateFormat = sap.ui.core.format.DateFormat.getTimeInstance({
							pattern: "HH:mm",
							UTC: true
						});

						var diff_ms = Math.floor(((Math.floor(dateTimeTo / 60000) * 60000) - (Math.floor(dateTimeFrom / 60000) * 60000)) / (36e5 / 100)) *
							(36e5 / 100);
						//var diff = oDateFormat.format(new Date( diff_minutes ));
						var diff = diff_ms / 36e5;

						var old_effective_time = this.getView().getModel("rapportSSBView").getProperty("/effektiveEinsatzZeit");
						if (old_effective_time != diff) {
							var lowest_value;
							if (oTarifModel === null) {
								lowest_value = oTarifModel.getProperty("/d/KleinsteEinheit");
							}

							if (parseFloat(diff, 10) < parseFloat(lowest_value, 10)) {
								// Falls die erfasste zeit kleiner als die Mindestzeit ist 
								oRapporteModel.setProperty("SsbMenge", lowest_value, oRapporteContext);
							} else {
								oRapporteModel.setProperty("SsbMenge", (diff).toString(), oRapporteContext);
							}

						}
						this.getView().getModel("rapportSSBView").setProperty("/effektiveEinsatzZeit", diff);

					},
					_createSignatureModel: function(oSignature) {
						// Model zum handling der Signatur erzeugen
						var oSignatureModel = new JSONModel({
							isFilterBarVisible: false,
							filterBarLabel: "",
							delay: 0,
							title: this.getResourceBundle().getText("confirmationsTitleCount ", [0]),
							noDataText: this.getResourceBundle().getText("confirmationsListNoDataText ")
						});
						this.setModel(oSignatureModel, "Signature");
						this._initSignature();
					},

					_createOrteModel: function() {
						// Model zum Lesen der Orte erzeugen
						var oOrteModel = new JSONModel({
							busy: false,
							delay: 0
						});
						this.setModel(oOrteModel, "orteSet");
						this._updateOrte();
					},
					_createTarifModel: function() {
						// Model zum Lesen der Tarife erzeugen
						var oTarifModel = new JSONModel({
							busy: false,
							delay: 0
						});
						this.setModel(oTarifModel, "tarifeSet");
						this._updateTarifeNewDate();
					},
					_getPegel: function(atype) {
						// Model zum Lesen der Tarife erzeugen
						var oPegelModel = new JSONModel({
							busy: false,
							delay: 0
						});

						var oContext = this.getView().getBindingContext();
						if (atype === "Pegel") {
							var date = this.formatter.UTCTimeToLocale(oContext.getProperty("Datum")).toJSON().slice(0, -1);
							var time = this.formatter.time(new Date(oContext.getProperty("Zeit/ms")));
						} else if (atype === "PegelTo") {
							date = this.formatter.UTCTimeToLocale(oContext.getProperty("DatumTo")).toJSON().slice(0, -1);
							time = this.formatter.time(new Date(oContext.getProperty("ZeitTo/ms")));
						}

						var URL = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/PegelSet(Pegeldatum=datetime'" + date + "',Pegelzeit=time'" + time + "')";
						oPegelModel.loadData(URL, true, false);
						var pegelstand = oPegelModel.getProperty("/d/Pegelstand");
						var oRapporteModel = this.getView().getModel();

						oRapporteModel.setProperty(atype, pegelstand, oContext);
						// oRapporteModel.setProperty("Samstagszuschlag", false, oContext);

					},
					_updateTarife: function() {
						// Ermitteln der Tarife 
						var oRapporteModel = this.getView().getBindingContext();

						var date_from = this.formatter.UTCTimeToLocale(oRapporteModel.getProperty("Datum")).toJSON().slice(0, -1);
						var time_from = this.formatter.time(new Date(oRapporteModel.getProperty("Zeit/ms")));
						var date_to = this.formatter.UTCTimeToLocale(oRapporteModel.getProperty("DatumTo")).toJSON().slice(0, -1);
						var time_to = this.formatter.time(new Date(oRapporteModel.getProperty("ZeitTo/ms")));
						//var URL = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/TarifeSet(Datum=datetime'" + date + "',Tarifart='',Zeit=time'" + time + "')";
						var oTarifModel = this.getView().getModel("tarifeSet");
						var URL = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/TarifeSSBSet";
						var tarifArt;
						if (oRapporteModel.getProperty("Feiertagszuschlag")) {
							tarifArt = "FR";
						} else if (oRapporteModel.getProperty("Samstagszuschlag")) {
							tarifArt = "SA";
						} else {
							tarifArt = "NO";
						}

						var URL = URL + "?$filter=Tarifart eq '" + tarifArt + "' and DatumVon eq datetime'" + date_from + "' and ZeitVon eq time'" +
							time_from +
							"' and DatumBis eq datetime'" + date_to + "' and ZeitBis eq time'" + time_to + "'";
						// var URL = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/TarifeSSBSet?$filter=DatumVon eq datetime'" + date_from + "' and ZeitVon eq time'" +
						// 	time_from + "' and DatumBis eq datetime'" + date_to + "' and ZeitBis eq time'" + time_to + "'";

						oTarifModel.loadData(URL, true, false);
						this.setModel(oTarifModel, "tarifeSet");
						this._updateSelTarife();
						this._calc();
					},
					_updateTarifeNewDate: function() {
						var oTarifModel = this.getView().getModel("tarifeSet");
						var oContext = this.getView().getBindingContext();

						var date_from = this.formatter.UTCTimeToLocale(oContext.getProperty("Datum")).toJSON().slice(0, -1);
						var time_from = this.formatter.time(new Date(oContext.getProperty("Zeit/ms")));
						var date_to = this.formatter.UTCTimeToLocale(oContext.getProperty("DatumTo")).toJSON().slice(0, -1);
						var time_to = this.formatter.time(new Date(oContext.getProperty("ZeitTo/ms")));

						var URL = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/TarifeSSBSet?$filter=DatumVon eq datetime'" + date_from + "' and ZeitVon eq time'" +
							time_from + "' and DatumBis eq datetime'" + date_to + "' and ZeitBis eq time'" + time_to + "'";

						oTarifModel.loadData(URL, true, false);
						var tarifart = oTarifModel.getProperty("/d/results/0/Tarifart");
						var oRapporteModel = this.getView().getModel();
						switch (tarifart) {
							case 'FR':
								oRapporteModel.setProperty("Feiertagszuschlag", true, oContext);
								oRapporteModel.setProperty("Samstagszuschlag", false, oContext);
								break;
							case 'SA':
								oRapporteModel.setProperty("Samstagszuschlag", true, oContext);
								oRapporteModel.setProperty("Feiertagszuschlag", false, oContext);
								break;
							default:
								oRapporteModel.setProperty("Samstagszuschlag", false, oContext);
								oRapporteModel.setProperty("Feiertagszuschlag", false, oContext);
								break;
						}
						this._calcDateDiffrence();
						this.setModel(oTarifModel, "tarifeSet");
						this._getPegel("Pegel");
						this._getPegel("PegelTo");
					},
					_createSelTarifModel: function() {
						// Model zum Lesen der Tarife erzeugen
						var oSelTarifModel = new JSONModel({
							busy: false,
							delay: 0
						});
						this.setModel(oSelTarifModel, "sel_tarifeSet");
						this._updateSelTarife();
					},
					_updateSelTarife: function() {
						// Ermitteln der Tarife 
						var oRapporteModel = this.getView().getBindingContext();

						var date_from = this.formatter.UTCTimeToLocale(oRapporteModel.getProperty("Datum")).toJSON().slice(0, -1);
						var time_from = this.formatter.time(new Date(oRapporteModel.getProperty("Zeit/ms")));
						var date_to = this.formatter.UTCTimeToLocale(oRapporteModel.getProperty("DatumTo")).toJSON().slice(0, -1);
						var time_to = this.formatter.time(new Date(oRapporteModel.getProperty("ZeitTo/ms")));
						//var URL = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/TarifeSet(Datum=datetime'" + date + "',Tarifart='',Zeit=time'" + time + "')";
						var oSelTarifModel = this.getView().getModel("sel_tarifeSet");
						var URL = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/TarifeSSBSet";
						var tarifArt;
						if (oRapporteModel.getProperty("Feiertagszuschlag")) {
							tarifArt = "FR";
						} else if (oRapporteModel.getProperty("Samstagszuschlag")) {
							tarifArt = "SA";
						} else {
							tarifArt = "NO";
						}

						var SsbTarif = oRapporteModel.getProperty("SsbTarif");

						var URL = URL + "(Tarifart='" + tarifArt + "',SsbTarif='" + SsbTarif + "')";
						// var URL = URL + "?$filter=Tarifart eq '" + tarifArt + "' and DatumVon eq datetime'" + date_from + "' and ZeitVon eq time'" + time_from +
						// 	"' and DatumBis eq datetime'" + date_to + "' and ZeitBis eq time'" + time_to + "'";
						// var URL = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/TarifeSSBSet?$filter=DatumVon eq datetime'" + date_from + "' and ZeitVon eq time'" +
						// 	time_from + "' and DatumBis eq datetime'" + date_to + "' and ZeitBis eq time'" + time_to + "'";

						oSelTarifModel.loadData(URL, true, false);
						this.setModel(oSelTarifModel, "sel_tarifeSet");
						if (SsbTarif === "PAUSCHAL") {
							var oRapporteModel = this.getView().getModel();
							this.getView().getModel("rapportSSBView").setProperty("/pauschalPreis", true);
							else {
								this.getView().getModel("rapportSSBView").setProperty("/pauschalPreis", false);
							}
							this._calc();
						},
						_updateOrte: function() {
								var oOrteModel = this.getView().getModel("orteSet");
								var oContext = this.getView().getBindingContext();
								var oRapporteContext = this.getView().getBindingContext();
								var talfahrt = oRapporteContext.getProperty("Talfahrt");
								var URL = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/OrteSet?$filter=Talfahrt eq " + talfahrt;
								oOrteModel.loadData(URL, true, false);
								this.setModel(oOrteModel, "orteSet");
							},
							_createSchiffsModel: function() {
								// Lesen der Schiffsdaten
								var oSchiff = new JSONModel({
									busy: false,
									delay: 0
								});
								var sSchiffsNummer = this.getView().getBindingContext().getProperty("EniNr");
								var URL = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/SchiffeSet('" + sSchiffsNummer + "')";
								oSchiff.loadData(URL, true, false);
								this.setModel(oSchiff, "Schiff");
							},
							_createDebitorModel: function() {
								// Lesen der Debiorendaten zum Schiff
								var oDebitor = new JSONModel({
									busy: false,
									delay: 0
								});
								var sSchiffsNummer = this.getView().getBindingContext().getProperty("EniNr");
								var sUrlDebi = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/SchiffeSet('" + sSchiffsNummer + "')/Debitoren";
								oDebitor.loadData(sUrlDebi, true, false);
								this.setModel(oDebitor, "Debitor");
							},
							_getBenutzer: function() {
								// Ermitteln des Lotsennamens
								var oBenutzerModel = new JSONModel({
									busy: false,
									delay: 0
								});
								var URL = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/BenutzerSet('1')";
								oBenutzerModel.loadData(URL, true, false);
								this.getView().getModel("rapportSSBView").setProperty("/lotsenname", oBenutzerModel.getProperty("/d/Firstname") + " " +
									oBenutzerModel
									.getProperty("/d/Lastname"));
								this.getView().getModel("rapportSSBView").setProperty("/poweruser", oBenutzerModel.getProperty("/d/Ispoweruser"));
								return oBenutzerModel.getProperty("/d/Firstname") + " " + oBenutzerModel.getProperty("/d/Lastname");
							},
							_destory: function(bSave) {
								// Aufräumen
								var oContext = this.getView().getBindingContext();
								var oRapportModel = this.getView().getModel();
								if (bSave === false && this.getView().getModel("rapportSSBView").getProperty("/newRapport")) {
									oRapportModel.deleteCreatedEntry(oContext);
								}
								oRapportModel.resetChanges();
								oRapportModel.updateBindings();
								this.getView().setModel(oRapportModel);
								this.getView().getModel("tarifeSet").destroy();
								this.getView().getModel("Schiff").destroy();
								this.getView().getModel("sel_tarifeSet").destroy();
								this.getView().getModel("orteSet").destroy();
								//			this.getView().getModel("rapportSSBView").destroy();

								this.getView().unbindElement();
							},
							_resetModel: function(oData) {
								if (this.getView().getModel().hasPendingChanges()) {
									this.getView().getModel().resetChanges();
								}
							},
							_submitSuccess: function(oData) {
								var oViewModel = this.getModel("rapportSSBView");

								oViewModel.setProperty("/newRapport", false);
								var schiffsnr = this.getView().getBindingContext().getProperty("EniNr");
								this._destory(true);
								// alte navigation
								// this.getRouter().navTo("object", {
								// 	objectId: schiffsnr
								// }, true);
								if (oViewModel.getProperty("/reporting") === true) {
									this.getRouter().navTo("showReportingRoute", {}, true);
								} else {
									this.getRouter().navTo("object", {
										objectId: schiffsnr
									}, true);
								}
								sap.m.MessageToast.show("Rapport wurde erfolgreich gespeichert", {
									duration: 30000,
									autoClose: false
								});
							},
							_submitError: function() {
								sap.m.MessageToast.show("Fehler beim speichern des Rapports", {
									duration: 30000,
									autoClose: false
								});
								this._destory(true);
							},
							_logChange: function(sMethod) {
								if (this.getView().getModel().hasPendingChanges() || this.getView().getModel().hasPendingRequests()) {
									jQuery.sap.log.error(sMethod + " " + "Rapport: " + this.getView().getBindingContext().getProperty("Rapportid") + "SchiffNr" +
										this
										.getView().getBindingContext().getProperty("EniNr"));
								};
							},
							/**
							 *@memberOf ch.portof.controller.Rapport
							 */
							onAnnullieren: function() {
								sap.m.MessageBox.confirm("Wollen Sie den Lotsenrapport wirklich annullieren?.", {
									icon: sap.m.MessageBox.Icon.QUESTION,
									title: "Annullation",
									actions: [
										sap.m.MessageBox.Action.YES,
										sap.m.MessageBox.Action.NO
									],
									onClose: jQuery.proxy(function(oAction) {
										if (oAction === sap.m.MessageBox.Action.YES) {
											//This code was generated by the layout editor.
											var oRapportModel = this.getModel();
											var oContext = this.getView().getBindingContext();
											oRapportModel.setProperty("Loevm", true, oContext);
											oRapportModel.setProperty("Zeit", this.formatter.time(new Date(oContext.getProperty("Zeit/ms"))), oContext);
											oRapportModel.submitChanges({
												success: jQuery.proxy(this._submitSuccess, this),
												error: jQuery.proxy(this._submitError, this)
											});
										}
									}, this)
								});
							},
							/**
							 *@memberOf ch.portof.controller.Rapport
							 */
							onResetSelection: function() {
								//This code was generated by the layout editor.
								var oRapporteContext = this.getView().getBindingContext();
								var oRapporteModel = this.getView().getModel();
								var oTarifModel = this.getView().getModel("tarifeSet");
								//this._resetRadioButtons(oRapporteModel, oRapporteContext);
								oRapporteModel.setProperty("SsbTarif", null, oRapporteContext);
								oRapporteModel.setProperty("SsbMenge", null, oRapporteContext);
								//var oSelTarifModel = this.getView().getModel("sel_tarifeSet");
								//oSelTarifModel.destroy();
								//this.setModel(null, "sel_tarifeSet");
								this._updateSelTarife();
								this._calc();
							},
							/**
							 *@memberOf ch.portof.controller.Rapport
							 */
							_setFahrtrichtung: function() {
								var oRapporteContext = this.getView().getBindingContext();
								if (oRapporteContext.getProperty("Talfahrt") === true) {
									this.getView().getModel("rapportSSBView").setProperty("/fahrtrichtung", "Talfahrt");
								} else {
									this.getView().getModel("rapportSSBView").setProperty("/fahrtrichtung", "Bergfahrt");
								}
							},
							/**
							 *@memberOf ch.portof.controller.RapportSSB
							 */
							onChangeTarif: function() {
								this._updateSelTarife();
								// var oTarifModel = this.getView().getModel("tarifeSet");
								// // var url = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/TarifeSSBSet(Tarifart='NO',SsbTarif='HAVARIE')";

								// var url = "/d/results/0/";
								// //var context = oTarifModel.bindContext(url);
								//  var context3 = new sap.ui.model.Context(oTarifModel, "/d/results/0/");
								//  context3.getProperty("Preis");

								// var context2 = oTarifModel.createBindingContext("/TarifeSSBSet(Tarifart='NO',SsbTarif='HAVARIE')");
								// context2.getProperty("/d/results/0/Preis");

								/*var oContext = this.getView().getBindingContext();

								var date_from = this.formatter.UTCTimeToLocale(oContext.getProperty("Datum")).toJSON().slice(0, -1);
								var time_from = this.formatter.time(new Date(oContext.getProperty("Zeit/ms")));
								var date_to = this.formatter.UTCTimeToLocale(oContext.getProperty("DatumTo")).toJSON().slice(0, -1);
								var time_to = this.formatter.time(new Date(oContext.getProperty("ZeitTo/ms")));

								var URL = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/TarifeSSBSet(Datum=datetime'" + date + "',Tarifart='',Zeit=time'" + time + "')";

								var URL = "/sap/opu/odata/sap/ZLOTSENAPP2_SRV/TarifeSSBSet?$filter=DatumVon eq datetime'" + date_from + "' and ZeitVon eq time'" +
									time_to + "' and DatumBis eq datetime'" + date_to + "' and ZeitBis eq time'" + time_to + "'";

								oTarifModel.loadData(URL, true, false);
								var tarifart = oTarifModel.getProperty("/d/results/0/Tarifart");*/

								// this.setModel(oTarifModel, "tarifeSet");
								// this.setModel(context3, "tarifContext");
							},
							/**
							 *@memberOf ch.portof.controller.RapportSSB
							 */
							onChangeOrt: function() {
								//This code was generated by the layout editor.
							}
					});
			});