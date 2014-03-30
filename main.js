var MapParser = function(options) {
    if (options === undefined) {
        throw 'MapParser needs options!';
    }

    options.pixelResolution = 7;

    this.options = options;

    this.fetchDoc(this.options.geojson_file, function(coords) {
        console.log('done', coords);
        this.data = coords;
        this.drawMap(coords);
    }.bind(this));
};

MapParser.prototype = {
    pixelStatusEnum: {
        NOTVISITED: 0,
        INSIDE: 1,
        OUTSIDE: 2,
        EDGE: 3
    },

    fetchDoc: function(url, cb) {
        var req = new XMLHttpRequest();
        req.onload = this.parse.bind(this, cb);
        req.open('get', url);
        req.send();
    },

    parse: function(cb, event) {
        if (event.currentTarget.status != 200) {
            console.warn('Failed to load file, aborting...');
            cb(null);
            return;
        }

        var data = JSON.parse(event.currentTarget.response);
        window.data = data;

        data = this.options.selectionFunc(data);

        var minx;
        var miny;
        var maxx;
        var maxy;

        this._polygons = [];

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

            else if (t.x < minx) {
                minx = t.x;
            }

            if (t.y > maxy) {
                maxy = t.y;
            }

            else if (t.y < miny) {
                miny = t.y;
            }
        };

        data.forEach(function(country) {
            if (country.geometry.type == 'MultiPolygon') {
                country.geometry.coordinates.forEach(function(multipolygon) {
                    multipolygon.forEach(function(polygon) {
                        polygon.forEach(function(coord) {
                            getMaxMin(coord);
                        }.bind(this));
                    }.bind(this));
                }.bind(this));
            } else {
                country.geometry.coordinates.forEach(function(polygon) {
                    polygon.forEach(function(coord) {
                        getMaxMin(coord);
                    }.bind(this));
                }.bind(this));
            }
        }.bind(this));

        data = {
            max: {
                x: maxx,
                y: miny
            },
            min: {
                x: minx,
                y: maxy
            },
            orig_data: data
        };

        this._data = data;

        cb(data);
    },

    drawMap: function(data) {
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


        this._transformX = canvas.width / (data.max.x - data.min.x);
        this._transformY = canvas.height / (data.max.y - data.min.y);

        var context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        this.makeGrid();

        this.timeoutInterval = 0;
        this._timeout = this.timeoutInterval;

        data.orig_data.forEach(function(country) {
            if (country.geometry.type == 'MultiPolygon') {
                country.geometry.coordinates.forEach(function(multipolygon) {
                    multipolygon.forEach(this.drawPolygon.bind(this));
                }.bind(this));
            } else {
                country.geometry.coordinates.forEach(this.drawPolygon.bind(this));
            }
        }.bind(this));

        this.drawGrid();

        /*
        for (var i = 0; i < data.coords.length; i++) {
            var coord = data.coords[i];

            coord = this.getPoint(coord);
            context.fillRect(coord.x, coord.y, 5, 5);
            console.log(coord);
        } */
    },

    getPoint: function(coord) {
        // FIXME, wtf how has this ever worked?

        var x = coord[0];
        x = x - this._data.min.x;
        x = x * this._transformX;

        var y = coord[1];
        y = y - this._data.min.y;
        y = y * this._transformY;

        return [x, y];
    },

    drawPolygon: function(polygon) {
        var coord_polygon = [];
        for (var j = 0; j < polygon.length; j++) {
            var coord = polygon[j];
            coord = this.getPoint(coord);
            coord_polygon.push(coord);
        }

        this._polygons.push(coord_polygon);

        for (var i = 0; i < polygon.length - 1; i++) {
            var coord1 = polygon[i];
            var coord2 = polygon[i + 1];

            coord1 = this.getPoint(coord1);
            coord2 = this.getPoint(coord2);

            this.drawLine(coord1, coord2);

            /*
            setTimeout(this.drawLine.bind(this, coord1, coord2));
            this._timeout += this.timeoutInterval
            */
        }
    },

    drawLine: function(coord1, coord2, cb) {
        var context = this._canvas.getContext('2d');
        var gridIndex;

        context.beginPath();
        context.moveTo(coord1[0], coord1[1]);
        context.lineTo(coord2[0], coord2[1]);
        // context.stroke();
        context.closePath();

        var xdiff = coord2[0] - coord1[0];
        var ydiff = coord2[1] - coord1[1];

        var m = (ydiff) / (xdiff);
        var c = coord1[1] - m * coord1[0];

        var lineFunc = function(x) {
            return m * x + c;
        };

        // var diff = Math.ceil(Math.abs(coord2[0] - coord1[0]));
        var diff = Math.sqrt(Math.abs(Math.pow(xdiff, 2) - Math.pow(ydiff, 2)));

        for (var i = 0; i < diff; i += 1) {
            var x;
            var xincr = (i / diff) * Math.abs(xdiff);

            if (coord1[0] > coord2[0]) {
                x = coord1[0] - xincr;
            } else {
                x = coord1[0] + xincr;
            }

            var y = lineFunc(x);
            gridIndex = this.coordToGridIndex([x, y]);
            this._grid[gridIndex] = MapParser.prototype.pixelStatusEnum.EDGE;
        }

        // XXX: Needed?
        gridIndex = this.coordToGridIndex(coord1);
        this._grid[gridIndex] = MapParser.prototype.pixelStatusEnum.EDGE;

        gridIndex = this.coordToGridIndex(coord2);
        this._grid[gridIndex] = MapParser.prototype.pixelStatusEnum.EDGE;

        if (cb) cb();
    },

    makeGrid: function() {
        this._grid = [];
        var xiters = Math.ceil(this._canvas.height / this.options.pixelResolution);
        var yiters = Math.ceil(this._canvas.width / this.options.pixelResolution);
        var rowLen = Math.ceil(this._canvas.width / this.options.pixelResolution);

        var count = 9;
        for (var i = 0; i < xiters; i++) {
            for (var j = 0; j < yiters; j++) {
                var idx = (i * rowLen) + j;
                this._grid[idx] = MapParser.prototype.pixelStatusEnum.NOTVISITED;
                count++;
            }
        }

        console.log('Total number of points is', count);
        console.log('Row length is', rowLen);
    },

    drawGrid: function() {
        var idx, point;

        for (idx = 0; idx < this._grid.length; idx++) {
            point = this._grid[idx];
            if (point == MapParser.prototype.pixelStatusEnum.NOTVISITED) {
                this._grid[idx] = this.isPointInPolygon(idx);
            }
        }

        for (idx = 0; idx < this._grid.length; idx++) {
            point = this._grid[idx];
            var coords = this.gridIndexToCoord(idx);

            if (point == MapParser.prototype.pixelStatusEnum.OUTSIDE) {
                // this.drawCircle(coords, '#333');
            } else if (point == MapParser.prototype.pixelStatusEnum.INSIDE) {
                // this.drawCircle(coords, '#64768A');
                this.drawCircle(coords, '#fff');
            } else if (point == MapParser.prototype.pixelStatusEnum.EDGE) {
                this.drawCircle(coords, '#fff');
                // this.drawCircle(coords, '#f00');
            } else {
                this.drawCircle(coords, '#64768A');
            }
        }
    },

    drawCircle: function(coords, color) {
        var ctx = this._canvas.getContext('2d');
        ctx.beginPath();
        ctx.arc(coords[0], coords[1], this.options.pixelResolution / 4, 0, 2 * Math.PI, false);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.closePath();
    },

    coordToGridIndex: function(coord) {
        var rowLen = Math.ceil(this._canvas.width / this.options.pixelResolution);

        var x = Math.floor(coord[0] / this.options.pixelResolution);
        var y = Math.floor(coord[1] / this.options.pixelResolution);

        return x + (y * rowLen);
    },

    gridIndexToCoord: function(idx) {
        var xlen = Math.ceil(this._canvas.width / this.options.pixelResolution);

        var x = idx % xlen;
        var y = Math.floor(idx / xlen);

        var xcoord = (x * this.options.pixelResolution) + (this.options.pixelResolution * 0.5);
        var ycoord = (y * this.options.pixelResolution) + (this.options.pixelResolution * 0.5);

        return [xcoord, ycoord];
    },

    isPointInPolygon: function(gridIndex) {
        var coord = this.gridIndexToCoord(gridIndex);
        var x = coord[0];
        var y = coord[1];

        var inPoint = false;

        for (var i = 0; i < this._polygons.length; i++) {
            var polygon = this._polygons[i];

            for (var j = 0; j < polygon.length - 1; j++) {
                var point1 = polygon[j];
                var point2 = polygon[j + 1];

                if (point1[1] < y && point2[1] >= y || point2[1] < y && point1[1] >= y) {
                    if (point1[0] + (y - point1[1]) / (point2[1] - point1[1]) * (point2[0] - point2[0]) < x) {
                        inPoint = !inPoint;
                    }
                }
            }
        }

        if (inPoint) return MapParser.prototype.pixelStatusEnum.INSIDE;
        else return MapParser.prototype.pixelStatusEnum.OUTSIDE;

        /*
        var rowLen = Math.ceil(this._canvas.width / this.options.pixelResolution);
        var xIndex = gridIndex % rowLen;

        if (xIndex % (rowLen - 1) === 0) {
            return MapParser.prototype.pixelStatusEnum.OUTSIDE;
        }

        var rayCastResults = [];

        rayCastResults.push(this._isPointInPolygon(gridIndex, this._getRayCastLeft.bind(this)));
        rayCastResults.push(this._isPointInPolygon(gridIndex, this._getRayCastRight.bind(this)));
        rayCastResults.push(this._isPointInPolygon(gridIndex, this._getRayCastBottom.bind(this)));
        rayCastResults.push(this._isPointInPolygon(gridIndex, this._getRayCastTop.bind(this)));

        var frequency = {};  // array of frequency.
        var max = 0;  // holds the max frequency.
        var result;   // holds the max frequency element.
        for(var v in rayCastResults) {
            frequency[rayCastResults[v]]=(frequency[rayCastResults[v]] || 0)+1; // increment frequency.
            if(frequency[rayCastResults[v]] > max) { // is this frequency > max so far ?
                max = frequency[rayCastResults[v]];  // update max.
                result = rayCastResults[v];          // update result.
            }
        }

        return result; */
    },

    _isPointInPolygon: function(gridIndex, rayCastFunc) {
        var count = 0;
        var i = 0;

        // console.log('is point in plane', gridIndex);

        if (gridIndex == 201) {
            console.log('yes');
        }

        var insideContigousRegion = false;
        while (true) {
            i++;

            var idx = rayCastFunc(gridIndex, i);

            if (idx == -1) break;

            var point = this._grid[idx];

            if (point == MapParser.prototype.pixelStatusEnum.EDGE && !insideContigousRegion) {
                count++;
                insideContigousRegion = true;
            }

            else if (insideContigousRegion && point != MapParser.prototype.pixelStatusEnum.EDGE) {
                insideContigousRegion = false;
            }

        }

        if (count % 2 === 0) return MapParser.prototype.pixelStatusEnum.OUTSIDE;
        else return MapParser.prototype.pixelStatusEnum.INSIDE;
    },

    _getRayCastRight: function(gridIndex, i) {
        var rowLen = Math.ceil(this._canvas.width / this.options.pixelResolution);
        var xIndex = gridIndex % rowLen;

        if ((i + xIndex) % rowLen === 0) return -1;
        return gridIndex + i;
    },

    _getRayCastLeft: function(gridIndex, i) {
        var rowLen = Math.ceil(this._canvas.width / this.options.pixelResolution);
        var xIndex = gridIndex % rowLen;

        if ((xIndex - i) < 0) return -1;
        return gridIndex - i;
    },

    _getRayCastBottom: function(gridIndex, i) {
        var rowLen = Math.ceil(this._canvas.width / this.options.pixelResolution);

        var actualI = i * rowLen;
        var bottom = (Math.ceil(this._canvas.height / this.options.pixelResolution) * rowLen);

        if ((gridIndex + actualI) > bottom) return -1;

        return gridIndex + actualI;
    },

    _getRayCastTop: function(gridIndex, i) {
        var rowLen = Math.ceil(this._canvas.width / this.options.pixelResolution);
        var actualI = i * rowLen;

        if ((gridIndex - actualI) < 0) return -1;
        return gridIndex - actualI;
    }
};

window.addEventListener('DOMContentLoaded', function() {
    console.log('we are go');

    var canvas = document.getElementById('map');
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;

    window.test = new MapParser({
        // geojson_file: '/world.geo.json/countries.geo.json',
        // geojson_file: '/world.geo.json/countries/USA/CA.geo.json',
        geojson_file: '/world.geo.json/countries/IDN.geo.json',
        canvasEl: document.getElementById('map'),
        padding: 0,
        selectionFunc: function(data) {
            return data.features;

            var item;

            data.features.forEach(function(country) {
                if (country.id == 'USA')  {
                    item = country;
                }
            });

            return [item];
        }
    });

    window.addEventListener('resize', function() {
        if (this._data) {
            this.drawMap(this._data);
        }
    }.bind(this));
});
