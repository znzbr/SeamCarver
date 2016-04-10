
$(function () {

    var seamCarver;
    var ctx;

    var dropbox = document.getElementById('dropbox');

    dropbox.addEventListener('dragenter', noopHandler, false);
    dropbox.addEventListener('dragexit', noopHandler, false);
    dropbox.addEventListener('dragover', noopHandler, false);
    dropbox.addEventListener('drop', drop, false);

    function noopHandler(evt) {
        evt.stopPropagation();
        evt.preventDefault();
    }

    function drop(evt) {
        evt.stopPropagation();
        evt.preventDefault();

        var file = evt.dataTransfer.files[0];
        var reader = new FileReader();
        reader.onload = function (e) {

            var img = document.getElementById("source");
            img.setAttribute("src", e.target.result);
            reflectImageOnCanvas();
        }
        reader.readAsDataURL(file);
    }

    function reflectImageOnCanvas() {
        var img = document.getElementById("source");
        var w = img.width;
        var h = img.height;

        var canvas = $("#canvas")[0];
        canvas.setAttribute("width", w + "px");
        canvas.setAttribute("height", h + "px");
        ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        seamCarver = new SeamCarver(ctx);
    }

    $(window).resize(function (a1, a2, a3) {

        var canvasHolder = $('#canvas-holder');
        var holderWidth = canvasHolder.width();

        var canvas = $("#canvas")[0];
        var canvasWidth = canvas.width;

        if (holderWidth < canvasWidth) {

            var colsToRemove = canvasWidth - holderWidth;

            for (var i = 0; i < colsToRemove; i++) {
                seamCarver.removeVerticalSeam();
            }

            ctx.canvas.width = holderWidth;
            ctx.putImageData(seamCarver.imageData(ctx), 0, 0);
        }
        else if (holderWidth > canvasWidth) {

            for (var i = 0; i < holderWidth - canvasWidth; i++) {
                seamCarver.restoreVerticalSeam();
            }

            ctx.canvas.width = seamCarver.width();
            ctx.putImageData(seamCarver.imageData(ctx), 0, 0);
        }
    });

    $('#examples img').click(function () {

        var img = document.getElementById("source");
        img.setAttribute("src", this.getAttribute('src'));
        reflectImageOnCanvas();

    });

});
