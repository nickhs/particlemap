/* globals ParticleMap */
/* jshint multistr: true */

var fetchDoc = function(url, cb) {
    var req = new XMLHttpRequest();
    req.onload = cb;
    req.open('get', url);
    req.send();
};

var pickRandomValidPoint = function(items) {
    var pointIdx;
    pointIdx = Math.floor(Math.random()*items.length);
    if (items[pointIdx] == ParticleMap.prototype.pixelStatusEnum.INSIDE) return pointIdx;
    return null;
};

var setTransform = function(element, params) {
    var newTransform = '';
    for (var key in params) {
        var val = params[key];

        if (key == 'translate') {
            newTransform += ' translate(' + val[0] + 'px, ' + val[1] + 'px)';
        } else if (key == 'scale') {
            newTransform += ' scale(' + val + ')';
        } else if (key == 'rotate') {
            newTransform += ' rotate(' + val + 'deg)';
        }
    }

    // console.log('transform is now', newTransform);
    element.style['-webkit-transform'] = newTransform;
    element.style['-moz-transform'] = newTransform;
    element.style.transform = newTransform;
    return element;
};

function Plane(id, map) {
    var plane = document.getElementById('hidden-plane');
    this.el = plane.cloneNode(true);
    this.el.style.removeProperty('display');
    this.el.classList.remove('hidden-plane');
    this.el.classList.add('plane');
    this.el.removeAttribute('id');
    this.map = map;
}

Plane.prototype.getAngle = function() {
    var rel = this.getRelativeDists();
    // var angle = 180 / Math.PI * Math.atan2(-rel.x, -rel.y);
    // angle += 90;
    // angle = angle * -1;

    /*
    if (rel.y < 0) rel.y = (rel.y * -1);
    var angle = (180 / Math.PI) * Math.atan(-rel.x/rel.y);
    */

    var angle = (180 / Math.PI) * Math.atan(-rel.x/rel.y);
    if (rel.y >= 0) angle += 180;
    angle += 180;

    if (!angle || isNaN(angle)) {
        // debugger;
        angle = 0;
    }

    return angle;
};

Plane.prototype.getTotalDistance = function() {
    var rel = this.getRelativeDists();
    Math.sqrt(rel.x * rel.x + rel.y + rel.y);
};

Plane.prototype.getRelativeDists = function() {
    return {
        x: this.startX - this.endX,
        y: this.startY - this.endY
    };
};

Plane.prototype.makeItinerary = function() {
    var startPointIdx, endPointIdx;

    while (!startPointIdx) {
        startPointIdx = pickRandomValidPoint(this.map.grid);
    }

    while (!endPointIdx && endPointIdx != startPointIdx) {
        endPointIdx = pickRandomValidPoint(this.map.grid);
    }

    var startPointScreenCoords = this.map.gridIndexToScreenCoord(startPointIdx);
    var endPointScreenCoords = this.map.gridIndexToScreenCoord(endPointIdx);

    this.startPointIdx = startPointIdx;
    this.endPointIdx = endPointIdx;
    this.startX = startPointScreenCoords[0];
    this.startY = startPointScreenCoords[1];
    this.endX = endPointScreenCoords[0];
    this.endY = endPointScreenCoords[1];

    this.flightLength = 2000 + (Math.random() * 4000); // microseconds
};

Plane.prototype.getTransform = function() {
    return {
        translate: [this.startX, this.startY],
        rotate: this.getAngle()
    };
};

Plane.prototype.animate = function(tick) {
    if (!this._start) {
        this._start = tick;
    }

    var percTravelled = (tick - this._start) / this.flightLength;
    if (percTravelled > 1) {
        this.selfDestruct();
        return;
    }

    var relDists = this.getRelativeDists();
    var translateX = this.startX - (relDists.x * percTravelled);
    var translateY = this.startY - (relDists.y * percTravelled);
    var scale = -4 * (percTravelled * percTravelled) + (percTravelled * 4);

    var tmp = {
        translate: [translateX, translateY],
        rotate: this.getAngle(),
        scale: scale
    };

    setTransform(this.el, tmp);
    window.requestAnimationFrame(this.animate.bind(this));
};

Plane.prototype.drawEndPoint = function() {
    var el = document.createElement('div');
    el.classList.add('like-a-g6');
    setTransform(el, {
        translate: [this.endX, this.endY]
    });
    el.style.background = 'blue';
    el.style.width = '20px';
    el.style.height = '20px';
    el.innerText = this.id;
    document.querySelector('.header-map').appendChild(el);
};

Plane.prototype.selfDestruct = function() {
    // this.el.parentNode.removeChild(this.el);
    this.el.classList.add('hidden');
};

