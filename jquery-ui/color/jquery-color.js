(function ($) {
	$.fn.colorWheel = function (options) {
		var that = this;

		// This is the easiest way to have default options.
		var settings = $.extend({
			// These are the defaults.
			id: null,
			opacity: 0,
			width: 200,
			color: null,
			height: 200,
			padding: 10,
			offset: null,
			preview: null,
			container: null,
			openEvent: null,
			closeEvent: null,
			selectedColor: null,
		}, options);

		var two55 = 255,
			oneHundred = 100,
			circleOffset = 10,
			mathRound = Math.round,
			width = settings.width,
			height = settings.height,
			preview = settings.preview,
			opacity = settings.opacity,
			id = settings.id ? settings.id : 'color-wheel';

		// Math helpers
		var math = Math,
			PI = math.PI,
			PI2 = PI * 2,
			sqrt = math.sqrt,
			atan2 = math.atan2,
			url = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEVAQEB/f39eaJUuAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3QYRBDgK9dKdMgAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAARSURBVAjXY/jPwIAVYRf9DwB+vw/x6vMT1wAAAABJRU5ErkJggg==';

		addColorPickerContainer(that, settings);
		var button = that[0],
			$container = $(id),
			canvas = $(id + ' canvas')[0],
			input = $(id + ' .input-rgb')[0],
			canvasContext = canvas.getContext('2d'),
			inputAlpha = $(id + ' .input-alpha')[0],
			inputValueHex = $(id + ' .input-hex')[0],
			labelPreview = $(id + ' .input-preview')[0];

		var currentY = oneHundred, currentX = -currentY,
			diameter = width - circleOffset * 2,
			radius = diameter / 2,
			radiusSquared = radius * radius,
			radiusPlusOffset = radius + circleOffset,
			wheelPixel = circleOffset * 4 * width + circleOffset * 4,
			imageData = canvasContext.createImageData(width, height), pixels = imageData.data;

		// Load color wheel data into memory.		
		for (y = input.min = 0; y < width; y++) {
			for (x = 0; x < width; x++) {
				var rx = x - radius,
					ry = y - radius,
					d = rx * rx + ry * ry,
					rgb = hsvToRgb((atan2(ry, rx) + PI) / PI2, sqrt(d) / radius, 1, 1);

				// Print current color, but hide if outside the area of the circle
				pixels[wheelPixel++] = rgb[0];
				pixels[wheelPixel++] = rgb[1];
				pixels[wheelPixel++] = rgb[2];
				pixels[wheelPixel++] = d > radiusSquared ? 0 : two55;
			}
		}

		input.oninput = redraw;
		inputAlpha.oninput = redraw;
		inputValueHex.oninput = setColor;
		button.onclick = toggleColorPicker;
		canvas.onmousedown = document.onmouseup = function (e) {
			document.onmousemove = /p/.test(e.type) ? 0 : (redraw(e), redraw);
		}

		redraw(0);
		if (settings.color) {
			var color = settings.color;
			if (/^#[0-9A-F]{6}$/i.test(color))
				inputValueHex.value = color;
			else if (color.indexOf('rgb') >= 0) {
				var items = color.split('(')[1].split(')')[0].split(',');
				var r = parseFloat(items[0]),
					g = parseFloat(items[1]),
					b = parseFloat(items[2]),
					hex = rgbToHex(r, g, b);
				inputValueHex.value = hex;
			}
			setColor();
		}
		function redraw(e) {
			var offset = $container.offset(),
				target = (e.target || e.srcElement);

			// Only process an actual change if it is triggered by the mousemove or mousedown event.
			// Otherwise e.pageX will be undefined, which will cause the result to be NaN, so it will fallback to the current value
			currentX = e.pageX - canvas.offsetLeft - offset.left - radiusPlusOffset || currentX;
			currentY = e.pageY - canvas.offsetTop - offset.top - radiusPlusOffset || currentY;

			// Scope these locally so the compiler will minify the names.  Will manually remove the 'var' keyword in the minified version.
			var theta = atan2(currentY, currentX),
				d = currentX * currentX + currentY * currentY;

			// If the x/y is not in the circle, find angle between center and mouse point:
			//   Draw a line at that angle from center with the distance of radius
			//   Use that point on the circumference as the draggable location
			if (d > radiusSquared) {
				currentX = radius * math.cos(theta);
				currentY = radius * math.sin(theta);
				theta = atan2(currentY, currentX);
				d = currentX * currentX + currentY * currentY;
			}

			var s = parseFloat(sqrt(d) / radius),
				h = parseFloat((theta + PI) / PI2),
				v = parseFloat(input.value / 10000),
				a = parseFloat(inputAlpha.value / oneHundred);
			var colors = hsvToRgb(h, s, v, a);
			labelPreview.style.background = colors[4];
			if (preview) {
				$(preview).css({ backgroundColor: colors[4] });
			}
			var classList = target ? target.classList.value : '';
			if (classList.indexOf('canvas-color') >= 0) {
				var otherColors = hsvToRgb(h, s, 1, 1);
				input.style.backgroundColor = otherColors[4];
				inputAlpha.style.background = 'linear-gradient(to left, ' + colors[7] + ', ' + colors[6] + '), url(' + url + ')';
			}
			if (classList.indexOf('canvas-color') >= 0 || classList.indexOf('input-rgb') >= 0) {
				inputValueHex.value = '#' + colors[5].toUpperCase();
			}

			// Reset to color wheel and draw a spot on the current location. 
			canvasContext.putImageData(imageData, 0, 0);

			// Circle:
			canvasContext.beginPath();
			canvasContext.lineWidth = 2;
			canvasContext.strokeStyle = '#fff';
			canvasContext.arc(~~currentX + radiusPlusOffset, ~~currentY + radiusPlusOffset, 7, 0, PI2);
			canvasContext.stroke();

			if (e && settings.selectedColor) {
				if (!e.disableSelected)
					settings.selectedColor(colors[4]);
				e.disableSelected = false;
			}

		}

		function hsvToRgb(h, s, v, a) {
			h *= 6;
			var i = ~~h,
				f = h - i,
				p = v * (1 - s),
				q = v * (1 - f * s),
				t = v * (1 - (1 - f) * s),
				mod = i % 6,
				r = [v, q, p, p, t, v][mod] * two55,
				g = [t, v, v, q, p, p][mod] * two55,
				b = [p, p, t, v, v, q][mod] * two55,
				hex = rgbToHex(r, g, b, false);
			return [r, g, b, a, "rgb(" + ~~r + "," + ~~g + "," + ~~b + "," + a + ")", hex, "rgb(" + ~~r + "," + ~~g + "," + ~~b + ", 0)", "rgb(" + ~~r + "," + ~~g + "," + ~~b + ", 1)"];
		}

		function rgbToHsv(r, g, b) {

			r = bound01(r, 255);
			g = bound01(g, 255);
			b = bound01(b, 255);

			var max = Math.max(r, g, b), min = Math.min(r, g, b);
			var h, s, v = max;

			var d = max - min;
			s = max === 0 ? 0 : d / max;

			if (max == min) {
				h = 0; // achromatic
			}
			else {
				switch (max) {
					case r: h = (g - b) / d + (g < b ? 6 : 0); break;
					case g: h = (b - r) / d + 2; break;
					case b: h = (r - g) / d + 4; break;
				}
				h /= 6;
			}
			return { h: h, s: s, v: v };
		}

		function rgbToHex(r, g, b, allow3Char) {
			var hex = [
				pad2(mathRound(r).toString(16)),
				pad2(mathRound(g).toString(16)),
				pad2(mathRound(b).toString(16))
			];

			// Return a 3 character hex if possible
			if (allow3Char &&
				hex[0].charAt(0) == hex[0].charAt(1) &&
				hex[1].charAt(0) == hex[1].charAt(1) &&
				hex[2].charAt(0) == hex[2].charAt(1)) {
				return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0);
			}

			return hex.join("");
		}

		function hexToRgb(hex) {
			var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
			return result ? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16)
			} : null;
		}

		function hexToHsv(hex) {
			var rgb = hexToRgb(hex);
			return rgbToHsv(rgb.r, rgb.g, rgb.b);
		}

		function toggleColorPicker() {
			opacity = opacity == 0 ? 1 : 0;
			if (opacity == 0 && settings.closeEvent) {
				settings.closeEvent();
			}
			if (opacity == 1 && settings.openEvent) {
				settings.openEvent();
			}
			$(id).css({
				opacity: opacity,
				transition: 'opacity 0.5s linear 0s'
			});
		}

		function setColor(color, disableSelected) {
			if (!color) color = inputValueHex.value;
			color = color.toUpperCase();
			if (color.indexOf('RGB') >= 0) {
				var items = color.split('(')[1].split(')')[0].split(',');
				var r = parseFloat(items[0]),
					g = parseFloat(items[1]),
					b = parseFloat(items[2]);
				color = rgbToHex(r, g, b);
			}
			if (color.indexOf('#') == -1) color = '#' + color;
			inputValueHex.value = color;

			var hsv = null, alpha = 1;
			if (/^#[0-9A-F]{6}$/i.test(color))
				hsv = hexToHsv(color);

			if (hsv) {
				var theta = hsv.h * PI2 - PI;
				var d = (hsv.s * radius) * (hsv.s * radius);
				var thetaTan = Math.tan(theta);
				var ratio = d / (thetaTan * thetaTan + 1);
				currentX = Math.sqrt(ratio);
				currentY = currentX * thetaTan;
				input.value = hsv.v * 10000;
				inputAlpha.value = alpha * 100;
				var e = {
					disableSelected: disableSelected,
					target: { classList: { value: 'canvas-color' } },
				};
				if (Math.abs(theta) >= 2) {
					currentX = -currentX;
					currentY = -currentY;
				}
				redraw(e);
			}
		}

		that.setColor = setColor;
		return that;
	};

	function addColorPickerContainer(that, settings) {
		var id = settings.id ? settings.id : '#color-wheel';
		var html = '<div class="color-wheel" id="' + id.replace('#', '') + '">'
			+ '<div class="color-wheel-header">Text Color</div>'
			+ '<div><canvas class="canvas-color" height="' + settings.height + '" width="' + settings.width + '"></canvas></div>'
			+ '<div class="canvas-color-border"></div>'
			+ '<div class="input-ranges">'
			+ '<input class="input-rgb" min="0" max="10000" type="range" value="10000" />'
			+ '<input class="input-alpha" min="0" max="100" type="range" value="100" />'
			+ '</div>'
			+ '<div class="input-values">'
			+ '<div class="color-wheel-code"><label>Color Code</label><input class="input-hex" /><i></i></div>'
			+ '<div class="color-wheel-preview"><label>Preview</label><span class="input-preview">&nbsp;</span><i></i></div>'
			+ '<div style="clear: both;"></div>'
			+ '</div></div>';
		$(id).remove();
		if (settings.container) {
			$(settings.container).append(html);
		} else that.parent().append(html);

		var $container = $(id),
			$canvasBorder = $(id + ' .canvas-color-border');
		if (settings.offset) {
			$container.css({
				top: settings.offset.top,
				padding: settings.padding,
				opacity: settings.opacity,
				left: settings.offset.left,
			});
		} else {
			var offset = that[0].position();
			$container.css({
				left: offset.left,
				padding: settings.padding,
				opacity: settings.opacity,
				top: offset.top + that[0].height(),
			});
		}

		$canvasBorder.css({
			width: settings.width - 21,
			height: settings.height - 21
		});
		$container.css({ width: settings.width });
	};

	function pad2(c) {
		return c.length == 1 ? '0' + c : '' + c;
	};

	function bound01(n, max) {
		if (isOnePointZero(n)) { n = "100%"; }

		var processPercent = isPercentage(n);
		n = Math.min(max, Math.max(0, parseFloat(n)));

		// Automatically convert percentage into number
		if (processPercent) {
			n = parseInt(n * max, 10) / 100;
		}

		// Handle floating point rounding errors
		if ((Math.abs(n - max) < 0.000001)) {
			return 1;
		}

		// Convert into [0, 1] range if it isn't already
		return (n % max) / parseFloat(max);
	}

	// Check to see if string passed in is a percentage
	function isPercentage(n) {
		return typeof n === "string" && n.indexOf('%') != -1;
	}

	// Need to handle 1.0 as 100%, since once it is a number, there is no difference between it and 1
	function isOnePointZero(n) {
		return typeof n == "string" && n.indexOf('.') != -1 && parseFloat(n) === 1;
	}
})(jQuery);