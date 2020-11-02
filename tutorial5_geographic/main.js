/**
 * CONSTANTS AND GLOBALS
 * */
const width = window.innerWidth * 0.9,
  height = window.innerHeight * 0.7,
  margin = { top: 20, bottom: 50, left: 60, right: 40 };

/** these variables allow us to access anything we manipulate in
 * init() but need access to in draw().
 * All these variables are empty before we assign something to them.*/
let svg;

/**
 * APPLICATION STATE
 * */
let state = {
  geojson: null, capital: null,
  hover: {
    Latitude: null, Longitude: null, State: null, Capital: null, Population: null
  }
};


/**
 * LOAD DATA
 * Using a Promise.all([]), we can load more than one dataset at a time
 * */
Promise.all([
  d3.json("../data/usState.json"),
  d3.csv("../data/usCapitals.csv", d3.autoType)])
  .then(([geojson, capital]) => {
    state.geojson = geojson
    state.capital = capital
    console.log("state: ", state)
    init()

  });

/**
 * INITIALIZING FUNCTION
 * this will be run *one time* when the data finishes loading in
 * */
function init() {
  // our projection and path are only defined once, and we don't need to access them in the draw function,
  // so they can be locally scoped to init()
  const projection = d3.geoAlbersUsa().fitSize([width, height], state.geojson);

  let path = d3.geoPath().projection(projection);
  console.log("projection", projection([-73, 40]));
  radius = d3.scaleSqrt([0, d3.max(state.capital, d => d.population)], [0, 15])
  // create an svg element in our main `d3-container` element
  svg = d3
    .select("#d3-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  /*const maplines = svg.selectAll("path.map-lines")
    .data(state.geojson.features)
    .join("path")
    .attr("class", "map-lines")
    .attr("d", d => path(d));
    */

  svg
    .selectAll(".state")
    // all of the features of the geojson, meaning all the states as individuals
    .data(state.geojson.features)
    .join("path")
    .attr("d", path)
    .attr("class", "state")
    .attr("fill", "LightSeaGreen")
    .on("mouseover", d => {
      // when the mouse rolls over this feature, do this
      state.hover["State"] = d.properties.NAME;
      draw(); // re-call the draw function when we set a new hoveredState
    })
    .on("mouseout", d => {
      state.hover["State"] = null
    });
  // Label the States
  svg
    .selectAll("text")
    .data(state.geojson.features)
    .join("svg:text")
    .text(d => d.properties.STUSPS)
    .attr("text-anchor", "middle")
    .attr("font-size", "8pt")
    .style("font-weight", "bold")
    .style("fill", "DarkBlue")
    .attr("dx", d => path.centroid(d)[0])
    .attr("dy", d => path.centroid(d)[1])

  //Add event listeners


  svg
    .on("mousemove", () => {
      // we can use d3.mouse() to tell us the exact x and y positions of our cursor
      const [mx, my] = d3.mouse(svg.node());
      // projection can be inverted to return [lat, long] from [x, y] in pixels
      const proj = projection.invert([mx, my]);
      state.hover["Longitude"] = d3.format(".2f")(proj[0]);
      state.hover["Latitude"] = d3.format(".2f")(proj[1]);
      draw();
    });

  svg
    .selectAll(".capital")
    .data(state.capital)
    .join("circle")
    .attr("r", d => radius(d.population))
    .attr("cx", d => projection([d.X, d.Y])[0])
    .attr("cy", d => projection([d.X, d.Y])[1])
    .on("mouseover", d => {
      state.hover["Capital"] = d.name;
      state.hover["Populations"] = d3.format(",")(d.population)
    })
    .on("mouseout", d => {
      state.hover["Capital"] = null;
      state.hover["Populations"] = null
    })
}

function draw() {
  hoverData = Object.entries(state.hover);
  console.log(hoverData);

  hoverContainer = d3.select("#hover-container")
    .selectAll("div.row")
    .data(hoverData)
    .join("div")
    .attr("class", "row")
    .html(
      d =>
        d[1] ? `${d[0]}: ${d[1]}` : null
    );

}