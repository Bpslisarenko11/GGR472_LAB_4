// Access Token for map style
mapboxgl.accessToken = 'pk.eyJ1Ijoic3BibGlzYXJlbmtvMTIiLCJhIjoiY2xzMjlodmljMGthcjJrbXRibnRwZ2d3eCJ9.gxylQolcBDuJTH_WfI6MrA';

// Create new map constant, add mapbox style, and center and zoom level
const map = new mapboxgl.Map({
    container: 'map', // container id in HTML
    style: 'mapbox://styles/spblisarenko12/cltwahxe501zf01p54p952789',  // mapbox style
    center: [-79.36, 43.715],  // center point coordinates of the map load in latitude and longitude
    zoom: 10, // starting zoom level of the map load
});

// Zoom controls for the map, and position in top-left corner
map.addControl(new mapboxgl.NavigationControl(), "top-left");

// Full screen control option, and position in top-left corner
map.addControl(new mapboxgl.FullscreenControl(), "top-left");


// New empty variable
let cycle;

// Use fetch method to access URL for GeoJSON and add it to variable
fetch("https://bpslisarenko11.github.io/GGR472_LAB_4/data/pedcyc_collision_06-21.geojson")
    .then(response => response.json())
    .then(response => {
        console.log(response);
        cycle = response;
    })


// load map
map.on('load',() => {
    let bboxgeojson; // create new empty variable
    let bbox = turf.envelope(cycle); //Using envelope method create bounding box for points from the GeoJSON

    //Store the bounding box GeoJSON in the new variable
    bboxgeojson = {
        "type": "FeatureCollection",
        "features": [bbox]
    }

    //Use transformScale method to increase the bbox envelope 5%
    let transformedbbox = turf.transformScale(bbox, 1.05);

    console.log(bbox);
    console.log(bbox.geometry.coordinates);

    //Set a Hexbin grid and define the corners of the grid based on the bounding box corner coordinates
    let bboxmaxmin = [transformedbbox.geometry.coordinates[0][0][0],
                      transformedbbox.geometry.coordinates[0][0][1],
                      transformedbbox.geometry.coordinates[0][2][0],
                      transformedbbox.geometry.coordinates[0][2][1]];
    let hexbbox = turf.hexGrid(bboxmaxmin, 0.5, {units: "kilometers"}); //Set units to kilometers

    //Obtain the "_id" and "values" properties from the "cycle" points layer per hexbin polygon in "hexbox"
    let hexbincollisions = turf.collect(hexbbox, cycle, "_id", "values");

    //Set new variable equal to 0
    let maxcollisions = 0;

    //Use count method to count the number of points inside each hexbin
    hexbincollisions.features.forEach((feature) => {
        feature.properties.COUNT = feature.properties.values.length
        if (feature.properties.COUNT > maxcollisions) {
            console.log(feature);
            maxcollisions = feature.properties.COUNT
        }
    });
    console.log(hexbincollisions)

    //Add the bounding box geoJSON source
    map.addSource("collis-bbox", {
        type: "geojson",
        data: bboxgeojson
    });

    //Add the bounding box layer to the map
    map.addLayer({
        "id": "cyclepoints",
        "type": "fill",
        "source": "collis-bbox",
        "paint": {
            "fill-color": "#000000",
            "fill-opacity": 0.6 //Make the layer partially transparent
        }
    })

    //Add the hexbin layer source
    map.addSource("hexboxes", {
        type: "geojson",
        data: hexbbox
    });

    //Add the hexbin layer to the map
    map.addLayer ({
        "id": "hexbinbox",
        "type": "fill",
        "source": "hexboxes",
        "paint": {
            "fill-color": [
                //Set different colours to different hexbins based on the number of collisions within it
                "step",
                ["get", "COUNT"],
                "#ffbdbd",
                5, "#ff7070",
                10, "#ff0000",
                20, "#a80000",
                30, "#4d0000"

            ],
            "fill-outline-color": "#000000"
        },
    })

    //Add the collision points from the URL source
    map.addSource("collision_points", {
        type: "geojson",
        data: 'https://bpslisarenko11.github.io/GGR472_LAB_4/data/pedcyc_collision_06-21.geojson', // Link to GeoJSON link in GitHub
    
    });

    //Add the GeoJSON from the source as a new points layer
    map.addLayer({
        "id": "cycle_collisions_point",
        "type": "circle",
        "source": "collision_points",
        "paint": {
            "circle-color": "#00118f",
            "circle-opacity": 1.0,
            "circle-outline-color": "#002aff",
            "circle-radius": 4, //Make the points slightly smaller in size

        },
        //Set the layer to be not visible on initial map load
        "layout": {
            "visibility": "none"
        }
    });

    
});

