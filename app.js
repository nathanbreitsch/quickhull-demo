
function ViewModel(){
  var self = this;
  self.pointString = ko.observable("25,50\n50,75\n75,25");
  self.svg = null;

  self.points = ko.computed(function(){
    return self.pointString().split('\n')
                .map(function(line){
                  return line.split(',')
                          .map(function(num){
                            return parseFloat(num);
                          });
                }).map(function(arr){
                  return {
                    x: arr[0],
                    y: arr[1]
                  }
                });
  });

  self.pointString.subscribe(function(oldValue, newValue){
    self.drawPoints();
  });

  self.add20RandomPoints = function(){
    var points = [];
    for(var i = 0; i < 20; i++){
      var theta = Math.random() * Math.PI * 2;
      var r = Math.random() * 50;
      var x = r * Math.cos(theta);
      var y = r * Math.sin(theta);
      x = Math.round(x);
      y = Math.round(y);
      points.push(
        [ x, y ]
      );
    }
    var pointString = points.map(function(d){
      return d.join(',');
    }).join('\n');
    self.pointString(self.pointString() + '\n' +  pointString );
    self.drawPoints();
  }

  self.drawPoints = function(){

    var width = $("#vis").width();
    var height = $(window).height() * 0.8;
    var radius = 5;
    self.svg.attr('width', width).attr('height', height);

    var data = self.points();

    var xMin = d3.min(data, function(d){return d.x});
    var xMax = d3.max(data, function(d){return d.x});
    var yMin = d3.min(data, function(d){return d.y});
    var yMax = d3.max(data, function(d){return d.y});
    var xRange = xMax - xMin;
    var yRange = yMax - yMin;
    var yMargin = 0.1 * yRange + 50;
    var xMargin = 0.1 * xRange + 50;


    var points = self.svg.selectAll('.point')
                         .data(self.points());

    points.enter().append("circle");

    points.attr('cy', function(d, i){
      return (d.y - yMin) / ((yMax - yMin) || 1) * (height - 2*yMargin) + yMargin;
    })
      .attr('class', 'point')
      .attr('r', radius)
      .attr('cx', function(d, i){
        return (d.x - xMin) / ((xMax - xMin) || 1) * (width - 2*xMargin) + xMargin;
      });

    points.exit().remove();

  };
}

$(function(){
  var viewModel = new ViewModel();
  viewModel.svg = d3.select("#vis").append('svg');
  viewModel.drawPoints();
  ko.applyBindings(viewModel);
})
