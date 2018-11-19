(function (window) {

    function Matrix(data) {

        if (data == null) {
            data = [];
        }

        var context = [
            data[0] || 1,
            data[1] || 0,
            data[2] || 0,
            data[3] || 1,
            data[4] || 0,
            data[5] || 0
        ];

        context.getAngle = function () {
            return Math.atan2(this[1], this[0]);
        };

        context.concat = function (data) {
            return Matrix([
                this[0] * data[0] + this[2] * data[1],
                this[1] * data[0] + this[3] * data[1],
                this[0] * data[2] + this[2] * data[3],
                this[1] * data[2] + this[3] * data[3],
                this[0] * data[4] + this[2] * data[5] + this[4],
                this[1] * data[4] + this[3] * data[5] + this[5]
            ]);
        }

        context.rotate = function (theta, aboutPoint) {
            return this.concat(Matrix.rotate(theta, aboutPoint));
        }

        context.setRotation = function (angle, aboutPoint) {
            return this.rotate(angle - this.getAngle(), aboutPoint);
        }

        context.scale = function (scaleX, scaleY, aboutPoint) {
            return this.concat(Matrix.scale(scaleX, scaleY, aboutPoint));
        }

        context.translate = function (translateX, translateY) {
            return this.concat(Matrix.translate(translateX, translateY));
        }

        context.toCSSTransform = function () {
            return 'matrix(' + this.join(', ') + ')';
        }

        return context;
    }

    Matrix._isNumber = function (value) {
        return !isNaN(parseFloat(value));
    };

    Matrix.getScale = function (element) {
        var matrix = Matrix.getMatrix(element);
        var scaleX = matrix[0];
        var scaleY = matrix[3];
        return {
            scaleX: parseInt(scaleX),
            scaleY: parseInt(scaleY)
        };
    };

    Matrix.getCssData = function (element) {
        var styles = $(element).css(["top", "left", "width", "height", "margin-top", "margin-left"]);
        var data = {
            scale: Matrix.getScale(element),
            matrix: Matrix.getMatrix(element),
            translate: Matrix.getTranslate(element),
            top: parseFloat(styles.top.replace('px', '')),
            left: parseFloat(styles.left.replace('px', '')),
            width: parseFloat(styles.width.replace('px', '')),
            height: parseFloat(styles.height.replace('px', '')),
            marginTop: parseFloat(styles["margin-top"].replace('px', '')),
            marginLeft: parseFloat(styles["margin-left"].replace('px', '')),
        };
        return data;
    };

    Matrix.initSizeElements = function (items) {
        if (!items) return null;

        var sizeElements = [];
        items = Array.isArray(items) ? items : [items];
        for (var i = 0; i < items.length; i++) {
            var styles = $(items[i]).css(["top", "left", "width", "height", "transform"]);
            var size = {
                element: items[i],
                name: $(items[i]).prop('id'),
                matrix: Matrix.getMatrix(styles['transform']),
                top: parseFloat(styles['top'].replace('px', '')),
                left: parseFloat(styles['left'].replace('px', '')),
                width: parseFloat(styles['width'].replace('px', '')),
                height: parseFloat(styles['height'].replace('px', '')),
            }
            sizeElements.push(size);
        }
        return sizeElements;
    };

    Matrix.rotate = function (theta, aboutPoint) {

        var rotateMatrix = Matrix([
            Math.cos(theta), Math.sin(theta), -Math.sin(theta),
            Math.cos(theta), 0, 0
        ]);

        if (aboutPoint) {
            rotateMatrix = Matrix.translate(aboutPoint[0], aboutPoint[1]).concat(rotateMatrix)
                .concat(Matrix.translate(-aboutPoint[0], -aboutPoint[1]));
        }

        return rotateMatrix;
    };

    Matrix.updateCursor = function (element, degree) {
        var $element = $(element);
        for (var i = 1; i <= 8; i++)
            $element.removeClass('octant' + i);
        if (degree >= 337.5) {
            for (var i = 1; i <= 8; i++)
                $element.removeClass('octant' + i);
        } else if (degree >= 292.5) {
            $element.addClass('octant7');
        } else if (degree >= 247.5) {
            $element.addClass('octant6');
        } else if (degree >= 202.5) {
            $element.addClass('octant5');
        } else if (degree >= 157.5) {
            $element.addClass('octant4');
        } else if (degree >= 112.5) {
            $element.addClass('octant3');
        } else if (degree >= 67.5) {
            $element.addClass('octant2');
        } else if (degree >= 22.5) {
            $element.addClass('octant1');
        }
    };

    Matrix.getMatrix = function (transformOrElement) {
        var transform = null;
        if (typeof transformOrElement == 'string') {
            transform = transformOrElement;
        } else {
            var element = transformOrElement;
            transform = $(element).css("-webkit-transform") ||
                $(element).css("-moz-transform") ||
                $(element).css("-ms-transform") ||
                $(element).css("-o-transform") ||
                $(element).css("transform") ||
                null;
        }
        var currentMatrix = String(transform)
            .replace('matrix(', '')
            .replace(')', '')
            .replace(' ', '')
            .split(',');
        return Matrix([
            parseFloat(currentMatrix[0], 10) || 1,
            parseFloat(currentMatrix[1], 10) || 0,
            parseFloat(currentMatrix[2], 10) || 0,
            parseFloat(currentMatrix[3], 10) || 1,
            parseFloat(currentMatrix[4], 10) || 0,
            parseFloat(currentMatrix[5], 10) || 0,
        ]);
    };

    Matrix.getDegree = function (angleOrMatrixElement) {
        if (Matrix._isNumber(angleOrMatrixElement)) {
            var angle = angleOrMatrixElement;
            var degree = (angle > 0 ? angle : (2 * Math.PI + angle)) * 360 / (2 * Math.PI);
            return degree;
        } else if (Array.isArray(angleOrMatrixElement)) {
            var matrix = angleOrMatrixElement;
            var a = matrix[0];
            var b = matrix[1];
            var value = Math.atan2(b, a) * (180 / Math.PI);
            return (value < 0) ? value + 360 : value;
        } else {
            var element = angleOrMatrixElement;
            var matrix = Matrix.getMatrix(element);
            var a = matrix[0];
            var b = matrix[1];
            var value = Math.atan2(b, a) * (180 / Math.PI);
            return (value < 0) ? value + 360 : value;
        }
    };

    Matrix.scale = function (scaleX, scaleY, aboutPoint) {
        scaleY = scaleY || scaleX;

        var scaleMatrix = Matrix([
            scaleX, 0, 0,
            scaleY, 0, 0
        ]);

        if (aboutPoint) {
            scaleMatrix = Matrix.translate(aboutPoint[0], aboutPoint[1]).concat(scaleMatrix)
                .concat(Matrix.translate(-aboutPoint[0], -aboutPoint[1]));
        }

        return scaleMatrix;
    };

    Matrix.getData = function (angle, element, original) {
        var matrixs = Matrix.getMatrix(element);
        return {
            angle: angle,
            matrix: matrixs,
            translateX: matrixs[4],
            translateY: matrixs[5],
            degree: Matrix.getDegree(angle),
            original: original ? original : null,
            top: parseFloat($(element).css('top').replace('px')),
            left: parseFloat($(element).css('left').replace('px')),
            width: parseFloat($(element).css('width').replace('px')),
            height: parseFloat($(element).css('height').replace('px')),
        };
    };

    Matrix.getTranslate = function (matrixOrTransformOrElement) {
        var matrixs = Array.isArray(matrixOrTransformOrElement)
            ? matrixOrTransformOrElement
            : Matrix.getMatrix(matrixOrTransformOrElement);
        return {
            translateX: matrixs[4] || 0,
            translateY: matrixs[5] || 0,
        };
    };

    Matrix.translate = function (translateX, translateY, matrix) {
        if (!matrix)
            return Matrix([1, 0, 0, 1, translateX, translateY]);
        if (!Array.isArray(matrix))
            matrix = [1, 0, 0, 1, 0, 0];
        matrix[4] = translateX;
        matrix[5] = translateY;
        return matrix;
    };

    Matrix.getAngle = function (degreeOrMatrixOrTransformOrElement) {
        if (Matrix._isNumber(degreeOrMatrixOrTransformOrElement)) {
            var degree = degreeOrMatrixOrTransformOrElement;
            var angle = degree * (Math.PI / 180);
            return angle;
        } else if (Array.isArray(degreeOrMatrixOrTransformOrElement)) {
            var matrix = degreeOrMatrixOrTransformOrElement;
            return Math.atan2(matrix[1], matrix[0]);
        } else if (typeof degreeOrMatrixOrTransformOrElement == 'string') {
            var matrix = Matrix.getMatrix(degreeOrMatrixOrTransformOrElement);
            return Math.atan2(matrix[1], matrix[0]);
        } else {
            var element = degreeOrMatrixOrTransformOrElement;
            var matrix = Matrix.getMatrix(element);
            return Math.atan2(matrix[1], matrix[0]);
        }
    };

    window.Matrix = Matrix;
})(this);

