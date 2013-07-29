var campaigns = [];
var i = 0;
var numSmallPanels = 0;
var ticker;
var data;
var plot;

//flip variables
var dayLength = 28800000;
var rotatePause = 15000;
var firstLoop = true;

$(document).ready(function() {// begin jQuery

  //loading screen
  var loadH = $(window).height();
  $("body").append("<div id='locust-load' style='width: 100%; height: " + loadH + "px; text-align: center; position: absolute; z-index: 99; top: 0px; left: 0px; background-color: rgba(0,0,0,1); padding-top: 100px'><img src='/public/locust.gif'/></div>");

	var socket = io.connect(window.location.hostname);

	socket.on("setCampaign", function (info, users) {
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
                    'memberArray': memberArray
                  });
    var cIndex = campaigns.length - 1;

    if(cIndex == 0){// fill in the featured panel
      campaigns[0].flipPause = (dayLength) / (campaigns[0].usersNow - campaigns[0].usersYest);
      $(".tick").text(campaigns[0].usersYest);

      ticker = $(".tick").ticker({
        incremental: 1,
        delay: campaigns[0].flipPause,
        separators: true
      });

      $('#featured').find('.info').find('.title').text(campaigns[0].name);
      $('#featured').find('.days-remaining').text(campaigns[0].daysLeft);
      $('#featured').find('.logo').find('img').attr("src", campaigns[0].pic);
      if(campaigns[0].teaser.length > 145){
        $('#featured').find(".teaser").text(campaigns[0].teaser.substring(0, 142).concat("..."));  
      }else{
        $('#featured').find(".teaser").text(campaigns[0].teaser);
      }

      rotateGraphs();

    }else{// add flip pause to all the small panel campaigns
      campaigns[cIndex].flipPause = (dayLength) / (campaigns[cIndex].usersNow - campaigns[cIndex].usersYest);
    }

    // fill out a small panel for all campaigns   
    numSmallPanels++;
    var panel = "<div id='" + cIndex + "' class='small-panel small-font'>" +
                  campaigns[cIndex].name +
                "</div>";
    $("#sidebar").append(panel);
    if(cIndex == 0){
      $("#0").addClass("highlight");
    }
    
    // WARNING: this should only occur after they are all loaded
    // remove the loading screen
    $("#locust-load").remove();
	});


  $("#ds-logo").on("click", function(){
    ticker[0].stop();
  });

  var rotateFeatured = setInterval(function() {
    $("#" + i).removeClass("highlight");
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

    $("#" + i).addClass("highlight");

    // fill in the featured panel
    $('#featured').find('.info').find('.title').text(campaigns[i].name);
    $('#featured').find('.days-remaining').text(campaigns[i].daysLeft);
    $('#featured').find('.logo').find('img').attr("src", campaigns[i].pic);
    if(campaigns[i].teaser.length > 145){
      $('#featured').find(".teaser").text(campaigns[i].teaser.substring(0, 142).concat("..."));  
    }else{
      $('#featured').find(".teaser").text(campaigns[i].teaser);
    }
  }, rotatePause);


  function rotateGraphs() {
    if (plot != undefined) {
      plot.destroy();
    }
    data = [
      ["Mobile Signups", campaigns[i].mobileSignups],["Web Signups", campaigns[i].webSignups]
    ];
    plot = $.jqplot ('graph', [data], 
      { 
        seriesDefaults: {
           // Make this a pie chart.
           renderer: jQuery.jqplot.PieRenderer, 
           rendererOptions: {
             // Put data labels on the pie slices.
             // By default, labels show the percentage of the slice.
             showDataLabels: true,
             shadowOffset: true,
           }
          }, 
          legend: { 
            show: true, 
            location: 'e',
            border: 'none',
            fontFamily: 'din-web',
            fontSize: '16pt',
            background: '#F5F5F5',
            marginLeft: '-50px'
          },
          grid: {
            drawBorder:false,
            shadow: false,
            background: '#F5F5F5'
          }
       }
    );

    setTimeout(function() {
      plot.destroy();
      data = [
        ["New DS Members", campaigns[i].newMembers],["Old DS Members", campaigns[i].oldMembers]
      ];
      plot = $.jqplot ('graph', [data], 
        { 
          seriesDefaults: {
             // Make this a pie chart.
             renderer: jQuery.jqplot.PieRenderer, 
             rendererOptions: {
               // Put data labels on the pie slices.
               // By default, labels show the percentage of the slice.
               showDataLabels: true,
               shadowOffset: true,
             }
            }, 
            legend: { 
              show: true, 
              location: 'e',
              border: 'none',
              fontFamily: 'din-web',
              fontSize: '16pt',
              background: '#F5F5F5',
              marginLeft: '-50px'
            },
            grid: {
              drawBorder:false,
              shadow: false,
              background: '#F5F5F5'
            }
         }
      );

      setTimeout(function() {
        plot.destroy();
        console.log(campaigns[i].memberArray);
        plot = $.jqplot ('graph', [campaigns[i].memberArray], 
          { 
            axesDefaults: {
              labelRenderer: $.jqplot.CanvasAxisLabelRenderer
            }, 
            grid: {
              drawBorder:false,
              shadow: false,
              background: '#F5F5F5'
            },
            axes: {
              xaxis: {
                renderer:$.jqplot.DateAxisRenderer,
                tickOptions:{formatString:'%b %#d'},
                label: "Date",
                pad: 0
              },
              yaxis: {
                label: "Total Signups"
              }
            }
           }
        );
      }, (rotatePause/3));
    }, (rotatePause/3));
  }

}); // end jQuery scope