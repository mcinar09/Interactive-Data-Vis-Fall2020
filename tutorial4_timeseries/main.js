/* CONSTANTS AND GLOBALS */
const width = window.innerWidth * 0.7,
  height = window.innerHeight * 0.7,
  margin = { top: 20, bottom: 50, left: 60, right: 40 },
  radius = 3,
  default_selection = "Select a Country";

//formatBillions = (num) => d3.format(".2s")(num).replace(/G/, 'B'),
// formatComma = (num) => d3.format(",")(num),
// formatDate = d3.timeFormat('%Y');

// these variables allow us to access anything we manipulate in init() but need access to in draw().
// All these variables are empty before we assign something to them.
let svg;
let xScale;
let yScale;
let yAxis;

/* APPLICATION STATE */
let state = {
  data: [],
  selectedCountry: null, // + YOUR FILTER SELECTION
};

/* LOAD DATA */
// + SET YOUR DATA PATH
d3.csv("../data/number_of_cervical_cancer.csv", d => ({
  year: new Date(d.year, 0, 1),
  country: d.country,
  number: +d.number
})
  //year: new Date(d.year, 0, 1),
  //country: d.country,
  //number: +d.number
).then(raw_data => {
  console.log("raw_data", raw_data);
  state.data = raw_data;
  // console.log(state.data)
  init();
});

/* INITIALIZING FUNCTION */
// this will be run *one time* when the data finishes loading in
function init() {
  // + SCALES
  xScale = d3
    .scaleTime()
    .domain(d3.extent(state.data, d => d.year))
    .range([margin.left, width - margin.right]);

  yScale = d3
    .scaleLinear()
    .domain([0, d3.max(state.data, d => d.number)])
    .range([height - margin.bottom, margin.top]);
  // + AXES
  yAxis = d3.axisLeft(yScale);
  const xAxis = d3.axisBottom(xScale);


  // + UI ELEMENT SETUP


  const selectElement = d3.select("#dropdown").on("change", function () {
    // `this` === the selectElement
    // 'this.value' holds the dropdown value a user just selected
    state.selectedCountry = this.value; // + UPDATE STATE WITH YOUR SELECTED VALUE
    //this.value
    console.log("new value is", this.value);
    draw(); // re-draw the graph based on this new selection
  });

  // add in dropdown options from the unique values in the data
  selectElement
    .selectAll("option")
    .data([
      ...Array.from(new Set(state.data.map(d => d.country))),
      default_selection]) // + ADD DATA VALUES FOR DROPDOWN
    .join("option")
    .attr("value", d => d)
    .text(d => d);

  // + SET SELECT ELEMENT'S DEFAULT VALUE (optional)
  selectElement.property("value", default_selection);

  // + CREATE SVG ELEMENT
  svg = d3
    .select("#d3-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // + CALL AXES
  //Add the x-axis
  svg
    .append("g")
    .attr("class", "axis x-axis")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(xAxis)
    .append("text")
    .attr("class", "axis-label")
    .attr("x", "50%")
    .attr("dy", "3em")
    .text("Year");

  //Add the y-axis
  svg
    .append("g")
    .attr("class", "axis y-axis")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(yAxis)
    .append("text")
    .attr("class", "axis-label")
    .attr("y", "50%")
    .attr("dx", "-3em")
    .attr("writing-mode", "vertical-rl")
    .text("Number of Cervical Cancer Cases");


  draw(); // calls the draw function
}

/* DRAW FUNCTION */
// we call this everytime there is an update to the data/state
function draw() {
  // + FILTER DATA BASED ON STATE
  let filteredData = [];
  if (state.selectedCountry !== null) {
    filteredData = state.data.filter(d => d.country === state.selectedCountry)
  }
  console.log(filteredData);
  //
  // + UPDATE SCALE(S), if needed
  yScale.domain([0, d3.max(filteredData, d => d.number)]);
  // + UPDATE AXIS/AXES, if needed
  d3.select("g.y-axis")
    .transition()
    .duration(1000)
    .call(yAxis.scale(yScale));

  // we define our line function generator telling it how to access the x,y values for each point

  const lineFunc = d3
    .line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.number));
  const areaFunc = d3
    .area()
    .x(d => xScale(d.year))
    .y1(d => yScale(d.number))
    .y0(yScale(0));

  // + DRAW CIRCLES, if you decide to
  const dot = svg
    .selectAll(".dot")
    .data(filteredData, d => d.country) // use `d.year` as the `key` to match between HTML and data elements
    .join(
      enter =>   // + HANDLE ENTER SELECTION
        enter   // enter selections -- all data elements that don't have a `.dot` element attached to them yet
          .append("circle")
          .attr("fill", "green")
          .attr("class", "dot")
          .attr("r", radius)
          .attr("cx", d => xScale(d.year))
          .attr("cy", d => yScale(d.number)),



      update => update, // + HANDLE UPDATE SELECTION
      exit =>   // + HANDLE EXIT SELECTION
        exit.call(exit =>
          // exit selections -- all the `.dot` element that no longer match to HTML elements 
          exit
            .remove()

        )
    )

    .call(
      selection =>
        selection
          .transition()
          .duration(1000)
          .attr("cy", d => yScale(d.number))
    );
  //
  // + DRAW LINE AND AREA
  const line = svg
    .selectAll("path.trend")
    .data([filteredData])
    .join(
      enter =>
        enter
          .append("path")
          .attr("class", "trend")
          .attr("opacity", 0),
      //    .attr(0, "opacity"), // start them off as opacity 0 and fade them in
      update => update, // pass through the update selection
      exit => exit
        .transition()
        .remove(),
    )
    .call(selection =>
      selection
        .transition()
        .duration(1000)
        .attr("opacity", 0.8)
        .attr("d", d => lineFunc(d))
    )
  const area = svg
    .selectAll(".area")
    .data([filteredData])
    .join("path")
    .attr("class", "area")
    .attr("cx", (width - margin.left))
    .attr("d", d => areaFunc(d));




}
