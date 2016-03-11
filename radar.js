/****************************************************
*  ---  radar 
*/

app.radar = (function (obj) {
	// private scope
	var configs;
	var model;
	
	// public scope
	obj.showPreview	= showPreview;
	obj.hidePreview = hidePreview;
	obj.preview 	= preview;
	obj.summary 	= summary;
	obj.render		= render;

	init();
	return obj;

	// implementation
	function init() {		
		app.get([
		    'app/radar/radar-config.js'
		    //'app/radar/radar-model.js'
		 ], 
		function (files) {
			for (var i in files) eval(files[i]);
			// init application UI
			$().w2grid(configs.radarGrid); 
			//render(); 
		});
	}

	function render() {
		$.w2ui['app_layout'].content('main', '<div style="text-align: center; margin-top: 100px; color: #888; font-size: 16px;"> Loading... </div>');
		// timer is necessary here for better user experience
		setTimeout(function () {         
			$.w2ui['app_layout'].content('main', $.w2ui['radarGrid']); // just includes the [empty] grid inside the main container 
			$.w2ui['radarGrid'].getRadars();
		}, 1);
		// hide preview as part of re-render as default UI
		$.w2ui['app_layout'].hide('right', true);

		// 	
		// populate milestone dropdown in sidebar
		// var milestoneMenu = '';
		// milestoneMenu += '<select id="milestone-menu" style="width:100px; font-size:10px;">';
		// milestoneMenu += '<option value="-1">Select Milestone...</option>';
		// for (var m in app.radarWS.config.milestones) {
		// 	var ms = app.radarWS.config.milestones[m];
		// 	if (ms.isClosed) continue;
		// 	milestoneMenu += '<option value="' + ms.name + '">' + ms.name + '</option>';
		// }
		// milestoneMenu += '</select>';
		// $.w2ui['app_sidebar'].set('milestones', {text: milestoneMenu });
		// // select the default milestone from config 
		// setTimeout(function () {
		// 	$('#app-sidebar #milestone-menu').val(app.radarWS.config.default.milestone);
		// }, 2500);
        
      
	}

	function showPreview() {
		$.w2ui['app_layout'].show('right', true);
		// if a record selected show preview
		var grid = $.w2ui['radarGrid'];
		if (grid.getSelection().length == 0) {
			$.w2ui['app_layout'].content('right', '<div style="color: #888; font-size: 14px; text-align: center; padding-top: 40px">Please Select a Radar</div>');
		} else  if (grid.getSelection().length == 1) {
			app.radar.preview.call(grid, grid.name, { recid: grid.getSelection()[0] });
		} else {
			app.radar.summary.call(grid, grid.name, data);
		}
	}

	function hidePreview() {
		$.w2ui['app_layout'].hide('right', true);
	}
 
	function preview(target, data) {
		var rec = $.w2ui['radarGrid'].get(data.recid); // gets a full record, based on the recid  
		var lastModDate = rec.lastModifiedAt.substring(0,10);
		$.w2ui['app_layout'].load('right', 'app/radar/radar-view.html', null, function() {
			// populate radar preview fields
			$('#radar-preview #radar-id').html('&nbsp;<a href="rdar://' + rec.id + '">#' + rec.id + '</a>');
			$('#radar-preview #radar-title').val(rec.title);
			$('#radar-preview #radar-component-name').val(rec.component.name);
			$('#radar-preview #radar-component-version').val(rec.component.version);
			$('#radar-preview #radar-assignee').val(rec.assignee.lastName + ', ' + rec.assignee.firstName);
			$('#radar-preview #radar-dsid').val(rec.assignee.dsid);
			$('#radar-preview #radar-lastmod').html(lastModDate);
			$('#radar-preview #radar-state').val(rec.state);
			$('#radar-preview #radar-substate').val(rec.substate);
			$('#radar-preview #radar-resolution').val(rec.resolution);
			$('#radar-preview #radar-reproducible').val(rec.reproducible);
			$('#radar-preview #radar-classification').val(rec.classification);
			$('#radar-preview #radar-priority').val(rec.priority);
			
			// populate options for milestones
			var options = '';
			for (var m in app.radarWS.config.milestones) {
				var ms = app.radarWS.config.milestones[m];
				if (ms.isClosed) continue;
				options += '<option value="' + ms.name + '">' + ms.name + '</option>';
			}
			$('#radar-preview #radar-milestone').html(options);
			// now populate milestones field
			$('#radar-preview #radar-milestone').val(rec.milestone.name);
			
			// need timer to allow to render
			setTimeout(function () {
				if (typeof rec.description == 'undefined') {
					$('#radar-preview .title .progress img').show();
					app.radarWS.get(rec.id, function(detailObj) {
						$('#radar-preview .title .progress img').hide();
						rec.description          = detailObj.description;
						rec.diagnosis            = detailObj.diagnosis;
						rec.keywords             = detailObj.keywords;
						rec.relatedProblems      = detailObj.relatedProblems;
						rec.relatedProblemsCount = detailObj.relatedProblemsCount; 
						renderComments(rec);
					});
				} else {
					renderComments(rec);
				}

				function renderComments(rec) {
					// only show comments if it is correct radar
					if ($.trim($('#radar-preview #radar-id').text()).substr(1) != rec.id) {
						return;
					}
		            // description
		            var html = '';
		            for (var d in rec.description) {
		            	var desc = rec.description[d];
		            	if (desc.addedAt == null) continue;
		            	html +=  '<div class="comment">' +
								'	<div class="com-image"><img src="app/main/images/people/'+ app.radarWS.config.emails[desc.addedBy.email] +'.png"></img></div>' +
								'	<div class="com-msg">' +
										desc.text.replace(/\n/g, '<br>') +
								'		<div class="com-legend">'+ app.utils.age(desc.addedAt) +
								'			<span><a href="emailto:' + desc.addedBy.email + '" style="color: inherit">' + desc.addedBy.name + '</a></span>'+
								'		</div>' +
								'	</div>' +
								'</div>';
		            }
		            $('#radar-preview #radar-description').html(html);
		            
		            // diagnosis
		            var html = '';
		            for (var d in rec.diagnosis) {
		            	var desc = rec.diagnosis[d];
		            	if (desc.addedAt == null) continue;
		            	html +=  '<div class="comment">' +
								'	<div class="com-image"><img src="app/main/images/people/'+ app.radarWS.config.emails[desc.addedBy.email] +'.png"></img></div>' +
								'	<div class="com-msg">' +
										desc.text.replace(/\n/g, '<br>') +
								'		<div class="com-legend">'+ app.utils.age(desc.addedAt) +
								'			<span><a href="emailto:' + desc.addedBy.email + '" style="color: inherit">' + desc.addedBy.name + '</a></span>'+
								'		</div>' +
								'	</div>' +
								'</div>';
		            }
		            $('#radar-preview #radar-diagnosis').html(html);

		            // keywords
		            var khtml = '';
					for (var k in rec.keywords) {
						var kw = rec.keywords[k];
						if (khtml != '') khtml += ', '; // prepend items with comma to avoid comma after last entry
						khtml += kw.keyword.name;
					}
					if (khtml == '') khtml = 'None';
					$('#radar-preview #radar-keywords').val(khtml);

					// related problems
					var phtml = '(' + rec.relatedProblemsCount + ') : ';
					for (var p in rec.relatedProblems) {
						var rp = rec.relatedProblems[p];
						if (phtml !== '(' + rec.relatedProblemsCount + ') : ') phtml += ', ';
						phtml += rp.problem.id;
					}
					if (phtml === '(' + rec.relatedProblemsCount + ') : ') phtml = 'None';
					$('#radar-preview #radar-related-probs').val(phtml);

				}
			}, 1);
		});
		
	}

	function summary () {
				
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
	
        var priorityEmailBody = '';
        var priorityPopupBody = '';
        var priorityEmailHtml = '';

        // state vars
        var stateNewCount = 0;
		var stateAnalyzeCount = 0;
        var stateIntegrateCount = 0;
        var stateBuildCount = 0;
        var stateVerifyCount = 0;
        var stateClosedCount = 0;

    	var stateNewSummaryItems = [];
    	var stateAnalyzeSummaryItems = [];
    	var stateIntegrateSummaryItems = [];
    	var stateBuildSummaryItems = [];
    	var stateVerifySummaryItems = [];
    	var stateClosedSummaryItems = [];

    	var stateEmailBody = '';
    	var statePopupBody = '';
    	var stateEmailHtml = '';

		var sel = this.getSelection();
		for (var s in sel) {
			var rec = this.get(sel[s]);
			
			// count up priority values and populate the summary items arrays
			switch (rec.priority) {
				case 1: 
					p1Count += 1;
					p1SummaryItems.push('rdar://' + rec.recid + ' - ' + rec.title);	
					break;
				case 2: 
					p2Count += 1;	
					p2SummaryItems.push('rdar://' + rec.recid + ' - ' + rec.title);
					break;
				case 3: 
					p3Count += 1;
					p3SummaryItems.push('rdar://' + rec.recid + ' - ' + rec.title);						
					break;
				case 4: 
					p4Count += 1;
					p4SummaryItems.push('rdar://' + rec.recid + ' - ' + rec.title);	
					break;
				case 5: 
					p5Count += 1;
					p5SummaryItems.push('rdar://' + rec.recid + ' - ' + rec.title);	
					break;
				case 6: 
					p6Count += 1;
					p6SummaryItems.push('rdar://' + rec.recid + ' - ' + rec.title);	
					break;
			}

			// count up state values and populate the summary items arrays
			switch (rec.state) {
				case 'New Prob.': 
					stateNewCount += 1;
					stateNewSummaryItems.push('rdar://' + rec.recid + ' - ' + rec.title);	
					break;
				case 'Analyze': 
					stateAnalyzeCount += 1;	
					stateAnalyzeSummaryItems.push('rdar://' + rec.recid + ' - ' + rec.title);
					break;
				case 'Integrate': 
					stateIntegrateCount += 1;
					stateIntegrateSummaryItems.push('rdar://' + rec.recid + ' - ' + rec.title);						
					break;
				case 'Build': 
					stateBuildCount += 1;
					stateBuildSummaryItems.push('rdar://' + rec.recid + ' - ' + rec.title);	
					break;
				case 'Verify': 
					stateVerifyCount += 1;
					stateVerifySummaryItems.push('rdar://' + rec.recid + ' - ' + rec.title);	
					break;
				case 'Closed': 
					stateClosedCount += 1;
					stateClosedSummaryItems.push('rdar://' + rec.recid + ' - ' + rec.title);	
					break;
			}
		}
		
		// build priorityEmailBody text string + priorityPopupBody html string  
		if (p1SummaryItems.length > 0 ) {
			priorityEmailBody += 'P1: (' + p1Count + ')%0D';
			priorityPopupBody += 'P1: (' + p1Count + ')<br />';
			for (var i = 0; i < p1SummaryItems.length; i++){
			  	priorityEmailBody += p1SummaryItems[i] + '%0D';
			  	priorityPopupBody += p1SummaryItems[i] + '<br />'; 
			}
			priorityEmailBody += '%0D';  
			priorityPopupBody += '<br />';  
		}
		if (p2SummaryItems.length > 0 ) {
			priorityEmailBody += 'P2: (' + p2Count + ')%0D';
			priorityPopupBody += 'P2: (' + p2Count + ')<br />';
			for (var i = 0; i < p2SummaryItems.length; i++){
			  priorityEmailBody += p2SummaryItems[i] + '%0D'; 
			  priorityPopupBody += p2SummaryItems[i] + '<br />';
			}
			priorityEmailBody += '%0D'; 
			priorityPopupBody += '<br />'; 
		}
		if (p3SummaryItems.length > 0 ) {
			priorityEmailBody += 'P3: (' + p3Count + ')%0D';
			priorityPopupBody += 'P3: (' + p3Count + ')<br />';
			for (var i = 0; i < p3SummaryItems.length; i++){
			  priorityEmailBody += p3SummaryItems[i] + '%0D'; 
			  priorityPopupBody += p3SummaryItems[i] + '<br />';
			}
			priorityEmailBody += '%0D'; 
			priorityPopupBody += '<br />'; 
		}
		if (p4SummaryItems.length > 0 ) {
			priorityEmailBody += 'P4: (' + p4Count + ')%0D';
			priorityPopupBody += 'P4: (' + p4Count + ')<br />';
			for (var i = 0; i < p4SummaryItems.length; i++){
			  priorityEmailBody += p4SummaryItems[i] + '%0D'; 
			  priorityPopupBody += p4SummaryItems[i] + '<br />';
			}
			priorityEmailBody += '%0D'; 
			priorityPopupBody += '<br />';
		}
		if (p5SummaryItems.length > 0 ) {
			priorityEmailBody += 'P5: (' + p5Count + ')%0D';
			priorityPopupBody += 'P5: (' + p5Count + ')<br />';
			for (var i = 0; i < p5SummaryItems.length; i++){
			  priorityEmailBody += p5SummaryItems[i] + '%0D'; 
			  priorityPopupBody += p5SummaryItems[i] + '<br />';
			}
			priorityEmailBody += '%0D'; 
			priorityPopupBody += '<br />'; 
		}
		if (p6SummaryItems.length > 0 ) {
			priorityEmailBody += 'P6: (' + p6Count + ')%0D';
			priorityPopupBody += 'P6: (' + p6Count + ')<br />';
			for (var i = 0; i < p6SummaryItems.length; i++){
			  priorityEmailBody += p6SummaryItems[i] + '%0D';
			  priorityPopupBody += p6SummaryItems[i] + '<br />'; 
			}
			priorityEmailBody += '%0D'; 
			priorityPopupBody += '<br />'; 
		}

		// build stateEmailBody text string + statePopupBody html string 
		if (stateNewSummaryItems.length > 0 ) {
			stateEmailBody += 'New Prob: (' + stateNewCount + ')%0D';
			statePopupBody += 'New Prob: (' + stateNewCount + ')<br />';
			for (var i = 0; i < stateNewSummaryItems.length; i++){
			  	stateEmailBody += stateNewSummaryItems[i] + '%0D';
			 	statePopupBody += stateNewSummaryItems[i] + '<br />';
			}
			stateEmailBody += '%0D'; 
			statePopupBody += '<br />'; 	
		}
		if (stateAnalyzeSummaryItems.length > 0 ) {
			stateEmailBody += 'Analyze: (' + stateAnalyzeCount + ')%0D';
			statePopupBody += 'Analyze: (' + stateAnalyzeCount + ')<br />';
			for (var i = 0; i < stateAnalyzeSummaryItems.length; i++){
			  	stateEmailBody += stateAnalyzeSummaryItems[i] + '%0D'; 
				statePopupBody += stateAnalyzeSummaryItems[i] + '<br />'; 
			}
			stateEmailBody += '%0D';  
			statePopupBody += '<br />';
		}
		if (stateIntegrateSummaryItems.length > 0 ) {
			stateEmailBody += 'Integrate: (' + stateIntegrateCount + ')%0D';
			statePopupBody += 'Integrate: (' + stateIntegrateCount + ')<br />';
			for (var i = 0; i < stateIntegrateSummaryItems.length; i++){
			  	stateEmailBody += stateIntegrateSummaryItems[i] + '%0D'; 
			  	statePopupBody += stateIntegrateSummaryItems[i] + '<br />'; 
			}
			stateEmailBody += '%0D';  
			statePopupBody += '<br />';
		}
		if (stateBuildSummaryItems.length > 0 ) {
			stateEmailBody += 'Build: (' + stateBuildCount + ')%0D';
			statePopupBody += 'Build: (' + stateBuildCount + ')<br />';
			for (var i = 0; i < stateBuildSummaryItems.length; i++){
			  	stateEmailBody += stateBuildSummaryItems[i] + '%0D'; 
			  	statePopupBody += stateBuildSummaryItems[i] + '<br />';
			}
			stateEmailBody += '%0D';  
			statePopupBody += '<br />';
		}
		if (stateVerifySummaryItems.length > 0 ) {
			stateEmailBody += 'Verify: (' + stateVerifyCount + ')%0D';
			statePopupBody += 'Verify: (' + stateVerifyCount + ')<br />';			
			for (var i = 0; i < stateVerifySummaryItems.length; i++){
			  	stateEmailBody += stateVerifySummaryItems[i] + '%0D';
				statePopupBody += stateVerifySummaryItems[i] + '<br />';
			}
			stateEmailBody += '%0D';  
			statePopupBody += '<br />';
		}
		if (stateClosedSummaryItems.length > 0 ) {
			stateEmailBody += 'Closed: (' + stateClosedCount + ')%0D';
			statePopupBody += 'Closed: (' + stateClosedCount + ')<br />';
			for (var i = 0; i < stateClosedSummaryItems.length; i++){
			  	stateEmailBody += stateClosedSummaryItems[i] + '%0D'; 
			  	statePopupBody += stateClosedSummaryItems[i] + '<br />';
			}
			stateEmailBody += '%0D';  
			statePopupBody += '<br />';
		}

		$.w2ui['app_layout'].load('right', 'app/radar/radar-summary.html', null, function () {
			// set priority values
			if (p1Count > 0){			
				$('#radar-summary #p1-count').html(p1Count);
			} else { 
				$('#radar-summary #p1-row').hide();
			}
			if (p2Count > 0){ 
				$('#radar-summary #p2-count').html(p2Count);
			} else { 
				$('#radar-summary #p2-row').hide();
			}
			if (p3Count > 0){ 
				$('#radar-summary #p3-count').html(p3Count);
			} else { 
				$('#radar-summary #p3-row').hide();
			}
			if (p4Count > 0){ 
				$('#radar-summary #p4-count').html(p4Count);
			} else { 
				$('#radar-summary #p4-row').hide();
			}
			if (p5Count > 0){ 
				$('#radar-summary #p5-count').html(p5Count);
			} else { 
				$('#radar-summary #p5-row').hide();
			}
			if (p6Count > 0){ 
				$('#radar-summary #p6-count').html(p6Count);
			} else { 
				$('#radar-summary #p6-row').hide();
			}

			// set state values
			if (stateNewCount > 0){ 
				$('#radar-summary #s1-count').html(stateNewCount);	
			} else { 
				$('#radar-summary #s1-row').hide();
			}
			if (stateAnalyzeCount > 0){ 
				$('#radar-summary #s2-count').html(stateAnalyzeCount);	
			} else { 
				$('#radar-summary #s2-row').hide();
			}
			if (stateIntegrateCount > 0){ 
				$('#radar-summary #s3-count').html(stateIntegrateCount);	
			} else { 
				$('#radar-summary #s3-row').hide();
			}
			if (stateBuildCount > 0){ 
				$('#radar-summary #s4-count').html(stateBuildCount);		
			} else { 
				$('#radar-summary #s4-row').hide();
			}
			if (stateVerifyCount > 0){ 
				$('#radar-summary #s5-count').html(stateVerifyCount);			
			} else { 
				$('#radar-summary #s5-row').hide();
			}
			if (stateClosedCount > 0){ 
				$('#radar-summary #s6-count').html(stateClosedCount);				
			} else { 
				$('#radar-summary #s6-row').hide();
			}
			
			// priority popup
			$('#radar-summary #priority-popup-btn').click(function(){
				$().w2popup('open',{
					title: 'Radar Priority Report',
					body: '<div style="background-color: #D3D3D3;">' + priorityPopupBody +
						  '</div>',
					width: 600,
					height: 300,
					overflow:'auto',
					modal: true,
					showClose: true
				});
			});

			// state popup 
			$('#radar-summary #state-popup-btn').click(function(){
				$().w2popup('open',{
					title: 'Radar State Report',
					body: '<div style="background-color: #D3D3D3;">' + statePopupBody + 
						  '</div>',
					width: 600,
					height: 300,
					overflow:'auto',
					modal: true,
					showClose: true
				});
			});

			// priority email report
			priorityEmailHtml += '<a href="mailto:?subject=Radar Priority Report&body=' + priorityEmailBody + ' ">' +
								 '<input type="button" id="priority-email-btn" value="Email Priority Report" /></a>';  
			$('#radar-summary #priority-email').html(priorityEmailHtml);

			// state email report
			stateEmailHtml += '<a href="mailto:?subject=Radar State Report&body=' + stateEmailBody + ' ">' +
							  '<input type="button" id="state-email-btn" value="Email State Report" /></a>';
			$('#radar-summary #state-email').html(stateEmailHtml);			

		});	
	}
}) (app.radar || {});