(function (window, $) {

    var document = window.document;
    var defaults = {
        end: null,
        move: null,
        start: null,
        cancel: null,
        matrix: null,
        handle: null,
        alsoDrag: null,
        showEsc: false,
        showLabel: true,
        containment: null,
        zoomControl: null,
    }
    document.createDragManagerOverlay = function (rotateManager, element, options) {
        options = $.extend({}, defaults, options);
        return new (function DragManager() {

            var original = null;
            var moveEvent = null;
            var pressEvent = null;
            var cancelMove = false;
            var sizeElements = null;
            var labelPrinter = $(document.createElement('span')).addClass('labelPrinter').appendTo(element);
            var cornerPrinter = $(document.createElement('span')).addClass('cornerPrinter').appendTo(element);

            function keyup(event) {
                if (event.keyCode == 27) {
                    cancelMove = true;
                    $(document).trigger('mousemove');
                    $(document).trigger('mouseup');
                }
            }

            function mousePress(event) {
                moveEvent = event;
                pressEvent = event;
                cancelMove = false;
                sizeElements = Matrix.initSizeElements(options.alsoDrag);
                $(document)
                    .bind('keyup', keyup)
                    .bind('mousemove', mouseMove)
                    .bind('mouseup', mouseRelease);
                var data = Matrix.getData(rotateManager.angle, element);
                original = $.extend({}, data);
                data.original = original;
                if (options.start) {
                    options.start(data);
                }
            }

            function mouseMove(event) {
                var left = parseInt(element.style.left, 10) || 0;
                var top = parseInt(element.style.top, 10) || 0;
                var moveX = event.pageX - moveEvent.pageX;
                var moveY = event.pageY - moveEvent.pageY;
                if (cancelMove) {
                    moveX = 0;
                    moveY = 0;
                    top = original.top;
                    left = original.left;
                };

                var deltaX = moveX, deltaY = moveY;
                if (options.matrix && options.matrix != 'none') {
                    var angle = Matrix.getAngle(options.matrix);
                    deltaX = Math.round(moveX * Math.cos(angle) + moveY * Math.sin(angle));
                    deltaY = Math.round(moveY * Math.cos(angle) - moveX * Math.sin(angle));
                }

                element.style.left = (left + deltaX) + 'px';
                element.style.top = (top + deltaY) + 'px';
                if (sizeElements) {
                    for (var i = 0; i < sizeElements.length; i++) {
                        var drag = sizeElements[i],
                            topDrag = top + deltaY - (original.top - drag.top),
                            leftDrag = left + deltaX - (original.left - drag.left);
                        $(drag.element).css({ top: topDrag, left: leftDrag });
                    }
                }

                if (options.showLabel) {
                    var zoomControl = options.zoomControl;
                    var text = '[' + top + ', ' + left + ']';
                    if (zoomControl && $(zoomControl).length > 0) {
                        var topTemp = Math.round(top / $(zoomControl).val() * 100);
                        var leftTemp = Math.round(left / $(zoomControl).val() * 100);
                        text = '[' + topTemp + ', ' + leftTemp + ']';
                    }
                    cornerPrinter.text(text);
                    cornerPrinter.css({
                        top: 10,
                        display: 'block',
                        left: -text.length * 6,
                        width: text.length * 7.5
                    });

                    if (options.showEsc) {
                        if (original && (original.degree == 0 || original.degree == 360)) {
                            labelPrinter.text('Press [Esc] to cancel');
                            labelPrinter.css({ display: 'block' });
                        }
                    }
                }

                if (options.move) {
                    var data = Matrix.getData(rotateManager.angle, element, original);
                    data.offsetX = deltaX; data.offsetY = deltaY;
                    options.move(data);
                }
                moveEvent = event;
            }

            function mouseRelease(event) {
                labelPrinter.hide();
                cornerPrinter.hide();
                $(document)
                    .unbind('keyup', keyup)
                    .unbind('mousemove', mouseMove)
                    .unbind('mouseup', mouseRelease);

                if (cancelMove) {
                    if (options.cancel) {
                        options.cancel();
                    }
                    return;
                }
                var moveX = event.pageX - pressEvent.pageX;
                var moveY = event.pageY - pressEvent.pageY;
                if (moveX == 0 && moveY == 0) return;

                if (options.end) {
                    var data = Matrix.getData(rotateManager.angle, element, original);
                    data.sizeElements = Matrix.initSizeElements(options.alsoDrag);
                    options.end(data);
                }
            }

            this.destroy = function () {
                var cornerElement = $(element).find('.cornerPrinter');
                if (cornerElement.length > 0) cornerElement.remove();

                if (options.handle == null)
                    $(element).unbind('mousedown', mousePress);
                else
                    $(options.handle).unbind('mousedown', mousePress);
                $(document)
                    .unbind('keyup', keyup)
                    .unbind('mousemove', mouseMove)
                    .unbind('mouseup', mouseRelease);
            }

            if (options.handle == null) {
                $(element)
                    .css('position', 'absolute')
                    .bind('mousedown', mousePress);
            }
            else {
                $(options.handle)
                    .css('position', 'absolute')
                    .bind('mousedown', mousePress);
            }
        });
    }

})(this, jQuery);

