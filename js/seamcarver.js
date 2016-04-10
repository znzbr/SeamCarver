
function SeamCarver(ctx) {
    var w = ctx.canvas.width;
    var h = ctx.canvas.height;

    var imgd = ctx.getImageData(0, 0, w, h);
    var pix = imgd.data;

    var img = [];

    for (var i = 0; i < h; i++) {

        img.push(new Uint32Array(w));

        for (var j = 0; j < w; j++) {
            img[i][j] = (pix[4 * i * w + 4 * j] << 16) + (pix[4 * i * w + 4 * j + 1] << 8) + pix[4 * i * w + 4 * j + 2];
        }
    }

    this._img = img;
    this._w = w;
    this._h = h;

    this._removedSeams = []
}

SeamCarver.prototype.energy = function (x, y) {
    return this._energyInternal(x, y);
}

SeamCarver.prototype.imageData = function (ctx) {

    var w = this._w;
    var h = this._h;

    var id = ctx.createImageData(w, h);

    for (var i = 0; i < h; i++) {
        for (var j = 0; j < w; j++) {
            var color = this._img[i][j];
            var r = color >> 16 & 0xFF;
            var g = color >> 8 & 0xFF;
            var b = color & 0xFF;

            var index = 4 * w * i + 4 * j;

            id.data[index] = r;
            id.data[index + 1] = g;
            id.data[index + 2] = b;
            id.data[index + 3] = 255;
        }
    }

    return id;
}

SeamCarver.prototype.findVerticalSeam = function () {

    var w = this._w;
    var h = this._h;

    var edgeTo = [];
    var distTo = [];

    distTo.push(new Float32Array(w));
    edgeTo.push(new Int16Array(w).fill(-1));

    for (var i = 1; i < h; i++) {
        distTo[i] = new Float32Array(w);
        edgeTo[i] = new Int16Array(w).fill(-1);

        for (var j = 0; j < w; j++) {
            distTo[i][j] = Number.MAX_VALUE;
        }
    }

    for (var i = 1; i < h; i++) {

        var prevRow = distTo[i - 1];

        for (var j = 1; j < w - 1; j++) {


            var energy = this._energyInternal(j, i);

            var dleft = prevRow[j - 1];
            var dcenter = prevRow[j];
            var dright = prevRow[j + 1];

            if (dleft < dcenter && dleft < dright) {
                distTo[i][j] = dleft + energy;
                edgeTo[i][j] = j - 1;
            }
            else if (dcenter < dright) {
                distTo[i][j] = dcenter + energy;
                edgeTo[i][j] = j;
            }
            else {
                distTo[i][j] = dright + energy;
                edgeTo[i][j] = j + 1;
            }
        }
    }

    var min = Number.MAX_VALUE;
    var minIndex = -1;

    for (var i = 0; i < w; i++) {
        if (distTo[h - 1][i] < min) {
            min = distTo[h - 1][i];
            minIndex = i;
        }
    }

    distTo[h - 1][minIndex] = Number.MAX_VALUE;

    var path = [minIndex];
    var curIndex = minIndex;

    for (var i = h - 1; i > 0; i--) {
        var curIndex = edgeTo[i][curIndex];
        path.push(curIndex);
    }

    return path;
}

SeamCarver.prototype.removeVerticalSeam = function () {

    var seam = this.findVerticalSeam();

    var h = this._h;

    var res = [];

    for (var i = 0; i < seam.length; i++) {
        var col = seam[i];

        res.push({ col: col, color: this._img[h - i - 1][col] });

        for (var j = col; j < this._w - 1; j++) {
            this._img[h - i - 1][j] = this._img[h - i - 1][j + 1];
        }
    }

    this._w--;

    this._removedSeams.push(res);
}

SeamCarver.prototype.restoreVerticalSeam = function () {

    var w = this._w;
    var h = this._h;

    if (this._removedSeams.length == 0) {
        return;
    }

    var seam = this._removedSeams.pop();

    for (var i = 0; i < seam.length; i++) {
        var row = this._img[h - i - 1];
        var col = seam[i].col;
        var color = seam[i].color;

        for (var j = w - 1; j >= col; j--) {
            row[j + 1] = row[j];
        }

        row[col] = color;
    }

    this._w++;
}

SeamCarver.prototype.width = function () {
    return this._w;
}

SeamCarver.prototype._energyInternal = function (col, row) {
    if (col == 0 || row == 0 || col == this._w - 1 || row == this._h - 1) {
        return 1000;
    }

    var x1 = this._img[row][col - 1];
    var x1r = x1 >> 16 & 0xFF;
    var x1g = x1 >> 8 & 0xFF;
    var x1b = x1 & 0xFF;

    var x2 = this._img[row][col + 1];
    var x2r = x2 >> 16 & 0xFF;
    var x2g = x2 >> 8 & 0xFF;
    var x2b = x2 & 0xFF;

    var y1 = this._img[row - 1][col];
    var y1r = y1 >> 16 & 0xFF;
    var y1g = y1 >> 8 & 0xFF;
    var y1b = y1 & 0xFF;


    var y2 = this._img[row + 1][col];
    var y2r = y2 >> 16 & 0xFF;
    var y2g = y2 >> 8 & 0xFF;
    var y2b = y2 & 0xFF;

    var dx = (x1r - x2r) * (x1r - x2r) + (x1g - x2g) * (x1g - x2g) + (x1b - x2b) * (x1b - x2b);
    var dy = (y1r - y2r) * (y1r - y2r) + (y1g - y2g) * (y1g - y2g) + (y1b - y2b) * (y1b - y2b);

    return Math.sqrt(dx + dy);
}