//Add a pop-up for the hexbin layer that lists the number of collision points in each hexbin area
map.on("click", "hexbinbox", (e) => {
    new mapboxgl.Popup()
        .setLngLat(e.lngLat) //Sets the position of the pop-up based on the click location
        .setHTML("<b>Collision count:</b>" + e.features[0].properties.COUNT) //Uses the COUNT method to add the number of collision in each hexbin to the pop-up
        .addTo(map);
})

//Add a pop-up for the collision points layer
map.on("click", "cycle_collisions_point", (e) => {
    new mapboxgl.Popup()
        .setLngLat(e.lngLat) //Set the location for the pop-up to appear
        .setHTML("<b>Year: </b>" + e.features[0].properties.YEAR + "<br>" + 
        "<b>Injury Result: </b>" + e.features[0].properties.ACCLASS) //Add the year and injuryresult properties to the pop-up
        .addTo(map);
})


map.on('mouseenter', ['hexbinbox', 'cycle_collisions_point'], (e) => {
    map.getCanvas().style.cursor = 'pointer'; //When hovering over "hexbinbox" and "cycle_collisions_point" layers, change the mouse icon to pointer
});

map.on('mouseleave', ['hexbinbox', 'cycle_collisions_point'], (e) => {
    map.getCanvas().style.cursor = ''; //When pointer icon is no longer over "hexbinbox" and "cycle_collisions_point" layers reverse back to mouse cursor icon
});

// Add event listener fro a button that when clicked will change the zoom level
document.getElementById('zoom-level-button').addEventListener('click', () => {
    map.flyTo({
        //reset back to initial coordinates and zoom level of map
        center: [-79.36, 43.715],
        zoom: 10,
        essential: true
    });
});


//Change the visibility of the hexbin layer when the check box is checked or not
document.getElementById('collision-check-id').addEventListener('change', (e) => {
    map.setLayoutProperty(
        'hexbinbox',
        'visibility',
        e.target.checked ? 'visible' : 'none'
    );
});

//Change the visibility of the bounding box layer when the check box is checked or not
document.getElementById('bbox-id').addEventListener('change', (e) => {
    map.setLayoutProperty(
        'cyclepoints',
        'visibility',
        e.target.checked ? 'visible' : 'none'
    );
});

//Change the visibility of the collision points layer when the check box is checked or not
document.getElementById('points-id').addEventListener('change', (e) => {
    map.setLayoutProperty(
        'cycle_collisions_point',
        "visibility",
        e.target.checked ? "visible" : "none",
        e.target.checked ? 'none' : 'visible'
    );
});

//Set new variable
let collisionfilter

//Add new event listener
document.getElementById("collision-type-filter").addEventListener('click',(e) => { 
    //Set the value of the collisionfilter variable  
    collisionfilter = document.getElementById('collision-class').value;

    //Create conditional if statements that determine which values of the hexbin layer get filtered
    if (collisionfilter == '0-5') {
        map.setFilter(
            "hexbinbox",
            [ "<", ["get", "COUNT"], 5]
        );
    };

    if (collisionfilter == '5-10') {
        map.setFilter(
            "hexbinbox",
            [ "all", [">=", ["get", "COUNT"], 5], [ "<", ["get", "COUNT"], 10]]
        );
    };

    if (collisionfilter == '10-20') {
        map.setFilter(
            "hexbinbox",
            [ "all", [">=", ["get", "COUNT"], 10], [ "<", ["get", "COUNT"], 20]]
        );
    };

    if (collisionfilter == '20-30') {
        map.setFilter(
            "hexbinbox",
            [ "all", [">=", ["get", "COUNT"], 20], [ "<", ["get", "COUNT"], 30]]
        );
    };

    if (collisionfilter == '>30') {
        map.setFilter(
            "hexbinbox",
            [">=", ["get", "COUNT"], 30]
        );
    };

    if (collisionfilter == 'All-collisions') {
        map.setFilter(
            "hexbinbox",
            ["has", "COUNT"]
        );
    }
})