(function (window, $) {

    var document = window.document;
    var defaults = {
        end: null,
        move: null,
        start: null,
        minWidth: 5,
        minHeight: 5,
        matrix: null,
        cancel: null,
        duration: 200,
        handles: 'all',
        showEsc: false,
        maxWidth: 2000,
        showLabel: true,
        maxHeight: 2000,
        alsoResize: null,
        aspectRatio: true,
        zoomControl: null,
    }
    document.createResizeManagerOverlay = function (rotateManager, element, options) {
        options = $.extend({}, defaults, options);
        return new (function ResizeManager() {

            var topRightHandler = $(document.createElement('div')).addClass('ui-resizable-handle ui-resizable-ne').appendTo(element);
            var topCenterHandler = $(document.createElement('div')).addClass('ui-resizable-handle ui-resizable-n').appendTo(element);
            var topLeftHandler = $(document.createElement('div')).addClass('ui-resizable-handle ui-resizable-nw').appendTo(element);

            var centerRightHandler = $(document.createElement('div')).addClass('ui-resizable-handle ui-resizable-e').appendTo(element);
            var centerLeftHandler = $(document.createElement('div')).addClass('ui-resizable-handle ui-resizable-w').appendTo(element);

            var bottomRightHandler = $(document.createElement('div')).addClass('ui-resizable-handle ui-resizable-se').appendTo(element);
            var bottomCenterHandler = $(document.createElement('div')).addClass('ui-resizable-handle ui-resizable-s').appendTo(element);
            var bottomLeftHandler = $(document.createElement('div')).addClass('ui-resizable-handle ui-resizable-sw').appendTo(element);

            var labelPrinter = $(document.createElement('span')).addClass('labelPrinter').appendTo(element);
            var widthPrinter = $(document.createElement('span')).addClass('widthPrinter').appendTo(element).text($(element).width());
            var heightPrinter = $(document.createElement('span')).addClass('heightPrinter').appendTo(element).text($(element).height());

            var ratio = 1, ratioWidth = 1;
            var moveEvent;
            var resizeHandler;
            var original = null;
            var sizeElements = null;
            var cancelResize = false;
            var newWidth, newHeight, currentMatrix;

            function keyup(event) {
                if (event.keyCode == 27) {
                    cancelResize = true;
                    $(document).trigger('mousemove');
                    $(document).trigger('mouseup');
                }
            }

            function mousePress(event) {
                cancelResize = false;
                event.preventDefault();
                event.stopImmediatePropagation();

                // init data when mouse press
                moveEvent = event;
                resizeHandler = event.target;
                newWidth = $(element).width();
                newHeight = $(element).height();
                currentMatrix = Matrix.getMatrix(element);
                ratio = $(element).height() / $(element).width();
                ratioWidth = $(element).width() / $(element).height();
                sizeElements = Matrix.initSizeElements(options.alsoResize);

                $(document)
                    .bind('keyup', keyup)
                    .bind('mousemove', mouseMove)
                    .bind('mouseup', mouseRelease);

                var data = Matrix.getData(rotateManager.angle, element);
                original = $.extend({}, data);
                data.original = original;
                if (options.start) {
                    options.start(data);
                }
                if (options.showLabel) {
                    $(widthPrinter).show();
                    $(heightPrinter).show();
                }
            }

            function mouseMove(event) {
                var moveX = event.pageX - moveEvent.pageX;
                var moveY = event.pageY - moveEvent.pageY;
                var deltaX = moveX, deltaY = moveY;
                if (options.matrix && options.matrix != 'none') {
                    var angle = Matrix.getAngle(options.matrix);
                    deltaX = Math.round(moveX * Math.cos(angle) + moveY * Math.sin(angle));
                    deltaY = Math.round(moveY * Math.cos(angle) - moveX * Math.sin(angle));
                } else {
                    var angle = rotateManager.angle;
                    deltaX = Math.round(moveX * Math.cos(angle) + moveY * Math.sin(angle));
                    deltaY = Math.round(moveY * Math.cos(angle) - moveX * Math.sin(angle));
                }

                var handle = '';
                if (topLeftHandler.is(resizeHandler)) {
                    handle = 'nw';
                    newWidth -= deltaX;
                    newHeight -= deltaY;
                    if (options.aspectRatio) {
                        newHeight = newWidth * ratio;
                        deltaY = deltaX * ratio;
                    }
                    currentMatrix = currentMatrix.translate(deltaX, deltaY);
                } else if (topCenterHandler.is(resizeHandler)) {
                    handle = 'n';
                    newHeight -= deltaY;
                    currentMatrix = currentMatrix.translate(0, deltaY);
                } else if (topRightHandler.is(resizeHandler)) {
                    handle = 'ne';
                    newWidth += deltaX;
                    newHeight -= deltaY;
                    if (options.aspectRatio) {
                        newWidth = newHeight * ratioWidth;
                    }
                    currentMatrix = currentMatrix.translate(0, deltaY);
                } else if (centerRightHandler.is(resizeHandler)) {
                    handle = 'e';
                    newWidth += deltaX;
                } else if (centerLeftHandler.is(resizeHandler)) {
                    handle = 'w';
                    newWidth -= deltaX;
                    currentMatrix = currentMatrix.translate(deltaX, 0);
                } else if (bottomRightHandler.is(resizeHandler)) {
                    handle = 'se';
                    newWidth += deltaX;
                    newHeight += deltaY;
                    if (options.aspectRatio) {
                        newHeight = newWidth * ratio;
                    }
                } else if (bottomCenterHandler.is(resizeHandler)) {
                    handle = 's';
                    newHeight += deltaY;
                } else if (bottomLeftHandler.is(resizeHandler)) {
                    handle = 'sw';
                    newWidth -= deltaX;
                    newHeight += deltaY;
                    if (options.aspectRatio) {
                        newHeight = newWidth * ratio;
                    }
                    currentMatrix = currentMatrix.translate(deltaX, 0);
                }
                if (newWidth < options.minWidth ||
                    newWidth > options.maxWidth ||
                    newHeight < options.minHeight ||
                    newHeight > options.maxHeight)
                    return;

                if (options.showLabel) {
                    var widthTemp = 0, heightTemp = 0;
                    var zoomControl = options.zoomControl;
                    if (zoomControl && $(zoomControl).length > 0) {
                        widthTemp = Math.round(newWidth / $(zoomControl).val() * 100);
                        heightTemp = Math.round(newHeight / $(zoomControl).val() * 100);
                    } else {
                        widthTemp = Math.round(newWidth);
                        heightTemp = Math.round(newHeight);
                    }
                    widthPrinter.text(widthTemp);
                    heightPrinter.text(heightTemp);
                }
                if (options.showEsc) {
                    if (original && (original.degree == 0 || original.degree == 360)) {
                        labelPrinter.text('Press [Esc] to cancel');
                        labelPrinter.css({ display: 'block' });
                    }
                }

                if (cancelResize) {
                    moveX = 0;
                    moveY = 0;
                    newWidth = original.width;
                    newHeight = original.height;
                    currentMatrix = original.matrix;
                }
                element.style.width = newWidth + 'px';
                element.style.height = newHeight + 'px';
                element.style.transform = currentMatrix.toCSSTransform();

                if (sizeElements) {
                    for (var i = 0; i < sizeElements.length; i++) {
                        var resize = sizeElements[i],
                            ratioResizeWidth = newWidth / original.width,
                            ratioResizeHeight = newHeight / original.height,
                            overlay = {
                                top: parseFloat(element.style.top.replace('px', '')),
                                left: parseFloat(element.style.left.replace('px', '')),
                            },
                            widthResize = ratioResizeWidth * resize.width,
                            heightResize = ratioResizeHeight * resize.height,
                            topResize = ratioResizeHeight * (resize.top - overlay.top) + overlay.top,
                            leftResize = ratioResizeWidth * (resize.left - overlay.left) + overlay.left;
                        $(resize.element).css({
                            top: topResize,
                            left: leftResize,
                            width: widthResize,
                            height: heightResize,
                            transform: element.style.transform
                        });
                    }
                }
                if (options.move) {
                    var data = Matrix.getData(rotateManager.angle, element, original);
                    data.offsetX = deltaX; data.offsetY = deltaY;
                    data.handle = handle;
                    options.move(data);
                }
                moveEvent = event;
            }

            function mouseRelease() {
                $(widthPrinter).hide();
                $(labelPrinter).hide();
                $(heightPrinter).hide();
                $(document)
                    .unbind('keyup', keyup)
                    .unbind('mousemove', mouseMove)
                    .unbind('mouseup', mouseRelease);

                if (cancelResize) {
                    if (options.cancel) {
                        options.cancel();
                    }
                    return;
                }
                if (options.end) {
                    var data = Matrix.getData(rotateManager.angle, element, original);
                    data.sizeElements = Matrix.initSizeElements(options.alsoResize);
                    options.end(data);
                }
            }

            initHandles();
            function initHandles() {
                if (options.matrix && options.matrix != 'none') {
                    var degree = Matrix.getDegree(options.matrix);
                    Matrix.updateCursor(element, degree);
                }

                var corners = $(element).find('.ui-resizable-handle');
                $(corners).hide();
                var handles = options.handles;
                var duration = options.duration;
                if (!handles || handles == 'all') {
                    $(corners).show(duration);
                    return;
                }
                var array = handles.split(',');
                for (var i = 0; i < array.length; i++) {
                    var handle = array[i].toString().trim();
                    var corner = $(element).find('.ui-resizable-' + handle);
                    if ($(corner).length > 0) {
                        $(corner).show(duration);
                    }
                }
            }

            topRightHandler.bind('mousedown', mousePress);
            topCenterHandler.bind('mousedown', mousePress);
            topLeftHandler.bind('mousedown', mousePress);

            centerLeftHandler.bind('mousedown', mousePress);
            centerRightHandler.bind('mousedown', mousePress);

            bottomRightHandler.bind('mousedown', mousePress);
            bottomCenterHandler.bind('mousedown', mousePress);
            bottomLeftHandler.bind('mousedown', mousePress);

            this.destroy = function () {
                var corners = $(element).find('.ui-resizable-handle');
                if (corners.length > 0) corners.remove();

                var widthElement = $(element).find('.widthPrinter');
                if (widthElement.length > 0) widthElement.remove();

                var heightElement = $(element).find('.heightPrinter');
                if (heightElement.length > 0) heightElement.remove();

                $(document)
                    .unbind('keyup', keyup)
                    .unbind('mousemove', mouseMove)
                    .unbind('mouseup', mouseRelease);
            }
        });
    }

})(this, jQuery);

