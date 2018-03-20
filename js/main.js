
//self calling global function
(function(){
  const attributes = ['malariaCases', 'allMalariaDeaths', 'deathsUnderFive', 'bedNets', 'treatment'];
  let expressed = attributes[3]; //initial attribute
  const attrFull = {
    malariaCases : 'Notified cases of malaria per 100,000 people',
    allMalariaDeaths : 'Malaria deaths per 100,000 people',
    deathsUnderFive : 'Malaria death rate per 100,000 people under 5',
    bedNets : 'Percent under 5 sleeping under insecticide-treated bed nets',
    treatment : 'Percent under 5 with fever being treated with anti-malarial drugs'
  }

  //chart frame dimensions
  const chartWidth = window.innerWidth * 0.5,
      chartHeight = 460,
      leftPadding = 40,
      rightPadding = 2,
      topBottomPadding = 5,
      chartInnerWidth = chartWidth - leftPadding - rightPadding,
      chartInnerHeight = chartHeight - topBottomPadding * 2,
      translate = "translate(" + leftPadding + "," + topBottomPadding + ")";
//need to dynamically update yScale domain
      let yScale = d3.scaleLinear()
          .range([chartHeight-10,0])
          .domain([0, 100]);
       yAxis = d3.axisLeft(yScale);
  //start script when window loads
  window.onload = setMap();

  function setSVG(africanCountries, map, path, colorScale){
      const countries = map.selectAll('countries')
      .data(africanCountries)
      .enter()
      .append('path')
      .attr('d', path)
      .attr('class', d=> 'countries '+ "co" + d.properties.Code)
      .style("fill", d=>choropleth(d.properties, colorScale))
      .on("mouseover", d => highlight(d.properties))
      .on("mouseout", d => dehighlight(d.properties))
      .on("mousemove", moveLabel);

      let desc = countries.append("desc")
    .text('{"stroke": "#000", "stroke-width": "0.5px"}');
    };

  // function setGraticule(map, path){
  //     //...GRATICULE BLOCKS FROM PREVIOUS MODULE
  //     //distortion lines
  //     const graticule = d3.geoGraticule()
  //     .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude
  //
  //     //create graticule lines
  //     const gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
  //     .data(graticule.lines()) //bind graticule lines to each element to be created
  //     .enter() //create an element for each datum
  //     .append("path") //append each element to the svg as a path element
  //     .attr("class", "gratLines") //assign class for styling
  //     .attr("d", path); //project graticule line
  // };
  function joinData(africanCountries, malaria){
      //...DATA JOIN LOOPS FROM EXAMPLE 1.1
      //loop through csv to assign each set of csv attribute values to geojson region
      for (let i=0; i<malaria.length; i++){
        let csvCountry = malaria[i]; //the current country in the CVS
        let csvCode = csvCountry.Code; //the code of the current country in the CSV

        //loop through geojson regions to find correct region
        for (let j=0; j<africanCountries.length; j++){

          let jsonCountry = africanCountries[j].properties; //the current region geojson properties
          let jsonCode = jsonCountry.Code; //the geojson primary key code

          //where primary keys match, transfer csv data to geojson properties object
          if (jsonCode == csvCode){
            //assign all attributes and values
            attributes.forEach(function(a){
              let val = parseFloat(csvCountry[a]); //get csv attribute value

              jsonCountry[a] = val; //assign attribute and value to geojson properties

            });
          };
        };
      };

      return africanCountries;
  };

  //function to create color scale generator
function makeColorScale(data){
    const colorClasses = ["#D4B9DA", "#C994C7","#DF65B0","#DD1C77","#980043"];

    //create color scale generator
    const colorScale = d3.scaleQuantile().range(colorClasses);

    //build array of all values of the expressed attribute
    let domainArray = [];
    for (let i=0; i<data.length; i++){
        let val = parseFloat(data[i][expressed]);
        domainArray.push(val);

    };

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);

    return colorScale;
};

//function to test for data value and return color
function choropleth(props, colorScale){
    //make sure attribute value is a number
    let val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {
        return "#CCC";
    };
};

function setChart(malaria, colorScale){

const fraction = chartWidth / malaria.length;
    //create a second svg element to hold the bar chart
    //create vertical axis generator
   //yAxis = d3.axisLeft(yScale);


    const chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

        const chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

        var axis = chart.append("g")
               .attr("class", "axis")
               .attr("transform", translate)
               .call(yAxis);

    //create frame for chart border
   const chartFrame = chart.append("rect")
       .attr("class", "chartFrame")
       .attr("width", chartInnerWidth)
       .attr("height", chartInnerHeight)
       .attr("transform", translate);

        //set bars for each country
    var bars = chart.selectAll(".bars")
        .data(malaria)
        .enter()
        .append("rect")
        .sort((a, b)=> b[expressed]-a[expressed])
        .attr("class", d =>  "bar " +"co"+ d.Code)
        .attr("width", chartInnerWidth / malaria.length - 1)
        .on("mouseover", highlight)
        .on("mouseout", dehighlight)
        .on("mousemove", moveLabel);

        let desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');

        //below Example 2.8...create a text element for the chart title
        var chartTitle = chart.append("text")
                .attr("x", 20)
                .attr("y", 40)
                .attr("class", "chartTitle")
                .text(attrFull[expressed])
                .attr("transform", translate);

        updateChart(bars, malaria.length, colorScale);
};
//function to create a dropdown menu for attribute selection
function createDropdown(malaria){
    //add select element
    const dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value, malaria);
        });

    //add initial option
    const titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

    //add attribute name options
    const attrOptions = dropdown.selectAll("attrOptions")
        .data(attributes)
        .enter()
        .append("option")
        .attr("value", d => d )
        .text(d => d );
};

