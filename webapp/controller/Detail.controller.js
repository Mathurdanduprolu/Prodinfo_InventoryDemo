/*global location */
sap.ui.define([
		"z/stock/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"z/stock/model/formatter",
		"sap/viz/ui5/data/FlattenedDataset",
		"sap/viz/ui5/controls/common/feeds/FeedItem"
	], function (BaseController, JSONModel, formatter, FlattenedDataset, FeedItem) {
		"use strict";

		return BaseController.extend("z.stock.controller.Detail", {

			formatter: formatter,

			/* =========================================================== */
			/* lifecycle methods                                           */
			/* =========================================================== */

			onInit : function () {
				// Model used to manipulate control states. The chosen values make sure,
				// detail page is busy indication immediately so there is no break in
				// between the busy indication for loading the view's meta data
				var oViewModel = new JSONModel({
					busy : false,
					delay : 0,
					lineItemListTitle : this.getResourceBundle().getText("detailLineItemTableHeading")
				});

				this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

				this.setModel(oViewModel, "detailView");

				this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
			},

			/* =========================================================== */
			/* event handlers                                              */
			/* =========================================================== */

			/**
			 * Event handler when the share by E-Mail button has been clicked
			 * @public
			 */
			onShareEmailPress : function () {
				var oViewModel = this.getModel("detailView");

				sap.m.URLHelper.triggerEmail(
					null,
					oViewModel.getProperty("/shareSendEmailSubject"),
					oViewModel.getProperty("/shareSendEmailMessage")
				);
			},


			/**
			 * Updates the item count within the line item table's header
			 * @param {object} oEvent an event containing the total number of items in the list
			 * @private
			 */
			onListUpdateFinished : function (oEvent) {
				var sTitle,
					iTotalItems = oEvent.getParameter("total"),
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
			_onObjectMatched : function (oEvent) {
				var sMaterialId = oEvent.getParameter("arguments").objectId;
				var oDataModel = this.getOwnerComponent().getModel();
				var materialModel = new JSONModel();
				var actualStockModel = new JSONModel();
				var oViewModel = this.getModel("detailView");
				
				//Set busy indicator during view binding
				oViewModel.setProperty("/busy",false);
				
				var oFilters = [
				new sap.ui.model.Filter("Matnr",
					sap.ui.model.FilterOperator.EQ,
					sMaterialId)
			];
				
				var mParameters = {
				//	filters: oFilters,
					urlParameters:{
						"$expand": "MaterialToActualStock"
					},
					success: function(oData){
						console.log(oData);
						materialModel.setData(oData);
						this.setModel(materialModel,"MatModel");
						var json = {};
						json.items = oData.MaterialToActualStock.results;
						console.log("Items:",oData.MaterialToActualStock.results);
					/*	materialModel.setData(oData.results[0]);
						this.setModel(materialModel,"MatModel");
						var json = {};
						json.items = oData.results[0].MaterialToActualStock.results;
						console.log("Items:",oData.results[0].MaterialToActualStock.results);*/
						actualStockModel.setData(json);
						console.log("json: ",json);
					var oVizFrame = this.byId("vizFrameId");
					oVizFrame.setModel(actualStockModel, "actualStockModel");
					oVizFrame.setVizProperties({
						title: {
							text: "Stock Information"
						},
						plotArea: {
							colorPalette: "sapUiChartPaletteSequentialHue1Light1"//,
						//	drawingEffect: "glossy"
						}
					});
					var oDataSet = new FlattenedDataset({
						dimensions: [
							new sap.viz.ui5.data.DimensionDefinition({
								name: "Werks",
								value: "{actualStockModel>Werks}"
							})
						],
						measures: [
							new sap.viz.ui5.data.MeasureDefinition({
								name: "Labst",
								value: "{actualStockModel>Labst}"
							})

						],
						data: {
							path: "actualStockModel>/items"
						}
					});
					var oFeedItemValueAxis1 = new FeedItem({
						"uid": "valueAxis",
						"type": "Measure",
						"values": ["Labst"]
					});

					var oFeedItemCategoryAxis = new FeedItem({
						"uid": "categoryAxis",
						"type": "Dimension",
						"values": ["Werks"]
					});
					oVizFrame.destroyFeeds();
					oVizFrame.setDataset(oDataSet);
					oVizFrame.addFeed(oFeedItemValueAxis1);
					oVizFrame.addFeed(oFeedItemCategoryAxis);
						
					}.bind(this),
					error: function(){
						
					}
				};
				
				oDataModel.read("/MaterailsSet('MZ-FG-M500')?",mParameters);
				oDataModel.attachRequestSent(function(){
					oViewModel.setProperty("/busy",true);	
				});
				oDataModel.attachRequestCompleted(function() {
					oViewModel.setProperty("/busy", false);
				});
				oDataModel.setRefreshAfterChange(true);
				
				/*var sObjectId =  oEvent.getParameter("arguments").objectId;
				this.getModel().metadataLoaded().then( function() {
					var sObjectPath = this.getModel().createKey("MaterailsSet", {
						Matnr :  sObjectId
					});
					this._bindView("/" + sObjectPath);
				}.bind(this));*/
			},

			/**
			 * Binds the view to the object path. Makes sure that detail view displays
			 * a busy indicator while data for the corresponding element binding is loaded.
			 * @function
			 * @param {string} sObjectPath path to the object to be bound to the view.
			 * @private
			 */
			_bindView : function (sObjectPath) {
				// Set busy indicator during view binding
				var oViewModel = this.getModel("detailView");

				// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
				oViewModel.setProperty("/busy", false);

				this.getView().bindElement({
					path : sObjectPath,
					urlParameters: {
						"$expand": "MaterailsSet/MaterialToActualStock"
					},
					events: {
						change : this._onBindingChange.bind(this),
						dataRequested : function () {
							oViewModel.setProperty("/busy", true);
						},
						dataReceived: function () {
							oViewModel.setProperty("/busy", false);
						}
					}
				});
			},

			_onBindingChange : function () {
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
					sObjectId = oObject.Matnr,
					sObjectName = oObject.Matnr,
					oViewModel = this.getModel("detailView");

				this.getOwnerComponent().oListSelector.selectAListItem(sPath);

				oViewModel.setProperty("/shareSendEmailSubject",
					oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
				oViewModel.setProperty("/shareSendEmailMessage",
					oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
			},

			_onMetadataLoaded : function () {
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
			}

		});

	}
);