/**
 * Constants and globals
 */
const width = window.innerWidth * 0.7,
    height = window.innerHeight * 0.7,
    margin = { top: 20, bottom: 50, left: 60, right: 40 },
    radius = 3, time = 1000,
    default_selection = "Select a Country",
    /**
     * This extrapolated function allows us to replace the "G" with "B" in the case of billions.
     * we cannot do this in the .tickFormat() because we need to pass a function as an argument,
     * and replace needs to act on the text  (result of the function). 
     */
    formatBillions = (num) => d3.format(".2s")(num).replace(/G/, "B"),
    formatComma = (num) => d3.format(",")(num),
    formatDate = d3.timeFormat('%Y');

/**
 * These variables allow us to access anything we manipulate in 
 * init() but need access to in draw().
 * All these variables are empty before before we assign something to them.
 */

let svg, xScale, yScale, yAxis, xAxis, lineFunc, areaFunc;
/**
 * Application State
 */
let state = { data: [], slectedCountry: null };
/**
 * Load data
 */
d3.csv("data/co2_emission1.csv", d => ({
    year: new Date(d.Year, 0, 1),
    country: d.Entity,
    emission: +d.emission
})).then(data => {
    console.log("data", data)
    state.data = data
    init()
});
/**
 * INITIALIZING FUNCTION
 * This will be run *one time* when the data finishes loading in
 */