(function (window, $) {

    var document = window.document;
    var defaults = {
        end: null,
        move: null,
        start: null,
        snap: false,
        cancel: null,
        showEsc: false,
        snapDegree: 45,
        snapTolerance: 5,
        alsoRotate: null,
        zoomControl: null,
    }
    document.createRotateManagerOverlay = (function (element, options) {
        options = $.extend({}, defaults, options);
        return new (function RotateManager() {

            var moveAngle = 0;
            var context = this;
            var pressAngle = 0;
            var original = null;
            var cancelRotate = false;
            this.angle = Matrix.getAngle(element);
            var degree = Matrix.getDegree(this.angle);
            $(element).css({ transformOrigin: '0% 0%' });
            Matrix.updateCursor(element, degree);

            var roundPrinter = $(document.createElement('span')).addClass('roundPrinter').appendTo(element);
            var rotateHandler = $(document.createElement('div')).addClass('rotateHandler').appendTo(element);
            var degreePrinter = $(document.createElement('span')).addClass('degreePrinter').html(Math.round(degree) + '&#176;').appendTo(element);

            function keyup(event) {
                if (event.keyCode == 27) {
                    cancelRotate = true;
                    $(document).trigger('mousemove');
                    $(document).trigger('mouseup');
                }
            }

            function mousePress(event) {
                cancelRotate = false;
                event.preventDefault();
                event.stopImmediatePropagation();

                var boundBox = element.getBoundingClientRect();

                var centerX = boundBox.left + (boundBox.width / 2);
                var centerY = boundBox.top + (boundBox.height / 2);

                pressAngle = moveAngle = Math.atan2(event.pageY - centerY, event.pageX - centerX);

                $(document)
                    .bind('keyup', keyup)
                    .bind('mousemove', mouseMove)
                    .bind('mouseup', mouseRelease);
                var data = Matrix.getData(context.angle, element);
                original = $.extend({}, data);
                data.original = original;
                if (options.start) {
                    options.start(data);
                }
                $(roundPrinter).show();
                $(degreePrinter).show();
            }

            function mouseMove(event) {
                var width = $(element).width();
                var height = $(element).height();
                var boundBox = element.getBoundingClientRect();
                var centerX = boundBox.left + (boundBox.width / 2);
                var centerY = boundBox.top + (boundBox.height / 2);

                var angle = (moveAngle - pressAngle) + context.angle;
                if (cancelRotate) {
                    angle = original.angle;
                    width = original.width;
                    height = original.height;
                }
                var degree = Matrix.getDegree(angle);
                if (options.snap) {
                    options.snapTolerance = Math.abs(options.snapTolerance);
                    var surplus = Math.round(degree % options.snapDegree);
                    var count = Math.round(degree / options.snapDegree);
                    var sub = surplus < options.snapTolerance ? surplus : Math.abs(surplus - options.snapDegree);
                    if (sub <= options.snapTolerance) {
                        degree = options.snapDegree * count;
                        angle = Matrix.getAngle(degree);
                    }
                }

                element.style.transform = Matrix.getMatrix(element).setRotation(angle, [width / 2, height / 2]).toCSSTransform();
                moveAngle = Math.atan2(event.pageY - centerY, event.pageX - centerX);
                if (cancelRotate) {
                    moveAngle = angle;
                }
                var degreeRound = Math.round(degree);
                if (degreeRound == 360) degreeRound = 0;
                degreePrinter.html(Math.round(degreeRound) + '&#176;');
                if (options.alsoRotate) {
                    $(options.alsoRotate).css({
                        transformOrigin: '0% 0%',
                        transform: element.style.transform
                    });
                }
                if (options.move) {
                    var data = Matrix.getData(context.angle, element, original);
                    options.move(data);
                }
            }

            function mouseRelease() {
                $(roundPrinter).hide();
                $(degreePrinter).hide();
                $(document)
                    .unbind('keyup', keyup)
                    .unbind('mousemove', mouseMove)
                    .unbind('mouseup', mouseRelease);
                if (cancelRotate) {
                    if (options.cancel) {
                        options.cancel();
                    }
                    var degree = Matrix.getDegree(original.angle);
                    Matrix.updateCursor(element, degree);
                    return;
                }

                context.angle = (moveAngle - pressAngle) + context.angle;
                if (options.alsoRotate) {
                    $(options.alsoRotate).css({
                        transformOrigin: '0% 0%',
                        transform: element.style.transform
                    });
                }
                var data = Matrix.getData(context.angle, element, original);
                if (options.end) {
                    options.end(data);
                }
                Matrix.updateCursor(element, data.degree);
            }

            rotateHandler.bind('mousedown', mousePress);

            this.destroy = function () {
                var rotateElement = $(element).find('.rotateHandler');
                if (rotateElement.length > 0) rotateElement.remove();

                var degreeElement = $(element).find('.degreePrinter');
                if (degreeElement.length > 0) degreeElement.remove();

                var roundElement = $(element).find('.roundPrinter');
                if (roundElement.length > 0) roundElement.remove();

                $(document)
                    .unbind('keyup', keyup)
                    .unbind('mousemove', mouseMove)
                    .unbind('mouseup', mouseRelease);
            }
        });
    });

})(this, jQuery);

