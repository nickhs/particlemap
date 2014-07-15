/* globals ParticleMap */

var fetchDoc = function(url, cb) {
    var req = new XMLHttpRequest();
    req.onload = cb;
    req.open('get', url);
    req.send();
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

        var worldMap = window.test = new ParticleMap(data, {
            canvasEl: canvas,
            padding: 0,
            stretch: false,
            pixelResolution: 8,
            foregroundColor: '#ED5E97',
            drawPointFunc: function(coords, idx, status) {
                if (status == 2) return false;
            }
        });

        var pickRandomValidPoint = function(items) {
            var pointIdx;
            pointIdx = Math.floor(Math.random()*items.length);
            if (items[pointIdx] == ParticleMap.prototype.pixelStatusEnum.INSIDE) return pointIdx;
            return null;
        };

        var animatePoint = function() {
            var point = pickRandomValidPoint(worldMap._grid);
            if (!point) return;
            var screenCoords = worldMap.gridIndexToScreenCoord(point);
            var el = document.createElement('div');
            el.className = 'point';
            var translateString = 'translate(' + screenCoords[0] + 'px, ' + -1 * screenCoords[1] + 'px)';
            el.style.transform = translateString;
            el.style['-webkit-transform'] = translateString;
            document.querySelector('.header-map').appendChild(el);
        };

        var createPoint = function(lat, long) {
            var screenCoords = worldMap.getScreenCoordFromMapCoord([lat, long]);
            console.log(screenCoords);
            var el = document.createElement('div');
            el.className = 'point';
            var translateString = 'translate(' + screenCoords[0] + 'px, ' + -1 * screenCoords[1] + 'px)';
            el.style.transform = translateString;
            el.style['-webkit-transform'] = translateString;
            document.querySelector('.header-map').appendChild(el);
        };

        // createPoint(174.7399, -36.8404);
        // setInterval(animatePoint, Math.random() * 1000);
    });
}

/*
function createGermanyMap() {
    var canvas = document.getElementById('germany-map');
    canvas.height = canvas.scrollHeight;
    canvas.width = canvas.scrollWidth;

    fetchDoc(geojson_file, function(data) {
        data = JSON.parse(data.target.response);

        var features = data.features.filter(function(feature) {
            if (feature.id == 'ATA') return false;
            return true;
        });

        data.features = features;

        var worldMap = window.test = new ParticleMap(data, {
            canvasEl: canvas,
            padding: 0,
            stretch: false,
            pixelResolution: 8,
            foregroundColor: '#ED5E97',
            drawPointFunc: function(coords, idx, status) {
                if (status == 2) return false;
            }
        });
    });
}
*/

window.addEventListener('DOMContentLoaded', function() {
    console.log('we are go');



    // var geojson_file = '/world.geo.json/countries/DEU.geo.json';
    createWorldMap();
});
