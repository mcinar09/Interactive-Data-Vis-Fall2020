/* CONSTANTS AND GLOBALS */
const width = window.innerWidth * 0.7,
  height = window.innerHeight * 0.7,
  margin = { top: 20, bottom: 50, left: 60, right: 40 },
  radius = 8,
  default_selection = "All";

// these variables allow us to access anything we manipulate in init() but need access to in draw().
// All these variables are empty before we assign something to them.
let svg;
let xScale;
let yScale;

/* APPLICATION STATE */
let state = {
  data: [],
  selectedCountry: "All" // + YOUR FILTER SELECTION
};

/* LOAD DATA */
d3.csv("../data/psatTestScores.csv", d3.autoType).then(raw_data => {
  // + SET YOUR DATA PATH
  console.log("raw_data", raw_data);
  state.data = raw_data;
  init();
});
console.log("margin left", margin.left)
console.log('margin right', width - margin.right)

/* INITIALIZING FUNCTION */
// this will be run *one time* when the data finishes loading in 
function init() {
  // + SCALES
  xScale = d3
    .scaleLinear()
    .domain(d3.extent(state.data, d => d.psat_cr))
    .range([margin.left, width - margin.right]);
  yScale = d3
    .scaleLinear()
    .domain(d3.extent(state.data, d => d.psat_m))
    .range([height - margin.bottom, margin.top]);

  // + AXES
  const xAxis = d3.axisBottom()
    .scale(xScale)
    .ticks(10);
  const yAxis = d3.axisLeft()
    .scale(yScale);
  // + UI ELEMENT SETUP

  const selectElement = d3.select("#dropdown").on("change", function () {
    // `this` === the selectElement
    // 'this.value' holds the dropdown value a user just selected
    console.log("new selected country is", this.value)
    state.selectedCountry = this.value;
    //console.log("new value is", this.value);
    draw(); // re-draw the graph based on this new selection
  });

  // add in dropdown options from the unique values in the data
  selectElement
    .selectAll("option")
    .data([
      ...Array.from(new Set(state.data.map(d => d.Country))),
      default_selection,
    ])
    // + ADD UNIQUE VALUES
    .join("option")
    .attr("value", d => d)
    .text(d => d);
  selectElement.property("value", default_selection);

  // + CREATE SVG ELEMENT
  svg = d3
    .select("#d3-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // + CALL AXES
  svg
    .append("g")
    .attr("class", "axis x-axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(xAxis)
    .append("text")
    .attr("class", "axis-label")
    .attr("x", "50%")
    .attr("dy", "3em")
    .text("PSAT_cr");

  // add the yAxis
  svg
    .append("g")
    .attr("class", "axis y-axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(yAxis)
    .append("text")
    .attr("class", "axis-label")
    .attr("y", "50%")
    .attr("dx", "-3em")
    .attr("writing-mode", "vertical-rl")
    .text("PSAT_m");


  draw(); // calls the draw function
}

/* DRAW FUNCTION */
// we call this everytime there is an update to the data/state
function draw() {

  // + FILTER DATA BASED ON STATE
  let filteredData = state.data;
  if (state.selectedCountry !== "All") {
    filteredData = state.data.filter(d => d.Country === state.selectedCountry);
  }

  const dot = svg
    .selectAll(".dot")
    .data(filteredData, d => d.Country)
    .join(
      enter =>
        enter // + HANDLE ENTER SELECTION
          .append("circle")
          .attr("class", "dot")
          .attr("stroke", "lightgrey")
          .attr("opacity", 0.5)
          .attr("fill", d => {
            if (d.Country === "Argentina") return "Blue";
            else if (d.Country === "New Zealand") return "Red";
            else return "Purple";
          })
          .attr("r", radius)
          .attr("cy", d => yScale(d.psat_m))
          .attr("cx", d => margin.left)
          .call(enter =>
            enter
              .transition()
              .delay(d => 100 * d.psat_cr)
              .duration(500)
              .attr("cx", d => xScale(d.psat_cr))
          ),
      // + HANDLE UPDATE SELECTION
      update =>
        update.call(update =>
          update
            .transition()
            .duration(250)
            .attr("stroke", "black")
            .transition()
            .duration(250)
            .attr("stroke", "lightgrey")
        ),
      // + HANDLE EXIT SELECTION
      exit =>
        exit.call(exit =>
          exit
            .transition()
            .delay(d => 50 * d.psat_cr)
            .duration(500)
            .attr("cx", width)
            .remove()
        )
    );
}
