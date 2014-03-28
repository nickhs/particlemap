var MapParser = function(options) {
    if (options === undefined) {
        throw 'MapParser needs options!';
    }

    this.options = options;

    this.fetchDoc(this.options.geojson_file, function(coords) {
        console.log('done', coords);
        this.data = coords;
        this.drawMap(coords);
    }.bind(this));
};

MapParser.prototype = {

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

        var responseXML = event.currentTarget.responseXML;
        window.data = responseXML;

        var coords;
        if (this.options.coordPath) {
            coords = responseXML[this.coordPath];
            if (coords.tagName != 'coordinates') {
                coords = coords.getElementsByTagName('coordinates');
            }
        } else if (this.options.selectionFunc) {
            coords = this.options.selectionFunc(responseXML);
        } else {
            coords = responseXML.getElementsByTagName('coordinates');
        }

        var tcoords = [];
        var minx;
        var miny;
        var maxx;
        var maxy;
        Array.prototype.slice.call(coords).forEach(function(temp_coords) {
            temp_coords = temp_coords.textContent.split(' ');
            temp_coords.forEach(function(coord) {
                if (!coord) return;
                if (!coord.match(/\d+,\d+/)) return;

                var t = {};
                coord = coord.split(',');
                t.x = parseFloat(coord[0]);
                t.y = parseFloat(coord[1]);
                tcoords.push(t);

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
            });
        });

        var data = {
            coords: tcoords,
            max: {
                x: maxx,
                y: miny
            },
            min: {
                x: minx,
                y: maxy
            }
        };

        this._coords = tcoords;
        cb(data);
    },

    drawMap: function(data) {
        var canvas;
        if (this.options.canvasEl) {
            canvas = this.options.canvasEl;
        } else {
            canvas = document.createElement('canvas');

            var width = document.body.scrollWidth;
            if (this.options.padding) {
                width = width - (2 * this.options.padding);
            }

            var height = document.body.scrollHeight;
            if (this.options.padding) {
                height = height - (2 * this.options.padding);
            }

            canvas.height = height;
            canvas.width = width;
            document.body.appendChild(canvas);
        }

        this._transformX = canvas.width / (data.max.x - data.min.x);
        this._transformY = canvas.height / (data.max.y - data.min.y);

        var context = canvas.getContext('2d');

        for (var i = 0; i < data.coords.length - 1; i++) {
            var coord1 = data.coords[i];
            var coord2 = data.coords[i + 1];

            coord1 = this.getPoint(coord1);
            coord2 = this.getPoint(coord2);

            context.beginPath();
            context.moveTo(coord1.x, coord1.y);
            context.lineTo(coord2.x, coord2.y);
            context.stroke();
            context.closePath();
        }

        for (var i = 0; i < data.coords.length; i++) {
            var coord = data.coords[i];

            coord = this.getPoint(coord);
            context.fillRect(coord.x, coord.y, 5, 5);
        }
    },

    getPoint: function(coord) {
        var x = coord.x;
        x = x - this.data.min.x;
        x = x * this._transformX;

        if (this.options.padding) {
            x += this.options.padding;
        }

        var y = coord.y;
        y = y - this.data.min.y;
        y = y * this._transformY;

        if (this.options.padding) {
            y += this.options.padding;
        }

        return {x: x, y: y};
    }
};

window.addEventListener('DOMContentLoaded', function() {
    console.log('we are go');

    /*
    var selectionFunc = function(responseXML) {
        var bannedStates = ['North Dakota'];

        var pms = responseXML.getElementsByTagName('Placemark');
        pms = Array.prototype.slice.call(pms);
        pms = pms.filter(function(item) {
            for (var i = 0; i < bannedStates.length; i++) {
                var bs = bannedStates[i];
                var name = item.getElementsByTagName('name')[0];
                if (name.textContent.indexOf(bs) == -1) return false;
            }

            return true;
        });

        return pms;
    }; */

    var selectionFunc = function(responseXML) {
        var bannedStates = ['NORTH DAKOTA'];

        var pms = responseXML.getElementsByTagName('Folder');
        pms = Array.prototype.slice.call(pms);
        pms = pms.filter(function(item) {
            for (var i = 0; i < bannedStates.length; i++) {
                var bs = bannedStates[i];
                var name = item.getElementsByTagName('name')[0];
                if (name.textContent.indexOf(bs) == -1) return false;
            }

            return true;
        });

        var coords = [];
        pms.forEach(function(item) {
            var tmp = Array.prototype.slice.call(item.getElementsByTagName('coordinates'));
            coords = coords.concat(tmp);
        });

        return coords;
    };

    window.test = new MapParser({
        geojson_file: '/ND.geo.json',
        canvasEl: document.getElementById('map'),
        padding: 100,
        selectionFunc: selectionFunc
    });
});
