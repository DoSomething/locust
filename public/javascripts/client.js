var campaigns = [];
var i = 0;
var numSmallPanels = 0;
var ticker;
var slices;
var plot;
var numTicks = 7;

//flip variables
var dayLength = 28800000;
var rotatePause = 30000;
var firstLoop = true;

$(document).ready(function() {// begin jQuery
  // set heights for responsive web design
  $("#wrapper").css("height", $(window).height());
  $("#featured").css("height", $(window).height());
  $("#sidebar").css("height", $(window).height());

  //loading screen
  var loadH = $(window).height();
  $("body").append("<div id='locust-load' style='width: 100%; height: " + loadH + "px; text-align: center; position: absolute; z-index: 99; top: 0px; left: 0px; background-color: rgba(0,0,0,1); padding-top: 100px'><img src='/public/locust.gif'/></div>");

	var socket = io.connect(window.location.hostname);

	socket.on("setCampaign", function (info, users, remove) {
    if (remove) {
      campaigns = [];
      $('.small-panel').each(function() {
        $(this).remove();
      });
      i = 0;
      numSmallPanels = 0;
      $(".tick").remove();  
      $("#tick-holder").prepend("<p class='tick tick-flip'></p>");
    }

    var data = JSON.parse(info);
    var users = JSON.parse(users);
    var logo = data.rows[0].logo;
    var name = data.rows[0].title;
    var teaser = data.rows[0].teaser;

    if(users.rows.length < 2){
      var usersYest = 0;
    }else{
      var usersYest = users.rows[users.rows.length - 2].totalSignups;
    }
    var usersNow = users.rows[users.rows.length - 1].totalSignups;
    if (usersNow == 0) {
      return;
    }

    var mobileSignups = users.rows[users.rows.length - 1].mobileSignups;
    var webSignups = users.rows[users.rows.length - 1].webSignups;
    var newMembers = users.rows[users.rows.length - 1].totalNewMembers;
    var oldMembers = usersNow - newMembers;

		var end = Date.parse(data.rows[0].endDate);
		var remaining = Date.today().getDaysBetween(end);
    if (remaining < 1) {
      remaining = "Ends Today";
    } else if (remaining == 1) {
      remaining = "Ends Tomorrow";
    } else {
      remaining = remaining + " Days Remaining";
    }

    var memberArray = [];
    users.rows.forEach(function(r) {
      memberArray.push([r.date, r.totalSignups]);
    });

    campaigns.push({'name': name,
                    'pic': logo,
                    'daysLeft': remaining,
                    'teaser': teaser,
                    'usersYest': usersYest,
                    'usersNow': usersNow,
                    'flipCount': 0,
                    'flipPause': 0,
                    'userData': users,
                    'allDone': false,
                    'mobileSignups': mobileSignups,
                    'webSignups': webSignups,
                    'newMembers': newMembers,
                    'oldMembers': oldMembers,
                    'memberArray': memberArray,
                  });
    var cIndex = campaigns.length - 1;

    if(cIndex == 0){// fill in the featured panel
      campaigns[0].flipPause = (dayLength) / (campaigns[0].usersNow - campaigns[0].usersYest);
      $(".tick").text(campaigns[0].usersYest);

      if(window.location.hash != "#tv"){
        $("#tick-holder").css({"width":"352px"});
        $(".tick").css({"width":"336px"});
      }

      ticker = $(".tick").ticker({
        incremental: 1,
        delay: campaigns[0].flipPause,
        separators: true
      });

      // don't do any flips at all
      if(campaigns[0].usersNow == campaigns[0].usersYest){
        campaigns[0].allDone = false;
        ticker[0].stop();
      }

      $('#featured').find('.info').find('.title').text(campaigns[0].name);
      $('#featured').find('.days-remaining').text(campaigns[0].daysLeft);
      
      //$('#featured').find('.logo').find('img').attr("src", campaigns[0].pic);
      $('#featured').find('.logo').css("background", "url(" + campaigns[0].pic + ") no-repeat");
      $('#featured').find('.logo').css("background-size", "100% auto");
      $('#featured').find('.logo').css("background-position", "center");

      if(campaigns[0].teaser.length > 145){
        $('#featured').find(".teaser").text(campaigns[0].teaser.substring(0, 142).concat("..."));  
      }else{
        $('#featured').find(".teaser").text(campaigns[0].teaser);
      }

      // 108 is sum of margins in featured div
      var height = $(window).height() - (108 + $('#featured').find('.info').height() + $('#featured').find('.campaign').height());
      $('#featured').find('.data-display').height(height);

      rotateGraphs();

    }else{// add flip pause to all the small panel campaigns
      campaigns[cIndex].flipPause = (dayLength) / (campaigns[cIndex].usersNow - campaigns[cIndex].usersYest);
    }

    // fill out a small panel for all campaigns   
    numSmallPanels++;
    var panel = "<div id='" + cIndex + "' class='small-panel small-font bold'>" +
                  campaigns[cIndex].name +
                "</div>";
    $("#sidebar").append(panel);
    // set the triangle to the top campaign
    if(cIndex == 0){
      var top = $("#" + cIndex).position().top;
      var left = $("#featured").position().left - 20;
      $("#arrow").css({"top": top, "left": left});
      $("#" + cIndex).css("color", "#3892E3");
    }
    
    // WARNING: this should only occur after they are all loaded
    // remove the loading screen
    $("#locust-load").remove();
	});


  $("#ds-logo").on("click", function(){
    ticker[0].stop();
  });

  var rotateFeatured = setInterval(function() {
    i++;
    if (i >= campaigns.length) {
      i = 0;
    }

    rotateGraphs();

    // how many flips should I have completed?
    if(firstLoop){
      if(i == campaigns.length - 1){
        firstLoop = false;
      }
      campaigns[i].flipCount += Math.floor((rotatePause * (i)) / campaigns[i].flipPause);
    }else{
      campaigns[i].flipCount += Math.floor((rotatePause * (campaigns.length)) / campaigns[i].flipPause); 
    }

    // set a ticker as all done before even loading it
    if((campaigns[i].flipCount + campaigns[i].usersYest) >= campaigns[i].usersNow){
      campaigns[i].allDone = true;
      // if all done then set flip count to maximum flips (effectively rendering value as usersNow)
      campaigns[i].flipCount = campaigns[i].usersNow - campaigns[i].usersYest;
    }

    $(".tick").remove();
    $("#tick-holder").prepend("<p class='tick tick-flip'>" + (campaigns[i].usersYest + campaigns[i].flipCount) + "</p>");

    //raspberry pi does not display padding correctly
    if(window.location.hash != "#tv"){
      $("#tick-holder").css({"width":"352px"});
      $(".tick").css({"width":"336px"});
    }

    ticker = $(".tick").ticker({
      incremental: 1,
      delay: campaigns[i].flipPause,
      separators: true
    });

    // don't do any flips at all
    if(campaigns[i].allDone){
      ticker[0].stop();
    }

    $(".tick").on("DOMSubtreeModified", function() {
      if(ticker != null && ticker[0].value >= campaigns[i].usersNow){
        ticker[0].stop();
        campaigns[i].allDone = true;
      }
    });

    // change where the triangle is
    var top = $("#" + i).position().top;
    $("#arrow").animate({"top": top}, function(){
      $(".small-panel").each(function(){
        $(this).css("color", "#000000");
      });
      $("#" + i).css("color", "#3892E3");
    });


    // fill in the featured panel
    $('#featured').find('.info').find('.title').text(campaigns[i].name);
    $('#featured').find('.days-remaining').text(campaigns[i].daysLeft);

    //$('#featured').find('.logo').find('img').attr("src", campaigns[i].pic);
    $('#featured').find('.logo').css("background", "url(" + campaigns[i].pic + ") no-repeat");
    $('#featured').find('.logo').css("background-size", "100% auto");
    $('#featured').find('.logo').css("background-position", "center");

    if(campaigns[i].teaser.length > 145){
      $('#featured').find(".teaser").text(campaigns[i].teaser.substring(0, 142).concat("..."));  
    }else{
      $('#featured').find(".teaser").text(campaigns[i].teaser);
    }

    // 108 is sum of margins in featured div
    height = $(window).height() - (108 + $('#featured').find('.info').height() + $('#featured').find('.campaign').height());
    $('#featured').find('.data-display').height(height);
    
  }, rotatePause);


  function rotateGraphs() {
    if (campaigns[i].memberArray.length < 7) {
      numTicks = campaigns[i].memberArray.length;
    }else{
      numTicks = 7;
    }

    if (campaigns[i].usersNow <= 0) {
      if (plot != undefined) {
        plot.destroy();
      }
      return;
    }
    if (plot != undefined) {
      plot.destroy();
    }
    
    slices = [];
    if (campaigns[i].mobileSignups < campaigns[i].webSignups) {
      slices.push(["Mobile Signups", campaigns[i].mobileSignups]);
      slices.push(["Web Signups", campaigns[i].webSignups]);
    } else {
      slices.push(["Web Signups", campaigns[i].webSignups]);
      slices.push(["Mobile Signups", campaigns[i].mobileSignups]);
    }

    plot = $.jqplot ('graph', [slices], 
      { 
        seriesDefaults: {
           // Make this a pie chart.
           renderer: jQuery.jqplot.PieRenderer, 
          }, 
          seriesColors :['#A3CEF4','#3892E3'],
          legend: { 
            border: 'none',
            fontSize: '16pt',
            marginLeft: '-50px'
          },
          grid: {
            drawBorder:false,
            shadow: false,
            background: '#F5F5F5'
          },
          title: {
            text: "How Did We Reach Our Members?",
            fontWeight: '600'
          }
       }
    );
    $('.jqplot-title').css('fontWeight', '600');

    setTimeout(function() {
      plot.destroy();

      slices = [];
      if (campaigns[i].newMembers < campaigns[i].oldMembers) {
        slices.push(["New Members", campaigns[i].newMembers]);
        slices.push(["Existing Members", campaigns[i].oldMembers]);
      } else {
        slices.push(["Existing Members", campaigns[i].oldMembers]);
        slices.push(["New Members", campaigns[i].newMembers]);
      }

      plot = $.jqplot ('graph', [slices], 
        { 
          seriesDefaults: { renderer: jQuery.jqplot.PieRenderer },
            seriesColors :['#A3CEF4','#3892E3'], 
            legend: { 
              border: 'none',
              fontSize: '16pt',
              marginLeft: '-50px'
            },
            grid: {
              drawBorder:false,
              shadow: false,
              background: '#F5F5F5'
            },
            title: {
              text: "New Members?"
            }
         }
      );
      $('.jqplot-title').css('fontWeight', '600');


      setTimeout(function() {
        plot.destroy();
        plot = $.jqplot ('graph', [campaigns[i].memberArray], 
          { 
            axesDefaults: { labelRenderer: $.jqplot.CanvasAxisLabelRenderer }, 
            grid: {
              drawBorder:false,
              shadow: false,
              background: '#F5F5F5'
            },
            series: [{
              lineWidth:3,
              markerOptions: { size: 6 }
            }],
            legend: { show: false },
            title: {
              text: "Campaign Member Growth",
            },
            axes: {
              xaxis: {
                renderer:$.jqplot.DateAxisRenderer,
                numberTicks: numTicks,
                tickOptions:{formatString:'%b %#d'},
                label: "Date"
              },
              yaxis: { label: "Total Signups" }
            }
          }
        );
        $('.jqplot-title').css('fontWeight', '600');

      }, (rotatePause/3));
    }, (rotatePause/3));
  }
}); // end jQuery scope