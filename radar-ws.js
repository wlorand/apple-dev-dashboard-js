/*********************************************
*  -- radar Web Services
*/

app.radarWS = (function (obj) {
	// local scope
	var config = {
		radar_url	: 'https://radar-webservices.apple.com',
		login 		: 'bill_lorand',
		token		: 'f53cb7bbbaeab50b16d19eec77597285dc7e1b27e92377348ae59d7a2919b3f48ff5f636ccdb6b4de90a3870b9e1f470076623b8eef37e2191a3597446035f2f8814a49cc18fd3a93aeabfac2b2c095ea29c1c795a3ac7cf0554285e39913867b02b38c6087360038ff5f636ccdb6b4de90a3870b9e1f470076623b8eef37e2191a3597446035f2f8814a49cc18fd3a98bef78ffcf576e62564b439bd6a18da3', // F 6/7
		user_dsid	: 1962818020, // for now, hard-coded (vitali); todo: make dyanmic once full authentication implemented  
		component	: 'HAWK',
 		team: [ 
 			{ lname: 'Agarwal', fname: 'Pankaj', dsid: '1343892531', email: 'pankaj_agarwal@apple.com' },
 			{ lname: 'Alam', fname: 'Shahid', dsid: '1355105775', email: 'sha@apple.com' },
			{ lname: 'Bangalore', fname: 'Sagar', dsid: '1324806984', email: 'sagarbangalore@apple.com' },
			{ lname: 'Borra', fname: 'Naga', dsid: '1154812169', email: 'nborra@apple.com' }, 		
			{ lname: 'Bhadravathi', fname: 'Divyavani', dsid: '1968050791', email: 'dbn@apple.com' }, 
			{ lname: 'Gadad', fname: 'Vijay', dsid: '1712150400', email: 'vgadad@apple.com' },		
			{ lname: 'Kohl', fname: 'James', dsid: '1446890063', email: 'jkohl@apple.com' }, 			
 			{ lname: 'Lorand', fname: 'Bill', dsid: '1761325085', email: 'blorand@apple.com' },
 			{ lname: 'Malinouski', fname: 'Vitali', dsid: '1962818020', email: 'vitali@apple.com' },
			{ lname: 'Pasala', fname: 'Sreenivasulu', dsid: '1451464813', email: 'spasala@apple.com' },
			{ lname: 'Ren', fname: 'Ben', dsid: '1952842060', email: 'ben_ren@apple.com' }, 			
			{ lname: 'Seerapu', fname: 'Vijay', dsid: '2024380289', email: 'vseerapu@apple.com' },			
			{ lname: 'Shanker', fname: 'Uma', dsid: '1122376920', email: 'uma_shanker@apple.com' },			
			{ lname: 'Singh', fname: 'Abhaya', dsid: '1999086299', email: 'abhayaraj_singh5@apple.com' }, 			
 			{ lname: 'Stepanenko', fname: 'Anna', dsid: '1633261668', email: 'astepanenko@apple.com' }, 
			//{ lname: 'Tewari', fname: 'Gargi', dsid: '', email: 'gtewari@apple.com' },
			{ lname: 'Utla', fname: 'Srinivas', dsid: '1154811565', email: 'sutla@apple.com' },
			{ lname: 'Vaishnav', fname: 'Snehalnayan', dsid: '1634627690', email: 'snehalnayan@apple.com' },
			{ lname: 'Vutukuru', fname: 'Shashidhar', dsid: '1169824423', email: 'svutukuru@apple.com' }, 			
 			{ lname: 'Woodman', fname: 'Gil', dsid: '1949156186', email: 'gwoodman@apple.com' }, 			
 			{ lname: 'Yadav', fname: 'Avinash', dsid: '298940202', email: 'ayadav@apple.com' }
 		],
 		emails: [ // used to generate user images in renderComments
 			{ 'pankaj_agarwal@apple.com' : 1343892531 },
 			{ 'sha@apple.com' : 1355105775 },
 			{ 'sagarbangalore@apple.com': 1324806984 }, 
 			{ 'nborra@apple.com' : 1154812169},
 			{ 'dbn@apple.com' : 1968050791},
 			{ 'vgadad@apple.com' : 1712150400 },
 			{ 'jkohl@apple.com' : 1446890063},
 			{ 'blorand@apple.com' : 1761325085},
 			{ 'vitali@apple.com' : 1962818020 },
 			{ 'spasala@apple.com' : 1451464813},
 			{ 'ben_ren@apple.com' : 1952842060},
 			{ 'vseerapu@apple.com' : 2024380289},
 			{ 'uma_shanker@apple.com' : 1122376920},
 			{ 'abhayaraj_singh5@apple.com' : 1999086299},
 			{ 'astepanenko@apple.com' : 1633261668},
 			//{ 'gtewari@apple.com' : },
 			{ 'sutla@apple.com'  : 1154811565},
 			{ 'snehalnayan@apple.com' : 1634627690},
 			{ 'svutukuru@apple.com' : 1169824423},
 			{ 'gwoodman@apple.com' : 1949156186},
 			{ 'ayadav@apple.com' : 298940202}
 		],
		components : [],	// loaded on init 
		milestones : [],	// loaded on init
		default: {
			version 	: 'APPS',
			milestone	: '2.3.0'
		}
	};

	obj.get 			= get;
	obj.find 			= find;
	obj.post 			= post;
	obj.getMilestones 	= getMilestones;
	obj.getComponents	= getComponents;
	obj.config			= $.extend(true, {}, config);	// make a copy public, so that original cannot be changed

    init();
	return obj;

	function init() {
		$().w2popup({ 
			width: 250,
			height: 50,
			overflow: 'hidden',
			body: '<div style="font-size: 16px; color: #444; text-align: center; padding: 8px">Loading...</div>' 
		});
		getMilestones(checkIfLoaded);
		getComponents(checkIfLoaded);

		function checkIfLoaded() {
			if (app.radarWS.config.components.length > 0 && app.radarWS.config.milestones.length > 0) {
				$().w2popup('close');
				//app.radar.render(); // know render is called elsewhere...
				$.w2ui.app_sidebar.doClick('all-radars');
			}
		}

		
	}

    // get details for a single radar problem 
	function get(problemId, callBack) {
		var fields = 'id,title,component,assignee,lastModifiedAt,state,substate,classification,priority,' +
		             'resolution,reproducible,milestone,' +
					 'description,diagnosis,relatedProblems,relatedProblemsCount,keywords,history';
		post('/problems/'+ problemId, { fields: fields }, callBack);
	}

    // find multiple radar problems that match a query 
	function find(query, callBack) {		
		// use a custom radar fieldset appropriate for a grid view (avoid any ws performance hit)
		var fields = 'id,title,component,assignee,lastModifiedAt,state,substate,classification,priority,'+
		             'resolution,reproducible,milestone';
		post('/problems/find', { query: query, fields: fields }, callBack);
	}

    // get all milestones for a component (will include closed ones as well)
	function getMilestones(callBack) {
		post('/components/' + config.component + '/root/milestones', {}, function(resultObj) {  
			obj.config.milestones = resultObj; // save milestones to the local config obj
			if (typeof callBack == 'function') callBack();
		});
	}

	function getComponents(callBack) {
		var postData = {};
		postData.fields = 'id,name,version,subcomponents';
		post('/components/' + config.component + '/root', postData, function (data) {
			obj.config.components = [];
			getAll(data);
			function getAll(data) {
				for (var d in data) {
					var tmp = data[d];
					if (tmp.isClosed !== true) obj.config.components.push(tmp.name + '-' + tmp.version);
					if (tmp.subcomponents.length > 0) getAll(tmp.subcomponents);
				}
			}
			obj.config.components.sort();
			if (typeof callBack == 'function') callBack();
		});
	}

	function getKeywords() {
       // returns array of Hawk only keywords to create a dropdown list when we go to create radars
       // obj.config.keywords = [];

	}

	function getVersions() {
		// returns array of versions -- todo: get more clarity on what this is for...  

	}

	function post(url, postData, callBack) { // use jquery.ajax()
		var additional = {};
		if (postData.query) {
			additional = {
				type 		: 'POST', // know can use post for all app calls
				data  		: postData.query ? JSON.stringify(postData.query) : '',
				dataType	: 'json',
				processData	: false,				
			}
		}
		$.ajax($.extend({			
			url			: config.radar_url + '/' + url,
			headers 	: { 
				"Accept"			 : 'application/json',
				"Content-Type"		 : 'application/json',
				"appleConnectName"	 : config.login,
				"opaqueToken"		 : config.token,
				"X-Fields-Requested" : postData.fields
			},
			cache		: true,
			complete	: function (xhr, status) {
				if (typeof callBack == 'function') callBack($.parseJSON(xhr.responseText));
			}
		}, additional));
	}

}) (app.radarWS || {});