/****************************************************
*  ---  report
*/
app.report = (function (obj) {
	// private scope (internal to app.report obj ?!)
	var configs; 
	
	// public scope - list methods here
	obj.render	= render;
    obj.formatRadarDate = formatRadarDate;
    obj.checkDates = checkDates;
    obj.getDateReport = getDateReport;

	init();
	return obj;

	// implementation
	function init() {		
		app.get([
		    'app/report/report-config.js'
		 ], 
		function (files) {
			for (var i in files) eval(files[i]);
		});
		render(); 	
	}

	function render() {	
		w2ui['app_layout'].content('right', 
			'<div style="text-align: center; margin-top: 100px; color: #888; font-size: 16px;">Please Execute a Report... </div>');
		// timer for UX 
		setTimeout(function () {  
			// show results panel by default  
			w2ui['app_layout'].show('right', true);

			w2ui['app_layout'].load('main', 'app/report/date-report.html', null, function() {
				//make input fields into w2ui date fields 			
				$('#date-report #date-start').w2field('date');
				$('#date-report #date-end').w2field('date');
			
				// handle reset btn event
				$('#date-report #reset-btn').on('click', function(){
					w2ui['app_layout'].show('right', true); 
				});	

				// handle run report btn event
				$('#date-report #execute-btn').on('click', function(){
					// capture user input
					var dateStart = $('#date-report #date-start').val();
					var dateEnd = $('#date-report #date-end').val();
					var reportType = $('input[name=report-type]:checked').val();

					// form validatation
					if (!dateStart) {
						app.utils.tag($('#date-report #date-start'), 'Required Field'); 
						return;
					}	
					if (!dateEnd) { 
						app.utils.tag($('#date-report #date-end'), 'Required Field'); 
						return;
					}
					if (!checkDates(dateStart, dateEnd)) { 
						$('#date-report #date_end').val('');
						app.utils.tag($('#date-report #date-end'), 'End Date should be after Start Date');
						return;
					}
					getDateReport(reportType, dateStart, dateEnd);
				}); 
			}) 				
		}, 1); 
	}

	function getDateReport(reportType, dateStart, dateEnd) {
		w2ui['app_layout'].show('right', true);
		w2ui['app_layout'].content('right', 
			'<div style="text-align: center; margin-top: 100px; color: #888; font-size: 16px;"><div class="w2ui-spinner" style="display:inline-block; width:20px; height:20px; margin-top:5px;"></div> Loading...</div>'); 

		// format dateString for radar query
		var radarStartDate = formatRadarDate(dateStart);
		var radarEndDate = formatRadarDate(dateEnd);
      
		var reportQuery = {};			

		// reportQuery for Radars Created
		if (reportType === 'created') { 
			reportQuery = { 
				"component": { "name": app.config.component },
				"createdAt": { 
					"gte": radarStartDate, 
					"lte": radarEndDate  
				}	
			}
		// reportQuery for Radars Resolved	
		// v1.0 uses state == Verify and lastModified betw dates
		// better impl would be to use history object and timestamp for when it actually changed state to Verify
		} else if (reportType === 'resolved') {  			
			reportQuery = {
				"component": { "name": app.config.component },
     			"state": "Verify",
     			"lastModifiedAt": {
	 				"gte": radarStartDate, 
 					"lte": radarEndDate  
	  			}     
			}
		// reportQuery for Radars Modified	
		} else if (reportType === 'modified') {
			reportQuery = {
				"component": { "name": app.config.component },
     			"lastModifiedAt": {
	 				"gte": radarStartDate, 
 					"lte": radarEndDate  
	  			}
	  		}
		}	
		
		// execute the query 
		app.radarWS.find( reportQuery, function (reportResultObj) { 
			console.log('queryReport came back with...',reportResultObj);

			w2ui['app_layout'].load('right', 'app/report/date-report-results.html', null, function() {  	

				// populate report header fields	
				$('#date-report-results #radar-count').html(reportResultObj.length);
				$('#date-report-results #start-date').html(app.utils.formatDate(dateStart));
				$('#date-report-results #end-date').html(app.utils.formatDate(dateEnd));
				$('#date-report-results #report-type').html(reportType);
	
        		// priority vars
				var p1Count = 0; 
				var p2Count = 0;
				var p3Count = 0;
				var p4Count = 0;
				var p5Count = 0;
				var p6Count = 0;

				var p1SummaryItems = [];
				var p2SummaryItems = [];
				var p3SummaryItems = [];
				var p4SummaryItems = [];
				var p5SummaryItems = [];
				var p6SummaryItems = [];
	
				var priorityEmailHtml = '';
        		var priorityEmailBody = '';
        		var priorityPopupBody = '';

        		// loop thru reportResultObj
     			for (var r in reportResultObj) {
					var rec = reportResultObj[r];
					
					// count up priority values and populate the summary items arrays
					switch (rec.priority) {
						case 1: 
							p1Count += 1;
							p1SummaryItems.push('rdar://' + rec.id + ' - ' + rec.title);	
							break;
						case 2: 
							p2Count += 1;	
							p2SummaryItems.push('rdar://' + rec.id + ' - ' + rec.title);
							break;
						case 3: 
							p3Count += 1;
							p3SummaryItems.push('rdar://' + rec.id + ' - ' + rec.title);						
							break;
						case 4: 
							p4Count += 1;
							p4SummaryItems.push('rdar://' + rec.id + ' - ' + rec.title);	
							break;
						case 5: 
							p5Count += 1;
							p5SummaryItems.push('rdar://' + rec.id + ' - ' + rec.title);	
							break;
						case 6: 
							p6Count += 1;
							p6SummaryItems.push('rdar://' + rec. id + ' - ' + rec.title);	
							break;
					}

    			}

				// build priorityEmailBody text string + priorityPopupBody html string
				if (p1SummaryItems.length > 0 ) {
					priorityEmailBody += 'P1: (' + p1Count + ')%0D';
					priorityPopupBody += '<div class="report-head">P1: (' + p1Count + ')</div>';
					for (var i = 0; i < p1SummaryItems.length; i++){
			  			priorityEmailBody += p1SummaryItems[i] + '%0D';
			  			priorityPopupBody += '<div class="report-line">' + String(p1SummaryItems[i]).replace(/(rdar:\/\/[0-9]*)/i, '<a href="$1">$1</a>') + '</div>'; 
					}
					priorityEmailBody += '%0D';  
					priorityPopupBody += '<br />';  
				}
				if (p2SummaryItems.length > 0 ) {
					priorityEmailBody += 'P2: (' + p2Count + ')%0D';
					priorityPopupBody += '<div class="report-head">P2: (' + p2Count + ')</div>';
					for (var i = 0; i < p2SummaryItems.length; i++){
			  			priorityEmailBody += p2SummaryItems[i] + '%0D'; 
			  			priorityPopupBody += '<div class="report-line">' + String(p2SummaryItems[i]).replace(/(rdar:\/\/[0-9]*)/i, "<a href='$1'>$1</a>") + '</div>';
					}
					priorityEmailBody += '%0D'; 
					priorityPopupBody += '<br />'; 
				}
				if (p3SummaryItems.length > 0 ) {
					priorityEmailBody += 'P3: (' + p3Count + ')%0D';
					priorityPopupBody += '<div class="report-head">P3: (' + p3Count + ')</div>';
					for (var i = 0; i < p3SummaryItems.length; i++){
			  			priorityEmailBody += p3SummaryItems[i] + '%0D'; 
			  			priorityPopupBody += '<div class="report-line">' + String(p3SummaryItems[i]).replace(/(rdar:\/\/[0-9]*)/i, "<a href='$1'>$1</a>") + '</div>';
					}
					priorityEmailBody += '%0D'; 
					priorityPopupBody += '<br />'; 
				}
				if (p4SummaryItems.length > 0 ) {
					priorityEmailBody += 'P4: (' + p4Count + ')%0D';
					priorityPopupBody += '<div class="report-head">P4: (' + p4Count + ')</div>';
					for (var i = 0; i < p4SummaryItems.length; i++){
			  			priorityEmailBody += p4SummaryItems[i] + '%0D'; 
			  			priorityPopupBody += '<div class="report-line">' + String(p4SummaryItems[i]).replace(/(rdar:\/\/[0-9]*)/i, "<a href='$1'>$1</a>") + '</div>';
					}
					priorityEmailBody += '%0D'; 
					priorityPopupBody += '<br />';
				}
				if (p5SummaryItems.length > 0 ) {
					priorityEmailBody += 'P5: (' + p5Count + ')%0D';
					priorityPopupBody += '<div class="report-head">P5: (' + p5Count + ')</div>';
					for (var i = 0; i < p5SummaryItems.length; i++){
			  			priorityEmailBody += p5SummaryItems[i] + '%0D'; 
			  			priorityPopupBody += '<div class="report-line">' + String(p5SummaryItems[i]).replace(/(rdar:\/\/[0-9]*)/i, "<a href='$1'>$1</a>") + '</div>';
					}
					priorityEmailBody += '%0D'; 
					priorityPopupBody += '<br />'; 
				}
				if (p6SummaryItems.length > 0 ) {
					priorityEmailBody += 'P6: (' + p6Count + ')%0D';
					priorityPopupBody += '<div class="report-head">P6: (' + p6Count + ')</div>';
					for (var i = 0; i < p6SummaryItems.length; i++){
			 			priorityEmailBody += p6SummaryItems[i] + '%0D';
			  			priorityPopupBody += '<div class="report-line">' + String(p6SummaryItems[i]).replace(/(rdar:\/\/[0-9]*)/i, "<a href='$1'>$1</a>") + '</div>'; 
					}
					priorityEmailBody += '%0D'; 
					priorityPopupBody += '<br />'; 
				}	

 				// set priority values							
				$('#date-report-results #p1-count').html(p1Count);
				$('#date-report-results #p2-count').html(p2Count);
				$('#date-report-results #p3-count').html(p3Count);
				$('#date-report-results #p4-count').html(p4Count);
				$('#date-report-results #p5-count').html(p5Count);
				$('#date-report-results #p6-count').html(p6Count);


				// priority chart
				var data 	= {
					labels : ["P1", "P2", "P3", "P4", "P5"],
					datasets : [
						{
							fillColor : "rgba(151,187,205,0.5)",
							strokeColor : "rgba(151,187,205,1)",
							pointColor : "rgba(151,187,205,1)",
							pointStrokeColor : "#fff",
							data : [p1Count, p2Count, p3Count, p4Count, p5Count]
						}
					]
				};
			
				var data2 = [
					{ value: p1Count, color: 'red' },
					{ value: p2Count, color: 'orange' },
					{ value: p3Count, color: 'green' },
					{ value: p4Count, color: 'silver' },
					{ value: p5Count, color: 'gray' }
				];
			
				var options = {
					animation : false,
					barDatasetSpacing : 5,
					barValueSpacing: 10
				};
			
				// render the chart
				new Chart($("#priority-chart").get(0).getContext("2d")).Bar(data, options);




				// priority popup
				$('#date-report-results #priority-popup-btn').click(function(){
					$().w2popup('open',{
						title: 'Date Period Radar Priority Report',
						body: '<link rel="stylesheet" type="text/css" href="app/report/report.css"/>' +
							  '<style> '+
							  '		.report-head { font-size: 12px !important; font-weight: bold; padding: 3px; margin-bottom: 5px; border-bottom: 1px solid silver; background-color: #ddd} '+
						 	  '		.report-line { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0px 3px; line-height: 165%; } '+
						  	  '</style>'+
							  '<div id="date-report-results-popup" class="section-wrapper clearfix">' +
							   		'<div class="subtitle">' +
			                  			'date range: <span id="start-date" class="data-point">' + 
			                  			app.utils.formatDate(dateStart) +
			                  			'</span> to <span id="end-date" class="data-point">' + 
			                  			app.utils.formatDate(dateEnd) + 
			                  			'</span><br /> results: <span id="radar-count" class="data-point">' + 
			                  			reportResultObj.length + 
			                  			' </span> radars <span id="report-type">' + 
			                  			reportType + 
			                  			'</span>' +
							  		'</div>' +
							  '</div>' +
						  	  '<div>' + 
							  priorityPopupBody +
						  	  '</div>',
					buttons:  '<input type="button" value="Ok" onclick="$().w2popup(\'close\')" style="width: 80px">',
					width: 800,
					height: 600,
					overflow:'auto',
					modal: true,
					showClose: true,
					showMax: true
					});
				});

                var emailDateStart = app.utils.formatDate(dateStart); 

				// priority email report
				priorityEmailHtml += '<a href="mailto:?subject=Date Period Radar Priority Report&body=' +
				                    'Date Range: ' + 
									dateStart + 
									' to ' +
									dateEnd + 
									'%0D' +
									'Results: ' +
									reportResultObj.length + 
									' radars ' + 
									reportType + 
									'%0D%0D' +
									 priorityEmailBody.replace(/"/g, "&quot;") + 
									 ' ">' +
								     '<input type="button" id="priority-email-btn" value="Email" /></a>';  
				// insert email link into the results page
				$('#date-report-results #priority-email').html(priorityEmailHtml);


			});	// load			
		}); // find
	}; // getDateReport

	function checkDates(startDate,endDate){
		var d1 = Date.parse(startDate);
		var d2 = Date.parse(endDate);
		if (d1 > d2) {
			return false;	
		} else {
			return true;
		}
	}
	
	function formatRadarDate(dateString) {
		var dateStringMS =  Date.parse(dateString); // returns milliseconds since 1-1-1970 
		var dateStringDate = new Date(dateStringMS);
		var radarDate = dateStringDate.toISOString().slice(0,10).replace(/-/g,"-");
		return radarDate;
	} 

}) (app.report || {});