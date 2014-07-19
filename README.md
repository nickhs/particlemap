# ParticleMap.js

All the cool kids have particle maps - shouldn't you?
Demo up at:

        example.com

## Usage

    var particlemap = new ParticleMap(geojson, options);
    // geojson file is a geojson object, fetch it from somewhere
    // options is an object - see below configuration below

## Configuration

    options: {
        canvas: canvasEl // canvas element to draw on
        width: 900 // must be included if no canvas element given
        height: 900 // must be included if no canvas element given
        pixelResolution: 5 // how large to make the pixels
        drawOptions: { // default draw options
            arcSize: pixleResolution / 4 // default arc size of pixel
            color: '#aaaaaa' // default color
            opacity: 1 // default opacity
        }
        // background and foregroundColor take predence over drawOptions
        backgroundColor: '#adadad' // color of pixels outside polygon
        foregroundColor: '#000000' // color of pixels inside polygon
        drawPointFunc: function(coords, idx, status, canvas) {
            // coords are screen coordinates
            // idx in index in pixel grid
            // status is type from pixelStatusEnum on ParticleMap
            // canvas is canvas being drawn on

            // can return a drawOptions object
            // or false to not draw
            // or null for default behaviour
            return false;
        }

        stretch: false // whether image should be stretched to fill canvas
        autostart: true // calculate and draw map automatically, or have user do it
    }

## Lifecycle

    constructor called: sets up options
    parse called: parse finds max and min points
    drawMap called: drawMap everything else

        determineOffsets called: works out transform numbers
        makeGrid called: sets up the grid with everything as outside
        determineGrid called: discovers if point is inside or outside of polygon
        paintGrid called: paints the canvas with the grid