(function (window, $) {

    var document = window.document;
    var rotateManagers = [], resizeManagers = [], dragManagers = [];

    var defaults = {
        resizable: {
            end: null,
            move: null,
            start: null,
            matrix: null,
            handles: 'all',
            alsoResize: null,
            aspectRatio: true,
        },
        draggable: {
            end: null,
            move: null,
            start: null,
            matrix: null,
            handle: null,
            alsoDrag: null,
        },
        rotatable: {
            end: null,
            move: null,
            start: null,
            matrix: null,
            snapDegree: 45,
            snapTolerance: 5,
            alsoRotate: null,
        },
        enableDrag: true,
        enableResize: true,
        enableRotate: true,
    };

    $.fn.overlay = function (options) {
        options = $.extend({}, defaults, options);
        return this.each(function () {

            var element = this;
            var rotateManager = { angle: 0 };
            var name = $(element).prop('id') || $(element).prop('class');

            if (options.enableRotate) {
                var index = -1;
                for (var i = 0; i < rotateManagers.length; i++) {
                    if (rotateManagers[i].name == name) {
                        index = i;
                        break;
                    }
                }
                rotateManager = document.createRotateManagerOverlay(element, options.rotatable);
                rotateManager.name = name;
                if (index == -1) rotateManagers.push(rotateManager);
                else rotateManagers[index] = rotateManager;
            }

            if (options.enableDrag) {
                var index = -1;
                for (var i = 0; i < dragManagers.length; i++) {
                    if (dragManagers[i].name == name) {
                        index = i;
                        break;
                    }
                }
                var dragManager = document.createDragManagerOverlay(rotateManager, element, options.draggable);
                dragManager.name = name;
                if (index == -1) dragManagers.push(dragManager);
                else dragManagers[index] = dragManager;
            }

            if (options.enableResize) {
                var index = -1;
                for (var i = 0; i < resizeManagers.length; i++) {
                    if (resizeManagers[i].name == name) {
                        index = i;
                        break;
                    }
                }
                var resizeManager = document.createResizeManagerOverlay(rotateManager, element, options.resizable);
                resizeManager.name = name;
                if (index == -1) resizeManagers.push(resizeManager);
                else resizeManagers[index] = resizeManager;
            }
        });
    };

    $.fn.destroyOverlay = function () {
        var element = this;
        var name = $(element).prop('id') || $(element).prop('class');

        for (var i = 0; i < dragManagers.length; i++) {
            if (dragManagers[i].name == name) {
                dragManagers[i].destroy();
                break;
            }
        }

        for (var i = 0; i < rotateManagers.length; i++) {
            if (rotateManagers[i].name == name) {
                rotateManagers[i].destroy();
                break;
            }
        }

        for (var i = 0; i < resizeManagers.length; i++) {
            if (resizeManagers[i].name == name) {
                resizeManagers[i].destroy();
                break;
            }
        }
    };

})(this, jQuery);