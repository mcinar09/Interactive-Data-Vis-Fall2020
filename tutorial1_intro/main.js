d3.csv("./PSAT_Argentina.csv").then(data => {
    console.log("data: ", data);
    // select the 'table' container in the HTML
    const table = d3.select("#d3-table");

    /**Header */
    const thead = table.append('thead');
    thead
        .append('tr')
        .append('th')
        .attr('colspan', '5')
        .text('PSAT Scores');

    thead
        .append('tr')
        .selectAll('th')
        .data(data.columns)
        .join('td')
        .text(d => d);

    /**BODY */
    const rows = table
        .append('tbody')
        .selectAll('tr')
        .data(data)
        .join('tr')





    rows
        .selectAll('td')
        .data(d => Object.values(d))
        .join('td')
        .attr('class', d => (+d > 50 && +d <= 81) ? 'high' : null)
        .text(d => d);


})



