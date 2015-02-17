// Javascript for map page


 function SizeMe(map) {
	//Dynamically Resize Body
	$("body").height($(window).outerHeight()-40);
	$("body").width($(window).outerWidth());
	
	var iBodyWidth = $("body").width();
	var iBodyHeight = $("body").height();
	var iMenuOffset = 38;
	var iSubMenuOffset = 151;
	var iVCRHeight = 49;
	var iVCROffset = 30;
	
	$("#map").height($("body").height() - $("#map").offset().top);
	$("#menu").height($("#map").height() - iMenuOffset);
	$("#vcr-controls").css("top",($("#map").offset().top + $("#map").height()- iVCRHeight -iVCROffset) + "px")
	$("#SubjectiveMarkers").height($("#menu").height() - iSubMenuOffset);
	map.invalidateSize();
}

$(document).ready(function() {
	var markers;
	var iZoomNum = 0;
	// Possible heat map layer var
    var SMFilter = [];
	var PageFilter = [];
	var thisPage = 9; //sets the first page of the counter to page 9
	var speed = 100; //controls the interval of the increase/decrease speed functions.  
		//Speed acts as the inverse of time.  Increase in speed value == increase in pause
	var interval; //variable that holds several values for info data and speed

    L.mapbox.accessToken = 'pk.eyJ1IjoiZGVhbm9sc2VuMSIsImEiOiJ1dkxBdm9FIn0.kapau_lUukKIE93Y8I0A9g';

    var map = L.mapbox.map('map', 'deanolsen1.l6h0h2j6', 
    	{zoomControl : false, 
    	//removed attribution from bottom of map to credits page
    	attributionControl: false});
    // create zoom-in effect on map on load, comment out to disable
     // map.setView([48.876, 2.357], 8);
     //  window.setTimeout (function () {
     //   	map.setView([48.876, 2.357], 11)}, 2000);
     //  window.setTimeout (function () {
     //   	map.setView([48.876, 2.357], 13)}, 4000);
     //  window.setTimeout (function () {
     //   	map.setView([48.876, 2.357], 15)}, 6000);
      //uncomment following line for non-zoomed map view
       	map.setView([48.876, 2.357], 15);
		
	//Setup and initialize dynamic document resize functionality
	//In lieu of a better solution - the margin and removal is a hack to keep the vcr looking nice
	$(window).resize(function () { $("#vcr-controls").css("margin-right","0px"); SizeMe(map) });
	 SizeMe(map);


	// extra way of zooming in -- has plus button and minus button for zooming
    new L.Control.Zoom({ position: 'topright' }).addTo(map);

    //load json data onto basemap; create tools
	$.getJSON("data/Locationsv4.geojson")
		.done(function(data) {

			var info = processData(data);
			createPropSymbols(info, data);
			createSliderUI(info.pages, info, data);
            menuSelection(info.SMs, info, data);
            updateMenu(info, data);
            sequenceInteractions(info, data);
		})
		.fail(function() { alert("There has been a problem loading the data.")});

    //dynamically created checkbox options with the number of markers after the option
	function menuSelection(SMs, info, data) {
        var SMOptions = [];
        for (var index in SMs) {
            SMOptions.push("<input type=\"checkbox\" name=\"SMFilter\" value=\""+ SMs[index] +"\">" + SMs[index] + "<br><i>&nbsp; &nbsp; &nbsp;&#40;cited " + info.SMCount[SMs[index]] + " times&#41;</i>" + "</input>");
        };

        //everytime click on the option, trigger the update Menu function
        $("#SubjectiveMarkers").html(SMOptions.join("<br />"));
        $("#SubjectiveMarkers").on("click", function(event) {
            updateMenu(info, data);
            	$(".pause").hide();
				$(".play").show();
				stopMap(info, data);
        });

		//selectall/ unselectall botton
  		$("#checkAllBtn").click(function(event) {   
            $("#SubjectiveMarkers :checkbox").each(function() {
                this.checked = true;                        
            });
            updateMenu(info, data);
            	$(".pause").hide();
				$(".play").show();
				stopMap(info, data);
        });

        $("#uncheckAllBtn").click(function(event) {   
            $("#SubjectiveMarkers :checkbox").each(function() {
                this.checked = false;                        
            });
            updateMenu(info, data);
        });  

		//change map view to match initial view above. function to reset map view when button is clicked - center on 10th Arron.

		$("#resetMapBtn").click(function(event) {   
            map.setView([48.876, 2.360], 15);
        	});
    }

    //Store the checked option in filter, count number of checkbox selection, call createPropSymbols function
    function updateMenu(info, data){
       	SMFilter = [];
       	$( "input:checkbox[name=SMFilter]:checked").each(function(){
           SMFilter.push($(this).val());
       	});

		//Remove old map info
		$( "input:checkbox[name=SMFilter]").not(":checked").each(function(){
			//console.log($(this).val());
			$("." + CleanFName($(this).val())).remove();
       	});

		$("#checkedNum").html(SMFilter.length + " categories are checked")		
        createPropSymbols(info, data);
    }

    //update pageline 
	function updatePages(info, data) {
		PageFilter = [];
		$( "input:output[name=PageFilter]:input change").each(function(){
			PageFilter.push($(this).val());
		});

	createPropSymbols(info, data);
	}

    //process geojson data; create required arrays
    function processData(data) {
        var pages = [];
        var pageTracker = [];
        var SMs = []
        var SMTracker = [];
        var SMCount = {};

        for (var feature in data.features) {
			var properties = data.features[feature].properties;

            //process page properties and store it in page Tracker array
            if (pageTracker[properties.Page] === undefined) {
                pages.push(properties.Page);
                pageTracker[properties.Page] = 1;
            }

            //process SM properties and store it in SM Tracker array
            if (SMTracker[properties.SM] === undefined) {
                SMs.push(properties.SM);
                SMTracker[properties.SM] = 1;
            }

            //process SM properties and count the number of each subjective markers
            if (SMCount[properties.SM] === undefined) {
            	SMCount[properties.SM] = 1;
            }
            else {
            	SMCount[properties.SM] += 1;
            }
		}
        return { 
            SMs : SMs,
            pages : pages.sort(function(a,b){return a - b}),
            SMCount : SMCount
        };        console.log([SMTracker])

    };

	function CleanFName(s){
		//Strip spaces, nonalphanumeric, and make lower
		return s.replace(/\s/g,"").replace(/[^a-zA-Z 0-9]+/g, '').toLowerCase();
	}
	
	function GetZOb(f){
		console.log(f);
		f.latlng =  new L.LatLng(f.target._animateToCenter.lat,f.target._animateToCenter.lng)
		$.extend(f,map.latLngToContainerPoint(f.latlng));
		return f;
	}
	
    //function to create symbols
    function createPropSymbols(info, data, currentPage, speed,isVCR) {
        console.log(info)
        console.log(data)
        console.log(speed)
		console.log(isVCR);
		

        if (map.hasLayer(markers)){
            map.removeLayer(markers);
        	};
			
		//if we are playing we should only show one at a time;
		if(isVCR) {
			$("#dvAllMyZooms").empty();
		}
		
		//For bounding later
		var arrCoord = [];
		
       //filter to load the markers that are in selected pages or in check box
		markers = L.geoJson(data, {
            filter: function(feature, layer) {
			if (currentPage){
			//if page number matches currentPage, put feature on map
			if (feature.properties.Page == currentPage){
					return true;
			} else {
					return false;
					}
			} else {
				if ($.inArray(feature.properties.SM,SMFilter) !== -1) {  
                   return true;
            } else {
					return false;
				};
			}
        },
        //opacity of markers, transition time for black circle to appear
		pointToLayer: function(feature, latlng) {
				arrCoord.push([latlng.lat,latlng.lng]);
			    //To keep the map program happy - not visible
				var circle = L.circle(latlng, 200,{
                    fillColor: PropColor(feature.properties.SM),
				    color: PropColor(feature.properties.SM),
					stroke: false,
                    weight: 4,
                    clickable: true,
				    fillOpacity: 0.0,
					opacity: 0.0
                });
			
				var e = map.latLngToContainerPoint(latlng);
				e.latlng = latlng;
				var fName = CleanFName(feature.properties.SM)
				var createZoom = function(e) { 
						//generate id instance
						var idZ = "zoomlens" + iZoomNum;
						var idO = "olay" + iZoomNum;
						var idM = "zoommap" + iZoomNum++;
						
						//append html
						$("#dvAllMyZooms").append("<div id='"+idZ+"' class='zoomlens "+CleanFName(fName )+" overlay'><div id='"+idO+"' class='overlay rotater'><div class='overlay rotater'><div id='"+idM+"' class='zoommap overlay'></div></div></div><div id='border' class='overlay'></div></div>");
		
						//grab on page object
						var oZlens = document.getElementById(idZ);
						
						//Boiler Plate Setup
						var zmap = L.mapbox.map(idM, 'deanolsen1.l4i434a2', {
							fadeAnimation: false,
							zoomControl: false,
							clickable: true,
							attributionControl: false
						});
						
						zoomIt = function(e) {
							if (zmap._loaded) zmap.setZoom(map.getZoom() +1);
						};

						updateLens = function(e) {
							oZlens.style.top = (e.y -10)  + 'px';
							oZlens.style.left = (e.x - 10) + 'px';
							zmap.setView(e.latlng, map.getZoom() + 0, true);
						};
						
						map.on("zoomend",function (){ 
							updateLens(e)
							zoomIt(e);	
						})
						
						map.on("dragend",function (){ 
							updateLens(e)
							zoomIt(e);	
						})
						
						//Create Lens
						updateLens(e)
						zoomIt(e);	
						
						$("#"+idZ).on({
							mouseover: function(e) {
								circle.openPopup();
							},
							mouseout: function(e) {
								//circle.closePopup();
							}
						});								
					};
					
			createZoom(e);	
			
		
			/*instead of returning circles (SVG elements),
			you need to return a div with a unique id attribute
			that can then be used to create a new L.mapbox.map 
			(your zoommap)
			*/
			return circle;
				
		
				
			}
		}).addTo(map);
		updatePropSymbols();
		if(arrCoord.length > 0){
			map.fitBounds(arrCoord);
		}
	} 	// end createPropSymbols()


	//color of markers
    function PropColor(SM) {
        return "#CC2B0A";
    }

    //marker size, popup
    function updatePropSymbols() {
		markers.eachLayer(function(layer) {
			var props = layer.feature.properties;
			// size of circle markers
			var	radius = 100;
			var	popupContent = "<i><b>" + props.SM + "</b></i>" + " <br>"+ props.Address +"<br>page " + props.Page ;
			layer.setRadius(radius);
			layer.bindPopup(popupContent, { offset: new L.Point(0,10) });
            layer.options.color = PropColor(props.SM);
            layer.options.fillColor = PropColor(props.SM);
		});
	} // end updatePropSymbols


    //create the page timeline, chronological order of events
	function createSliderUI(Pages, info, data) {
		var sliderControl = L.control(
			//move slider to bottom right
			{ position: 'bottomright'} );

		sliderControl.onAdd = function(map) {
			var slider = L.DomUtil.create("input", "range-slider");
			L.DomEvent.addListener(slider, 'mousedown', function(e) {
				L.DomEvent.stopPropagation(e);
			});

			$(slider)
				.attr({'type':'range', 
                       'max': Pages[Pages.length-1], 
                       'min':Pages[0], 
                       'step': 1,
					   'width' : 4,
                       'value': String(Pages[0])})

		        .on('input change', function() {
					createPropSymbols(info, data, this.value);
					//text for slider bar
		            $(".temporal-legend").text("On page " + this.value);
		        });
			return slider;
		}
		sliderControl.addTo(map);
		createTemporalLegend(Pages [0]);
	} 

    //create page line time VCR control, starts out with pause button hidden until user clicks play button
	function sequenceInteractions(info, data) {
		$(".pause").hide();
		//play behavior
		$(".play").click(function(){
				$(".pause").show();
				$(".play").hide();
				map.setView([48.876, 2.357], 15);
				clearInterval(interval);
				speed = 250;
				animateMap(info, data, speed); 
				menuSelection(info.SMs, info, data);
				updateMenu();
			});

		//pause behavior; hides pause button if displayed and shows play button, stops all map action 
		$(".pause").click(function(){
				$(".pause").hide();
				$(".play").show();			
				stopMap(info, data, speed); 
			});

		//step behavior; stops map hides pause button if displayed and shows play button, increments data etc. by 1
		$(".step").click(function(){
			stopMap();
				$(".pause").hide();
				$(".play").show();
				step(info, data);
			});

		//back behavior; stops map hides pause button if displayed and shows play button, decrements data etc by 1
		$(".back").click(function(){
				stopMap();
				$(".pause").hide();
				$(".play").show();
				goBack(info, data);
			});

		//back behavior; stops map and changes buttons to cue user to change
		$(".back-full").click(function(){
				stopMap();
				$(".pause").hide();
				$(".play").show();
				backFull(info, data);
			});

		//full forward behavior - hides buttons and goes to end of timeline
		$(".step-full").click(function(){
				$(".pause").hide();
				$(".play").show();
				stepFull(info, data);
			});

		//decrease speed behavior, increases speed by 1/10 sec per click by lowering the interval 
		$(".faster").click(function(){
				if (speed>100) {
					speed = speed-100;
					clearInterval(interval);
					animateMap(info, data, speed); 
				}
				else (speed = 250);
				//extra code to ensure slider data progress at 1/4 second delay 
				//since initial speed starts at 250, changing by 100 would enable 
				//user to go outside of the bounds of either increase or decrease 
				//function by speed=50.  This handles that potential error 
			});

		//increase speed behavior, decreases speed by 1/10th sec per click by lowering the interval
		$(".slower").click(function(){
			if (speed<1000) {
			speed = speed+100;
			clearInterval(interval);
			animateMap(info, data, speed); 
			console.log(speed);
			}
			else {speed = 250};
			//extra code to ensure slider data progresses at 1/4 second delay 
			//since initial speed starts at 250, changing by 100 would enable 
			//user to go outsiude of the bounds of either increase or decrease 
			//function by speed=50.  This handles that potential error
			});
	}

	// create map animation
	function animateMap (info, data, speed) {
		interval = setInterval(function(){step(info, data)},speed);
	}
	//gives ability for map to stop in place by changing the speed and clearing the interval 
	function stopMap(info, data, speed){
		speed = 0;
		clearInterval(interval);
	}

	//function to set the counter and timeline back 1 without going past the first page (9)
	function goBack(info, data, speed){
		if (thisPage >9) {
			thisPage--; 
		}; 
		createPropSymbols(info, data, thisPage, speed, true);
		$("input[type=range]").val(thisPage);
		$(".temporal-legend").text( "On Page " + thisPage);
	}

	//function to allow counter and data to increment by one
	function goForward(info, data, speed){
		thisPage++; 
		console.log(speed);
		createPropSymbols(info, data, thisPage, speed, true);
		$("input[type=range]").val(thisPage);
		$(".temporal-legend").text( "On Page " + thisPage);
	}
	//function to allow counter and data to increment by one
	function step(info, data, speed){
		if (thisPage <238) {
			thisPage++; 
			};
			console.log(speed)
		createPropSymbols(info, data, thisPage,speed, true);
		$("input[type=range]").val(thisPage);
		$(".temporal-legend").text( "On Page " + thisPage);
	}

	//takes the user to the last page (238)
	function stepFull(info, data, speed){
		thisPage=238; 
		createPropSymbols(info, data, thisPage,speed, true);
		$("input[type=range]").val(thisPage);
		$(".temporal-legend").text( "On Page " + thisPage);
	}

	//vcr control to first page, pg 9--book starts on pg 9
	function backFull(info, data, speed){
		thisPage=9; 
		createPropSymbols(info, data, thisPage,speed, true);
		$("input[type=range]").val(thisPage);
		$(".temporal-legend").text( "On Page " + thisPage);
	}

    //add page number demonstration 

	function createTemporalLegend(startTimestamp, speed) {
		var temporalLegend = L.control(
			//position to bottom right
			{ position: 'bottomright' });
		temporalLegend.onAdd = function(map) {
			var output = L.DomUtil.create("output", "temporal-legend");
			return output;
		}
		temporalLegend.addTo(map);
		$(".temporal-legend").text("On page " + startTimestamp);
	}	// end createTemporalLegend()

	// magnifier glass experiment

	var zl = document.getElementById('zoomlens');

	var zoommap = L.mapbox.map('zoommap', 'deanolsen1.l4i434a2', {
    fadeAnimation: false,
    zoomControl: false,
    clickable: true,
    attributionControl: false
	});

	/*// Call update or zoom functions when
	// these events occur.
	map.on('click', update);
	map.on('zoomend', zoom);*/

	function zoom(e) {
	    if (zoommap._loaded) zoommap.setZoom(map.getZoom() +1);
	}

	function update(e) {
		//console.log(e);
	   // zl.style.top = e.containerPoint.y - 100 + 'px';
	   // zl.style.left = e.containerPoint.x - 100 + 'px';
	    zl.style.top = (e.containerPoint.y -10)  + 'px';
	    zl.style.left = (e.containerPoint.x - 10) + 'px';
	    zoommap.setView(e.latlng, map.getZoom() + 0, true);
	}

});
//end code