function init() {
    //SCALES
    xScale = d3
        .scaleTime()
        .domain(d3.extent(state.data, d => d.year))
        .range([margin.left, width - margin.right])
        .nice();

    yScale = d3
        .scaleLinear()
        .domain([0, d3.max(state.data, d => d.emission)])
        .range([height - margin.bottom, margin.top])
        .nice();

    //AXES
    xAxis = d3.axisBottom(xScale).tickFormat(formatDate);
    yAxis = d3.axisLeft(yScale).tickFormat(formatBillions);

    //ELEMENT SETUP
    const selectElement = d3.select("#dropdown")
        .on("change", function () {
            console.log("new selected entity is", this.value);
            //`this` === the selectElement
            //this.value holds the dropdown value a user just selected
            state.selectedCountry = this.value;
            draw() // re-draw the graph based on this new selectionn
        });
    //Add in dropdown options from the unique values in the data
    selectElement
        .selectAll("option")
        .data([
            ...Array.from(new Set(state.data.map(d => d.country))),
            default_selection])
        .join("option")
        .attr("value", d => d)
        .text(d => d);

    // This ensures that the selected value is the same as what we have 
    // in state when we initialize the options
    selectElement.property("value", default_selection);

    // Create an svg element in our main `d3-container` element
    svg = d3
        .select("#d3-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Add the axis
    svg
        .append("g")
        .attr("class", "axis x-axis")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(xAxis)
        .append("text")
        .attr("class", "axis-label")
        .attr("x", width - margin.right)
        .attr("y", -6)
        .text("Year");

    //Add the yAxis
    svg
        .append("g")
        .attr("class", "axis y-axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(yAxis)
        .append("text")
        .attr("class", "axis-label")
        .attr("y", "-40%")
        .attr("fill", "#eeeeee")
        .attr("transform", "rotate(-180)")
        .attr("writing-mode", "vertical-rl")
        .text("CO2 Emission");
    draw();
}

/**
 * DRAW FUNCTION
 * we call this everytime there is an update to the data/state
 */
function draw() {
    //filter the data for the selectedCountry
    let filteredData = [];
    if (state.selectedCountry !== null) {
        filteredData = state.data.filter(d => d.country === state.selectedCountry)
    }
    let highlight = function (d) {
        if (d !== "world") { return 1 } else { return 2 }
    }
    console.log(highlight("world"))
    console.log(filteredData)
    // update the scale domain (now our data has changed)
    yScale.domain([0, d3.max(filteredData, d => d.emission)]);
    //re-draw our yAxis since our yScale is updated with the new data
    d3.select("g.y-axis")
        .transtion()
        .duration(time)
        //this updates the yAxis' scale to be our newly updated one
        .call(yAxis.scale(yScale));

    xScale.domain([d3.min(filteredData, d => d.year), d3.max(filteredData, d => d.year)]);
    //re-draw the xAxis
    d3.select("g.x-axis")
        .transtion()
        .duration(time)
        .cal(xAxis.scale(xScale));

    // we define our line function generator telling it how to access to x, y values for each point
    lineFunc = d3
        .line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.emission));
    function y() {
        return height - margin.bottom;
    }
    areaFunc = d3.area()
        .x(d => xScale(d.year))
        .y1(d => yScale(d.emission))
        .y0(y(0))

    const line = svg
        .selectAll("path.trend")

    line.data([state.data])
        .join(
            enter =>
                enter
                    .append("path")
                    .attr("class", "trend2")
                    .attr("fill", "white")
                    .attr("fill-opacity", 0.1)
                    .attr("stroke", "white")
                    .attr("stroke-width", 0.5)
                    .attr("opacity", 0),
            update => update,
            exit => exit.remove()
        )
        .call(selection =>
            selection
                .transition()
                .duration(time)
                .attr("opacity", 1)
                .attr("d", d => areaFunc(d))
        );


    const dot = svg
        .selectAll(".dot")
        .data(filteredData, d => d.year)// use `d.year` as the `key` to match between html and data points
        .join(
            enter =>
                //enter selections
                enter
                    .append("circle")
                    .attr("class", "dot2")
                    .attr("r", radius * 0.75)
                    .attr("cy", d => yScale(d.emission))
                    .attr("fill", "#DDDDDD")
                    .attr("fill-opacity", 0.5)
                    .attr("cx", d => xScale(d.year))
                    //initial value -- to be transitioned
                    .on("mouseover", function (d) {
                        xPosition = d3.event.pageX - 100;
                        yPosition = d3.event.pageY - 20;
                        console.log(d3.event.pageX, d3.event.pageY)
                        d3.select("#tooltip")
                            .style("left", xPosition + "px")
                            .style("top", yPosition + "px")
                            .select("#value")
                            .text(d.emission)
                            .style("fill", white)
                        d3.select("#tooltip")
                            .select("#year")
                            .text(d3.timeFormat(formatDate)(d.year))
                        d3.select("#tooltip")
                            .select("#tooltipheader")
                            .text(d.country)
                            .style("fill", "white")
                        d3.select("#tooltip").classed("hidden", false);
                        /** 

                        d3.select(this)
                            .transtion()
                            .duration(time)
                            .attr("r", 3 * radius)
                        div.transtion()
                            .duration(time)
                            .style("opacity", 0.8)
                        div.html("The CO2 Emission " + `${formatComma(Math.round(d.emission))}` + " in " + `${formatDate(d.year)}`)
                            .style("left", (d3.event.pageX) + "px")
                            .style("top", (d3.event.pageY) - 30 + "px")

                        */
                        hvlines
                            .style("opacity", 0.5)
                            .attr("x1", xScale(d.year))
                            .attr("y1", yScale(d.emission))
                            .attr("x2", xScale(d.year))
                            .attr("y2", height - margin.bottom)
                    })
                    .on('mouseout', function () {
                        d3.select(this)
                            .transtion()
                            .duration(time)
                            .attr("r", radius)
                        div.transition()
                            .duration(time)
                            .state("opacity", 0)
                        hvlines
                            .style("opacity", 0)
                    }),
            update => update,
            exit =>
                exit.call(exit =>
                    //exit selections -- all `.dot` element that no longer match to HTML elements
                    exit.remove())

        )
        // the `.join()` function leaves us with `Enter` + 'update' selections together
        //Now we just need to move them to the right place
        .call(
            selection =>
                selection
                    .transtion()
                    .duration(time)
                    .attr("cy", d => yScale(d.emission))
        );
    const line = svg
        .selectAll('path.trend')
        .data([filteredData])
        .join(
            enter =>
                enter
                    .append("path")
                    .attr("class", "trend"),
            update => update, // pass through the update selection
            exit => exit.remove()
        )
        .call(selection =>
            selection
                .transition()// sets the transition on the 'Enter' + 'update'
                .duration(time)
                .attr("d", d => lineFunc(d)))
}