function createWorldMap() {
    var geojson_file = '/world.geo.json/countries.geo.json';

    var canvas = document.getElementById('world-map');
    canvas.height = canvas.scrollHeight;
    canvas.width = canvas.scrollWidth;

    fetchDoc(geojson_file, function(data) {
        data = JSON.parse(data.target.response);

        var features = data.features.filter(function(feature) {
            if (feature.id == 'ATA') return false;
            return true;
        });

        data.features = features;
        var drawPointFunc = function(coords, idx, status) {
                if (status == 2) return false;
        };

        var params = {
            width: canvas.width,
            height: canvas.height,
            padding: 0,
            stretch: false,
            pixelResolution: 5,
            foregroundColor: '#ED5E97',
            // drawPointFunc: drawPointFunc,
            autostart: false
        };

        var worker = new Worker('task.js');

        var result = false;
        worker.addEventListener('message', function(e) {
            result = e.data;
            console.log('Got message from worker!', e);
            var hugeHack = new ParticleMap({}, {autostart: false});
            for (var key in result) {
                hugeHack[key] = result[key];
            }

            hugeHack.canvas = canvas;
            hugeHack.options.drawPointFunc = drawPointFunc;
            hugeHack.paintGrid();
            canvas.classList.add('active');
            var loader = document.getElementById('loading');
            loader.parentNode.removeChild(loader);
            fly(hugeHack);
        });

        worker.postMessage({geojson: data, params: params});

        // var worldMap = window.test1 = new ParticleMap(data, params);
        // worldMap.paintGrid();

        /*
        var animatePoint = function() {
            var point = pickRandomValidPoint(worldMap.grid);
            if (!point) return;
            var screenCoords = worldMap.gridIndexToScreenCoord(point);
            var el = document.createElement('div');
            el.className = 'point';
            var translateString = 'translate(' + screenCoords[0] + 'px, ' + -1 * screenCoords[1] + 'px)';
            el.style.transform = translateString;
            el.style['-webkit-transform'] = translateString;
            document.querySelector('.header-map').appendChild(el);
        };

        */

        var fly = function(worldMap) {
            var createPlane = function() {
                if (document.visibilityState && document.visibilityState != 'visible') return;

                var map = document.querySelector('.header-map');
                var plane = new Plane('p1', worldMap);
                plane.makeItinerary();
                // plane.drawEndPoint();
                var tmp = plane.getTransform();
                setTransform(plane.el, tmp);
                map.appendChild(plane.el);
                window.requestAnimationFrame(plane.animate.bind(plane));
                return plane;
            };

            // createPlane();
            setInterval(createPlane, 2000);
        };
    });
}

function createGermanyMap() {
    var geojson_file = '/world.geo.json/countries/DEU.geo.json';
    var canvas = document.getElementById('germany-map');
    canvas.height = canvas.scrollHeight;
    canvas.width = canvas.scrollWidth;

    fetchDoc(geojson_file, function(data) {
        data = JSON.parse(data.target.response);

        new ParticleMap(data, {
            canvas: canvas,
            padding: 0,
            stretch: false,
            pixelResolution: 5,
            drawPointFunc: function(coords, idx, status) {
                var width = this.canvas.width;
                if (status == ParticleMap.prototype.pixelStatusEnum.INSIDE) {
                    if (coords[0] <= width/3) return {color: '#000000'};
                    if (coords[0] > width/3 && coords[0] <= (2*width) / 3) return {color: '#ff0000'};
                    if (coords[0] > (2 * width) / 3) return {color: '#ffff00'};
                }
            }
        });
    });
}

function createMichiganMap() {
    var canvas = document.getElementById('michigan-map');
    canvas.height = canvas.scrollHeight;
    canvas.width = canvas.scrollWidth;

    var geojson_file = '/world.geo.json/countries/USA/MI.geo.json';
    fetchDoc(geojson_file, function(data) {
        data = JSON.parse(data.target.response);
        // grab da mitt
        data.features[0].geometry.coordinates.splice(1, 3);

        new ParticleMap(data, {
            canvas: canvas,
            padding: 0,
            stretch: false,
            pixelResolution: 5,
            foregroundColor: '#00ff00',
            backgroundColor: '#AFF1FA'
        });
    });
}

function createPointMap() {
    var geojson_file = '/world.geo.json/countries/IND.geo.json';
    var canvas = document.getElementById('point-map');
    canvas.height = canvas.scrollHeight;
    canvas.width = canvas.scrollWidth;

    fetchDoc(geojson_file, function(data) {
        data = JSON.parse(data.target.response);

        var map = new ParticleMap(data, {
            canvas: canvas,
            padding: 0,
            stretch: false,
            pixelResolution: 5,
            drawPointFunc: function(coords, idx, status) {
                if (status == 2) return false;
            },
            foregroundColor: '#bababa'
        });

        var createPoint = function(lat, long, map, id) {
            var screenCoords = map.getScreenCoordFromMapCoord([lat, long]);
            console.log(screenCoords);
            var el = document.createElement('div');
            el.id = id;
            var translateString = 'translate(' + screenCoords[0] + 'px, ' + -1 * screenCoords[1] + 'px)';
            el.style.transform = translateString;
            el.style['-webkit-transform'] = translateString;
            el.style['-webkit-transform'] = translateString;
            document.querySelector('.custom-bg').appendChild(el);
        };

        createPoint(77.23, 28.61, map, 'special-point');
    });

}

window.addEventListener('DOMContentLoaded', function() {
    console.log('we are go');
    createWorldMap();
    createGermanyMap();
    createMichiganMap();
    createPointMap();
});
