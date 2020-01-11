var fs = require('fs');
var path = require('path');
var glob = require('glob');

var dir = path.join(__dirname, '../src/map/city');

glob('./src/city/*.json', {}, function (err, files) {
    clean();
    files.forEach(function (file) {
        var name = path.basename(file);
        var output = path.join(dir, name);
        var rawStr = fs.readFileSync(file, 'utf8');
        var json = JSONTokener(rawStr);
        // Meta tag
        json.UTF8Encoding = true;
        var features = json.features;

        if (!features) {
            return;
        }
        if (!Array.isArray(features)) {
            console.error(file);
        }
        features.forEach(function (feature){
            var encodeOffsets = feature.geometry.encodeOffsets = [];
            var coordinates = feature.geometry.coordinates;
            if (feature.geometry.type === 'Polygon') {
                coordinates.forEach(function (coordinate, idx){
                    coordinates[idx] = encodePolygon(
                        coordinate, encodeOffsets[idx] = []
                    );
                });
            } else if(feature.geometry.type === 'MultiPolygon') {
                coordinates.forEach(function (polygon, idx1){
                    encodeOffsets[idx1] = [];
                    polygon.forEach(function (coordinate, idx2) {
                        coordinates[idx1][idx2] = encodePolygon(
                            coordinate, encodeOffsets[idx1][idx2] = []
                        );
                    });
                });
            }
        });
        fs.writeFileSync(
            output, JSON.stringify(json), 'utf8'
        );
    });
});

// 检测文件目录是否存在
function clean () {
    delDir(dir);
    fs.mkdirSync(dir);
}

function delDir(path){
    let files = [];
    if(fs.existsSync(path)){
        files = fs.readdirSync(path);
        files.forEach((file, index) => {
            let curPath = path + "/" + file;
            if(fs.statSync(curPath).isDirectory()){
                delDir(curPath); //递归删除文件夹
            } else {
                fs.unlinkSync(curPath); //删除文件
            }
        });
        fs.rmdirSync(path);
    }
}


function encodePolygon(coordinate, encodeOffsets) {
    var result = '';

    var prevX = quantize(coordinate[0][0]);
    var prevY = quantize(coordinate[0][1]);
    // Store the origin offset
    encodeOffsets[0] = prevX;
    encodeOffsets[1] = prevY;

    for (var i = 0; i < coordinate.length; i++) {
        var point = coordinate[i];
        result+=encode(point[0], prevX);
        result+=encode(point[1], prevY);

        prevX = quantize(point[0]);
        prevY = quantize(point[1]);
    }

    return result;
}

function JSONTokener (str) {
    if (str !== null && str.startsWith("\ufeff")) {
        str = str.substring(1);
    }
    return JSON.parse(str);
};

function addAMDWrapper(jsonStr) {
    return ['define(function() {',
                '    return ' + jsonStr + ';',
            '});'].join('\n');
}

function encode(val, prev){
    // Quantization
    val = quantize(val);
    // var tmp = val;
    // Delta
    val = val - prev;

    if (((val << 1) ^ (val >> 15)) + 64 === 8232) {
        //WTF, 8232 will get syntax error in js code
        val--;
    }
    // ZigZag
    val = (val << 1) ^ (val >> 15);
    // add offset and get unicode
    return String.fromCharCode(val + 64);
}

function quantize(val) {
    return Math.ceil(val * 1024);
}
