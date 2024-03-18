# GGR472_LAB_4
 Repository for GGR472 LAB4

This repository contains an html file, javascript file, and css file

The map contains three different data layers, which are,
    1. Hexbin layer
    2. Bounding box layer
    3. collision points layer

The Hexbin layer displays hexbins which are colour coded, with each colour representing the number of pedestrian and cyclist collisions from 2006-2021 that occured in that given area.

The bounding box layer is based on the maximum and minimum longitudes and latitudes of the points in the pedcyc_collision_06-21.geojson, to make a rectangular layer that contains all of the points from the geojson

The collision points layer is the original geojson layer, which displays all the individual collision points

Features of this map include:
    1. pop-up windows for the Hexbin layer, and the collision points layer
    2. checkboxes of the 3 different data layers to allow toggling the layers on or off
    3. a dropdown to allow filtering of the different data values within the hexbin layer
    4. A button to reset the zoom extent to that of the original map load
