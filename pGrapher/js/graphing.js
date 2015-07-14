
var randomScalingFactor = function(){ return Math.round(Math.random()*100)};
var lineChartData = {
			labels : [""],
			datasets : [
				{
					label: "My First dataset",
					fillColor : "rgba(255,0,0,0.2)",
					strokeColor : "rgba(255,0,0,1)",
					pointColor : "rgba(255,0,0,1)",
					pointStrokeColor : "#fff",
					pointHighlightFill : "#fff",
					pointHighlightStroke : "rgba(255,0,0,1)",
					data : [0]
				},
				{
					label: "My Second dataset",
					fillColor : "rgba(0,255,0,0.2)",
					strokeColor : "rgba(0,255,0,1)",
					pointColor : "rgba(0,255,0,1)",
					pointStrokeColor : "#fff",
					pointHighlightFill : "#fff",
					pointHighlightStroke : "rgba(0,255,0,1)",
					data : [0]
				},
				{
					label: "My third dataset",
					fillColor : "rgba(0,0,255,0.2)",
					strokeColor : "rgba(0,0,255,1)",
					pointColor : "rgba(0,0,255,1)",
					pointStrokeColor : "#fff",
					pointHighlightFill : "#fff",
					pointHighlightStroke : "rgba(0,0,255,1)",
					data : [0]
				}
			]

};

/*var update = function()
              {
                myLine.addAndRemoveData(randomScalingFactor(), "");
                setTimeout(update, 20);
              }*/

window.onload = function(){
	var ctx = document.getElementById("canvas").getContext("2d");
	window.myLine = new Chart(ctx).Line(lineChartData,
                                      {
                                        responsive:	true,
                                        animation:	false,
                                        scaleOverride: true,
                                        scaleSteps: 40,
                                        scaleStepWidth: 0.2,
                                        scaleStartValue: -4,
                                        scaleIntegersOnly: false,
                                        scaleLineWidth: 0,
                                        tooltipFillColor: "rgba(22,22,22,0.5)"
                                      });

	for (var i = 1; i < 50; i++)
		myLine.addDatasWithoutUpdate([0, 0, 0], "");
		// myLine.addDataWithoutUpdate(0);

	myLine.update();

	/*setTimeout(update, 20);*/
};
