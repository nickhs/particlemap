var ParticleMap = function(geojson, options) {
    if (geojson === undefined) {
        throw 'ParticleMap needs a geojson file!';
    }

    this.geojson = geojson;
    this.options = options || {};

    if (!this.options.pixelResolution) this.options.pixelResolution = 10;

    if (!this.options.drawOptions) {
        this.options.drawOptions = {
            arcSize: this.options.pixelResolution / 4,
            color: '#dddddd',
            opacity: 1
        };
    }

    if (!this.options.foregroundColor) {
        this.options.foregroundColor = '#333';
    }

    this.parse(geojson);
};

ParticleMap.prototype = {
    pixelStatusEnum: {
        NOTVISITED: 0,
        INSIDE: 1,
        OUTSIDE: 2,
        EDGE: 3
    },

    _grid: [], // an array of point objects, created in makeGrid

    // Magic numbers to do geojson -> screen coords mapping
    _transformX: null,
    _transformXOffset: null,
    _transformY: null,
    _transformYOffset: null,

    _polygons: [],

    _flatten: function(a, b) {
        return a.concat(b);
    },

    /*
     * Utility function to merge options from a and b.
     * Items in b take precedence. Does a shallow copy.
     * @param {object} a
     * @param {object} b
     */
    _mergeOptions: function(a, b) {
        var tmpObject = {};
        var attrname;

        for (attrname in a) {tmpObject[attrname] = a[attrname];}
        for (attrname in b) {tmpObject[attrname] = b[attrname];}
        return tmpObject;
    },

    _recursiveFindPolygons: function(object) {
        if (object.type == 'Polygon') {
            return this._polygons.push(object);
        }

        else if (object.type == 'MultiPolygon') {
            // how the hell is the geojson spec so fucking shitty.
            object.coordinates.forEach(function(polygonArray) {
                var tmpPolygon = {};
                tmpPolygon.coordinates = polygonArray;
                this._polygons.push(tmpPolygon);
            }, this);

            return;
        }

        else if (object.type == 'GeometryCollection') {
            return object.geometries.forEach(this._recursiveFindPolygons, this);
        }

        else if (object.type == 'Feature') {
            return this._recursiveFindPolygons(object.geometry);
        }

        else if (object.type == 'FeatureCollection') {
            return object.features.forEach(this._recursiveFindPolygons, this);
        }

        else {
            console.warn('ParticleMap.js: Could not find valid type in geojson object', object);
        }
    },

    /**
     * Either returns or finds all the polygon objects in this._geojson
     */
    recursiveFindPolygons: function() {
        if (this._polygons && this._polygons.length > 0) {
            return this._polygons;
        }

        this._recursiveFindPolygons(this._geojson);
        return this._polygons;
    },

    /*
     * Returns the outermost ring of coordinates from a polygon
     * @param {object} polygon GeoJSON Polygon object
     */
    getCoordsFromPolygon: function(polygon) {
        var outerRing;
        if (polygon.coordinates) {
            outerRing = polygon.coordinates[0];
        } else {
            throw 'Cannot find coordinates in polygon ' + polygon;
        }

        return outerRing;
    },

    /**
     * Gets all polygons and finds all their coordinates
     */
    recursiveFindPolygonCoords: function() {
        var polygons = this.recursiveFindPolygons();
        var coords = polygons.map(this.getCoordsFromPolygon);
        coords = coords.reduce(this._flatten);
        return coords;
    },

    /**
     * Takes a geojson object and determines max and min points
     * Effectively the entry method for ParticleMap.js
     * @param {object} geojson GeoJSON object
     */
    parse: function(geojson) {
        this._geojson = geojson;

        // Find max and min points in geojson file
        var minx;
        var miny;
        var maxx;
        var maxy;

        var getMaxMin = function(coord) {
            var t = {};
            t.x = coord[0];
            t.y = coord[1];

            if (maxx === undefined) {
                maxx = t.x;
                minx = t.x;
                maxy = t.y;
                miny = t.y;
            }

            if (t.x > maxx) {
                maxx = t.x;
            }

            if (t.x < minx) {
                minx = t.x;
            }

            if (t.y > maxy) {
                maxy = t.y;
            }

            if (t.y < miny) {
                miny = t.y;
            }
        };

        // Determine all the coordinates in file
        var coords = this.recursiveFindPolygonCoords(geojson);
        console.log(coords);

        coords.forEach(getMaxMin, this);

        var data = {
            max: {
                x: maxx,
                y: maxy
            },
            min: {
                x: minx,
                y: miny
            },
            orig_data: coords
        };

        this._data = data;

        this.drawMap(data);
    },

    /*
     * Creates the canvas and determines offsets, calls into makeGrid and drawGrid
     * @param {object} data Data object from parse that has min and max values in.
     */
    drawMap: function(data) {
        // Create the canvas
        var canvas;

        if (this._canvas) {
            canvas = this._canvas;
        } else if (this.options.canvasEl) {
            canvas = this.options.canvasEl;
            this._canvas = canvas;
        } else {
            canvas = document.createElement('canvas');

            var width = document.body.scrollWidth;
            width = width * 0.8;

            var height = document.body.scrollHeight;
            height = height * 0.8;

            canvas.height = height;
            canvas.width = width;
            document.body.appendChild(canvas);
            this._canvas = canvas;
        }

        // Determine offsets:
        this._transformX = Math.abs(canvas.width / (data.max.x - data.min.x));
        this._transformY = Math.abs(canvas.height / (data.max.y - data.min.y));

        if (!this.options.stretch) {
            var diff = Math.abs(this._transformY - this._transformX);
            diff /= 2;

            if (this._transformY > this._transformX) {
                this._transformYOffset = (this._canvas.height / this._transformY) * diff;
                this._transformY = this._transformX;
                console.log('y offset', this._transformYOffset);
            } else {
                this._transformXOffset = (this._canvas.width / this._transformX) * diff;
                this._transformX = this._transformY;
                console.log('x offset', this._transformXOffset);
            }
        }

        var context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);

        this.makeGrid();
        this.drawGrid();
    },

    /* Converts from screen co-ordinates to map co-ordinates
     * Screen co-ords relative to the canvas element
     * @param {array} coord Co-ordinate array object
     */
    getScreenCoordFromMapCoord: function(coord) {
        var x = coord[0];
        x = this._data.min.x - x;
        x = x * this._transformX;
        x = x * -1;

        if (this._transformXOffset) {
            x += this._transformXOffset;
        }

        var y = coord[1];
        y = y - this._data.min.y;
        y = y * this._transformY;

        if (this._transformYOffset) {
            y += this._transformYOffset;
        }

        return [x, y];
    },

    getMapCoordFromScreenCoord: function(coord) {
        var x = coord[0];
        if (this._transformXOffset) {
            x -= this._transformXOffset;
        }

        x = x / this._transformX;
        x = x + this._data.min.x;

        var y = coord[1];
        if (this._transformYOffset) {
            y -= this._transformYOffset;
        }

        y = y / this._transformY;
        y = this._data.max.y - y;
        return [x, y];
    },

    makeGrid: function() {
        this._grid = [];

        var xiters = Math.ceil(this._canvas.height / this.options.pixelResolution);
        var yiters = Math.ceil(this._canvas.width / this.options.pixelResolution);
        var rowLen = Math.ceil(this._canvas.width / this.options.pixelResolution);

        for (var i = 0; i < xiters; i++) {
            for (var j = 0; j < yiters; j++) {
                var idx = (i * rowLen) + j;
                this._grid[idx] = ParticleMap.prototype.pixelStatusEnum.NOTVISITED;
            }
        }
    },

    drawGrid: function() {
        var idx, point;

        for (idx = 0; idx < this._grid.length; idx++) {
            point = this._grid[idx];
            if (point == ParticleMap.prototype.pixelStatusEnum.NOTVISITED) {
                var pointStatus = this.isPointInPolygon(idx);
                this._grid[idx] = pointStatus;
            }
        }

        for (idx = 0; idx < this._grid.length; idx++) {
            point = this._grid[idx];
            var coords = this.gridIndexToScreenCoord(idx);
            this.drawPoint(coords, idx, point);
        }
    },

    drawPoint: function(coords, idx, status) {
        // javascript what. really. this is the best solution?!
        var drawOptions = JSON.parse(JSON.stringify(this.options.drawOptions));

        if (this.options.foregroundColor &&
                status === ParticleMap.prototype.pixelStatusEnum.INSIDE) {
            drawOptions.color = this.options.foregroundColor;
        }

        if (this.options.drawPointFunc) {
            // If it returns true, don't draw, client will take care of it
            // If it returns an object, assume that is the drawOptions object, still draw
            // If it returns  or null, still draw the object
            var retVal = this.options.drawPointFunc(coords, idx, status, this._canvas);
            if (retVal === true || retVal === false) {
                return;
            } else if (retVal && typeof retVal == 'object') {
                drawOptions = this.mergeOptions(this.options.drawOptions, retVal);
            }
        }

        this.drawCircle(coords, drawOptions, this._canvas);
    },

    drawCircle: function(coords, drawOptions, canvas) {
        var ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.arc(coords[0], coords[1], drawOptions.arcSize, 0, 2 * Math.PI, false);
        ctx.globalAlpha = drawOptions.opacity;
        ctx.fillStyle = drawOptions.color;
        ctx.fill();
        ctx.closePath();
    },

    /*
    posToGridIndex: function(coord) {
        // FIXME
        var rowLen = Math.ceil(this._canvas.width / this.options.pixelResolution);

        var x = Math.floor(coord[0] / this.options.pixelResolution);
        var y = Math.floor(coord[1] / this.options.pixelResolution);

        return x + (y * rowLen);
    },
    */

    gridIndexToScreenCoord: function(idx) {
        // returns the coordinates to draw the item on the *screen*
        var xlen = Math.ceil(this._canvas.width / this.options.pixelResolution);

        var x = idx % xlen;
        var y = Math.floor(idx / xlen);

        var xcoord = (x * this.options.pixelResolution) + (this.options.pixelResolution * 0.5);
        var ycoord = (y * this.options.pixelResolution) + (this.options.pixelResolution * 0.5);

        return [xcoord, ycoord];
    },

    gridIndexToMapCoord: function(idx) {
        var coord = this.gridIndexToScreenCoord(idx);
        var point = this.getMapCoordFromScreenCoord(coord);
        return point;
    },

    isPointInPolygon: function(gridIndex) {
        var coord = this.gridIndexToMapCoord(gridIndex);
        var x = coord[0];
        var y = coord[1];

        var inPoint = false;
        var polygons = this.recursiveFindPolygons();

        for (var i = 0; i < polygons.length; i++) {
            var polygon = this.getCoordsFromPolygon(polygons[i]);


            for (var j = 0; j < polygon.length - 1; j++) {
                var point1 = polygon[j];
                var point2 = polygon[j + 1];


                if (point1[1] < y && point2[1] >= y || point2[1] < y && point1[1] >= y) {
                    if (point1[0] + (y - point1[1]) / (point2[1] - point1[1]) * (point2[0] - point1[0]) < x) {
                        inPoint = !inPoint;
                    }
                }
            }
        }

        if (inPoint) return ParticleMap.prototype.pixelStatusEnum.INSIDE;
        else return ParticleMap.prototype.pixelStatusEnum.OUTSIDE;
    },
};

