/*--------------------------------------------------------------------
GGR472 LAB 4: Incorporating GIS Analysis into web maps using Turf.js 
--------------------------------------------------------------------*/

/*--------------------------------------------------------------------
Step 1: INITIALIZE MAP
--------------------------------------------------------------------*/
// Define access token
mapboxgl.accessToken = 'pk.eyJ1Ijoic3BibGlzYXJlbmtvMTIiLCJhIjoiY2xzMjlodmljMGthcjJrbXRibnRwZ2d3eCJ9.gxylQolcBDuJTH_WfI6MrA'; //****ADD YOUR PUBLIC ACCESS TOKEN*****

// Initialize map and edit to your preference
const map = new mapboxgl.Map({
    container: 'map', // container id in HTML
    style: '',  // ****ADD MAP STYLE HERE *****
    center: [-79.37, 43.715],  // starting point, longitude/latitude
    zoom: 10 // starting zoom level
});

// Zoom controls
map.addControl(new mapboxgl.NavigationControl(), "top-left");

// Full screen control
map.addControl(new mapboxgl.FullscreenControl(), "top-left");



/*--------------------------------------------------------------------
Step 2: VIEW GEOJSON POINT DATA ON MAP
--------------------------------------------------------------------*/
//HINT: Create an empty variable
//      Use the fetch method to access the GeoJSON from your online repository
//      Convert the response to JSON format and then store the response in your new variable

let cycle;

fetch("https://raw.githubusercontent.com/smith-lg/ggr472-lab4/main/data/pedcyc_collision_06-21.geojson")
    .then(response => response.json())
    .then(response => {
        console.log(response);
        cycle = response;
    })



/*--------------------------------------------------------------------
    Step 3: CREATE BOUNDING BOX AND HEXGRID
--------------------------------------------------------------------*/
//HINT: All code to create and view the hexgrid will go inside a map load event handler
//      First create a bounding box around the collision point data then store as a feature collection variable
//      Access and store the bounding box coordinates as an array variable
//      Use bounding box coordinates as argument in the turf hexgrid function


map.on('load',() => {
    let bboxgeojson;
    let bbox = turf.envelope(cycle);

    bboxgeojson = {
        "type": "FeatureCollection",
        "features": [bbox]
    }

    let transformedbbox = turf.transformScale(bbox, 1.10);

    console.log(bbox);
    console.log(bbox.geometry.coordinates);

    let bboxmaxmin = [transformedbbox.geometry.coordinates[0][0][0],
                      transformedbbox.geometry.coordinates[0][0][1],
                      transformedbbox.geometry.coordinates[0][2][0],
                      transformedbbox.geometry.coordinates[0][2][1]];
    let hexbbox = turf.hexGrid(bboxmaxmin, 0.5, {units: "kilometers"});

    let hexbincollisions = turf.collect(hexbbox, cycle, "_id", "values");

    let maxcollisions = 0;

    hexbincollisions.features.forEach((feature) => {
        feature.properties.COUNT = feature.properties.values.length
        if (feature.properties.COUNT > maxcollisions) {
            console.log(feature);
            maxcollisions = feature.properties.COUNT
        }
    });
    console.log(hexbincollisions)

    map.addSource("collis-bbox", {
        type: "geojson",
        data: bboxgeojson
    });

    map.addLayer({
        "id": "cyclepoints",
        "type": "fill",
        "source": "collis-bbox",
        "paint": {
            "fill-color": "#000000"
        }
    })

    map.addSource("hexboxes", {
        type: "geojson",
        data: hexbbox
    });

    map.addLayer ({
        "id": "hexbinbox",
        "type": "fill",
        "source": "hexboxes",
        "paint": {
            "fill-color": [
                "step",
                ["get", "COUNT"],
                "#ffbdbd",
                5, "#ff7070",
                10, "#ff0000",
                20, "#a80000",
                30, "#4d0000"

            ],
            "layout": {
                "visibility": "none"
            },
            "fill-outline-color": "#000000"
        }
    });

    
});

map.on("click", "hexbinbox", (e) => {
    new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML("<b>Collision count:</b>" + e.features[0].properties.COUNT)
        .addTo(map);
})

map.on('mouseenter', 'hexbinbox', (e) => {
    map.getCanvas().style.cursor = 'pointer'; //When hovering over "parks-shapes layer" change the mouse icon to pointer
});

map.on('mouseleave', 'hexbinbox', (e) => {
    map.getCanvas().style.cursor = ''; //When pointer icon is no longer over "parks-shapes" layer reverse back to mouse cursor icon
});



document.getElementById('collision-check-id').addEventListener('change', (e) => {
    map.setLayoutProperty(
        'hexbinbox',
        'visibility',
        e.target.checked ? 'visible' : 'none'
    );
});

document.getElementById('bbox-id').addEventListener('change', (e) => {
    map.setLayoutProperty(
        'cyclepoints',
        'visibility',
        e.target.checked ? 'visible' : 'none'
    );
});

let collisionfilter

//Add new event listener
document.getElementById("collision-type-filter").addEventListener('click',(e) => { 
    //Set the value of the areapoints variable  
    collisionfilter = document.getElementById('collision-class').value;

    //Create conditional if statements which based on the value of areapoints, detemrines the features of the geojson layer that get filtered or removed
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



/*--------------------------------------------------------------------
Step 4: AGGREGATE COLLISIONS BY HEXGRID
--------------------------------------------------------------------*/
//HINT: Use Turf collect function to collect all '_id' properties from the collision points data for each heaxagon
//      View the collect output in the console. Where there are no intersecting points in polygons, arrays will be empty



// /*--------------------------------------------------------------------
// Step 5: FINALIZE YOUR WEB MAP
// --------------------------------------------------------------------*/
//HINT: Think about the display of your data and usability of your web map.
//      Update the addlayer paint properties for your hexgrid using:
//        - an expression
//        - The COUNT attribute
//        - The maximum number of collisions found in a hexagon
//      Add a legend and additional functionality including pop-up windows