//dropdown change listener handler
function changeAttribute(attribute, malaria){
    //change the expressed attribute
    expressed = attribute;

    var max = d3.max(malaria, (d) => +d[expressed]);
    if (max < 200){
      max = Math.ceil(max/100)*100;
    } else{
      max = 40000;
    }

    yScale.domain([0, max]);
    //recreate the color scale
    let colorScale = makeColorScale(malaria);

    //recolor enumeration units
    const countries = d3.selectAll(".countries")
        .transition()
        .duration(500)
        .style("fill", d => choropleth(d.properties, colorScale));

        //re-sort, resize, and recolor bars
    var bars = d3.selectAll(".bar")
        .sort((a, b)=> b[expressed]-a[expressed])
        .transition() //add animation
        .delay((d, i) =>i * 20)
        .duration(500);


        updateChart(bars, malaria.length, colorScale)
};

function updateChart(bars, n, colorScale){
    //position bars
    bars.attr("x", (d, i) => i * (chartInnerWidth / n)+ leftPadding)
    .attr("height", d => chartHeight - yScale(parseFloat(d[expressed]))-10)
    .attr("y", d => yScale(parseFloat(d[expressed])) +topBottomPadding)
    .style('fill', d => choropleth(d, colorScale));

    d3.selectAll("g.axis")
      .call(yAxis);

    d3.selectAll(".chartTitle")
        .text(attrFull[expressed]);
};

//function to highlight enumeration units and bars
function highlight(props){

   //change stroke
   var selected = d3.selectAll('.co' + props.Code)
       .style("stroke", "blue")
       .style("stroke-width", "2");

       setLabel(props);

};

//function to reset the element style
function dehighlight(props){
   var selected = d3.selectAll(".co" + props.Code)
   //used from lecture because for some reason arrow function didn't work in map
   .style("stroke", function(){
         return getStyle(this, "stroke")
     })
     .style("stroke-width", function(){
         return getStyle(this, "stroke-width")
     });

   function getStyle(element, styleName){
       var styleText = d3.select(element)
           .select("desc")
           .text();

       var styleObject = JSON.parse(styleText);

       return styleObject[styleName];
   };
   d3.select(".infolabel")
     .remove();
};


function moveLabel(){
    //get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;

    //use coordinates of mousemove event to set label coordinates
    var x1 = d3.event.clientX + 10,
        y1 = d3.event.clientY - 75,
        x2 = d3.event.clientX - labelWidth - 10,
        y2 = d3.event.clientY + 25;

    //horizontal label coordinate, testing for overflow
    var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1;
    //vertical label coordinate, testing for overflow
    var y = d3.event.clientY < 75 ? y2 : y1;

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};
//function to create dynamic label
function setLabel(props){
    //label content
    var labelAttribute = "<h1>" + props[expressed] +
        "</h1><b>" + expressed + "</b>";

    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", "co" + props.Code + "_label")
        .html(labelAttribute);

    var countryName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.Country);
};
  //set up map
  function setMap(){
    //map dimensions
    const width = window.innerWidth * 0.425;
    const height = 560;

    //map container
    const map = d3.select("body")
    .append("svg")
    .attr("class", "map")
    .attr("width", width)
    .attr("height", height);

    //set projection and centering of map
    const projection = d3.geoAlbers()
    .center([1, 25])
    .rotate([-13.55, 22.73, 1])
    .parallels([18.59, 44.19])
    .scale(388.26)
    .translate([width / 2, height / 2]);

    //create a path to draw the geometry and set the projection
    const path = d3.geoPath()
    .projection(projection);

    //use quere to load asynchronous data in parallel
    d3.queue()
    .defer(d3.csv, "doc/MalariaData.csv") //malaria data
    .defer(d3.json, "doc/Africa.topojson") //Afria spatial data
    .await(ready);

    function ready(error, malaria, africa){
      createDropdown(malaria);
      //convert topojson into geojson
      const africanCountries = topojson.feature(africa, africa.objects.Africa).features;

      //join the 2 datasets together
      const joinedData = joinData(africanCountries, malaria);

      //create the color scale
      let colorScale = makeColorScale(malaria);
      //make SVG map
      setSVG(joinedData, map, path, colorScale);
      //set up distortion lines
      //setGraticule(map, path);

      setChart(malaria, colorScale);
    };
  };
})();
