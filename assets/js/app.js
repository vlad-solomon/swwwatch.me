let prevColors, favColors;
const ANIM_DUR = 0.1;

if (window.EyeDropper) {
	$("body").removeClass("hidden");
} else {
	alert(`Sorry, ${navigator.appCodeName} is not supported yet!`);
}

if ("prevColors" in localStorage) {
	prevColors = localStorage.getItem("prevColors").split(",");
	for (i = 0; i < prevColors.length; i++) {
		let prevColor = `<div class="prev-color" data-tippy-content="#${prevColors[i]}" style="background-color: #${prevColors[i]}"></div>`;
		$("#prev-colors .drawer__body .color-grid-2d").prepend(prevColor);
	}
} else {
	prevColors = [];
}

if ("favColors" in localStorage) {
	favColors = localStorage.getItem("favColors").split(",");
	for (i = 0; i < favColors.length; i++) {
		let favColor = `<div class="fav-color" data-tippy-content="${favColors[i]}" style="background-color: ${favColors[i]}"></div>`;
		$("#fav-colors .drawer__body .color-grid-2d").prepend(favColor);
	}
} else {
	favColors = [];
}

tippy(".fav-color, .prev-color", {
	theme: "swwwatch",
	allowHTML: true,
});

$(document).on("mousemove", ".image", function (event) {
	let imageParentHalf = $(".image").width() / 2;
	if (event.offsetX >= imageParentHalf) {
		$(".selected-pixel").addClass("selected-pixel--left");
	} else {
		$(".selected-pixel").removeClass("selected-pixel--left");
	}
});

let element, instance;

element = document.querySelector(".image__uploaded");
instance = panzoom(element, {
	bounds: true,
	boundsPadding: 0.25,
	maxZoom: 10,
	minZoom: 1,
	transformOrigin: { x: 0.5, y: 0.5 },
});
instance.on("panstart", function () {
	$(".image").css("cursor", "grabbing");
});

instance.on("panend", function () {
	$(".image").css("cursor", "grab");
});

document.addEventListener("paste", function (event) {
	const clipboardItems = event.clipboardData.items;
	const items = [].slice.call(clipboardItems).filter(function (item) {
		return item.type.indexOf("image") !== -1;
	});
	if (items.length === 0) return;

	const item = items[0];
	const blob = item.getAsFile();

	document.querySelector(".image__uploaded").src = URL.createObjectURL(blob);
	document.querySelector(".image__uploaded--blurred").src = URL.createObjectURL(blob);

	gsap.timeline()
		.to($(".welcome"), { duration: ANIM_DUR * 5, opacity: 0, "pointer-events": "none" })
		.to($(".image, .controls--default"), { duration: ANIM_DUR * 5, opacity: 1, "pointer-events": "auto" });
});

function fetchColor(url) {
	fetch(url)
		.then((response) => response.json())
		.then((data) => {
			$("#selected-color .drawer__body").children().remove();
			renderColorResult(data);
			tippy(".color-grid__color, .button--copy-color", { theme: "swwwatch", allowHTML: true });
		})
		.then(() => {
			$("#selected-color").css("display", "block");
			$("#selected-color .drawer__head").trigger("click");
		});
}

document.getElementById("pick-color").addEventListener("click", () => {
	const eyeDropper = new EyeDropper();
	eyeDropper
		.open()
		.then((result) => {
			result = result.sRGBHex.substring(1);
			if (!prevColors.includes(result)) {
				prevColors.push(result);
				localStorage.setItem("prevColors", prevColors);
				let prevColor = `<div class="prev-color" data-tippy-content="#${prevColors[prevColors.length - 1]}" style="background-color: #${prevColors[prevColors.length - 1]}"></div>`;
				$("#prev-colors .drawer__body .color-grid-2d").prepend(prevColor);
				tippy(`.prev-color[data-tippy-content='#${prevColors[prevColors.length - 1]}']`, { theme: "swwwatch" });
			}

			let url = `https://www.thecolorapi.com/id?hex=${result}&format=json`;
			fetchColor(url);
		})
		.catch((e) => {
			console.error(e);
		});
});

$(document).on("click", ".color-grid__color, .prev-color, .fav-color", function () {
	let color = $(this).attr("data-tippy-content").substring(1);
	let url = `https://www.thecolorapi.com/id?hex=${color}&format=json`;
	fetchColor(url);
});

$(document).on("click", ".button--fav", function () {
	let favColorHex = $(this).attr("data-saved-color");
	if (!favColors.includes(favColorHex)) {
		favColors.push(favColorHex);
		let favColor = `<div class="fav-color" data-tippy-content="${favColorHex}" style="background-color: ${favColorHex}"></div>`;
		$("#fav-colors .drawer__body .color-grid-2d").prepend(favColor);
		$(".button--fav span").text("Remove from favourites");
		$(".button--fav img").attr("src", "assets/img/star-fill.svg");
		tippy(`.fav-color[data-tippy-content="${favColorHex}"]`, { theme: "swwwatch" });
	} else {
		favColors = favColors.filter(function (color) {
			return color !== favColorHex;
		});
		$(`.fav-color[style="background-color: ${favColorHex}"]`).remove();
		$(".button--fav span").text("Save to favourites");
		$(".button--fav img").attr("src", "assets/img/star.svg");
	}
	localStorage.setItem("favColors", favColors);
	if (localStorage.getItem("favColors") === "") {
		localStorage.removeItem("favColors");
	}
});

function hslToHex(h, s, l) {
	l /= 100;
	const a = (s * Math.min(l, 1 - l)) / 100;
	const f = (n) => {
		const k = (n + h / 30) % 12;
		const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
		return Math.round(255 * color)
			.toString(16)
			.padStart(2, "0");
	};
	return `#${f(0)}${f(8)}${f(4)}`;
}

function renderColorResult(data) {
	let gridColors = [
		[data.hsl.h, data.hsl.s, Math.max(data.hsl.l - 20, 0)],
		[data.hsl.h, data.hsl.s, Math.max(data.hsl.l - 10, 0)],
		[data.hsl.h, data.hsl.s, data.hsl.l],
		[data.hsl.h, data.hsl.s, Math.min(data.hsl.l + 10, 100)],
		[data.hsl.h, data.hsl.s, Math.min(data.hsl.l + 20, 100)],
	];
	for (i = 0; i < gridColors.length; i++) {
		gridColors[i] = hslToHex(gridColors[i][0], gridColors[i][1], gridColors[i][2]);
	}

	let colorInfo = `
	<div class="color-grid inset-border">
		${gridColors.map((color) => `<div class="color-grid__color" data-tippy-content="${color}" style="background-color: ${color}"></div>`).join("")}
	</div>
	<div class="color-info">
		<div class="color-info__type">hex</div>
		<div class="color-info__props">
			<span class="color-info__prop">${data.hex.value}</span>
		</div>
		<div class="button button--square button--copy-color" data-copy="${data.hex.value}" data-tippy-content="${data.hex.value}<br><span>Click to copy</span>">
			<img src="assets/img/copy.svg" alt="copy colour" />
		</div>
	</div>
	<div class="color-info">
		<div class="color-info__type">rgb</div>
		<div class="color-info__props">
			<span class="color-info__prop">${data.rgb.r}</span>
			<span class="color-info__prop">${data.rgb.g}</span>
			<span class="color-info__prop">${data.rgb.b}</span>
		</div>
		<div class="button button--square button--copy-color" data-copy="${data.rgb.value}" data-tippy-content="${data.rgb.value}<br><span>Click to copy</span>">
			<img src="assets/img/copy.svg" alt="copy colour" />
		</div>
	</div>
	<div class="color-info">
		<div class="color-info__type">hsl</div>
		<div class="color-info__props">
			<span class="color-info__prop">${data.hsl.h}</span>
			<span class="color-info__prop">${data.hsl.s}</span>
			<span class="color-info__prop">${data.hsl.l}</span>
		</div>
		<div class="button button--square button--copy-color" data-copy="${data.hsl.value}" data-tippy-content="${data.hsl.value}<br><span>Click to copy</span>">
			<img src="assets/img/copy.svg" alt="copy colour" />
		</div>
	</div>
	<div class="color-info">
		<div class="color-info__type">cmyk</div>
		<div class="color-info__props">
			<span class="color-info__prop">${data.cmyk.c || "0"}</span>
			<span class="color-info__prop">${data.cmyk.m || "0"}</span>
			<span class="color-info__prop">${data.cmyk.y || "0"}</span>
			<span class="color-info__prop">${data.cmyk.k || "0"}</span>
		</div>
		<div class="button button--square button--copy-color" data-copy="${data.cmyk.value}" data-tippy-content="${data.cmyk.value}<br><span>Click to copy</span>">
			<img src="assets/img/copy.svg" alt="copy colour" />
		</div>
	</div>
	<div class="button button--fav" data-saved-color="${data.hex.value}">
		<img src="assets/img/${favColors.includes(data.hex.value) ? "star-fill" : "star"}.svg" alt="favourite color" />
		<span>${favColors.includes(data.hex.value) ? "Remove from favourites" : "Save to favourites"}</span>
	</div>
`;
	$("#selected-color .drawer__body").append(colorInfo);
}

$(window).resize(function () {
	if ($(window).width() <= 1280) {
		$(".drawer--active .drawer__body").css({ padding: "18px", height: "435px" });
	} else {
		$(".drawer--active .drawer__body").css({ padding: "36px", height: "475px" });
	}
});

$(document).on("click", ".drawer__head", function () {
	let thisDrawer = $(this).parent();
	$(".drawer").removeClass("drawer--active");
	$(this).parent().addClass("drawer--active");
	gsap.timeline()
		.to($(".drawer").not(thisDrawer).find(".drawer__body > div"), { duration: ANIM_DUR, opacity: 0 })
		.to($(".drawer").not(thisDrawer).find(".drawer__body"), { duration: ANIM_DUR, height: 0, padding: 0 }, "<")
		.set($(".drawer").not(thisDrawer).find(".drawer__head"), { "pointer-events": "auto" });

	gsap.timeline()
		.set(thisDrawer.find(".drawer__head"), { "pointer-events": "none" })
		.to(thisDrawer.find(".drawer__body"), { duration: ANIM_DUR, height: $(window).width() <= 1280 ? 435 : 475, padding: $(window).width() <= 1280 ? 18 : 36 })
		.to(thisDrawer.find(".drawer__body > div"), { duration: ANIM_DUR, opacity: 1 });
});

$(document).on("click", ".button--copy-color", function () {
	let copiedColor = $(this).attr("data-copy");
	navigator.clipboard.writeText(copiedColor);
});

let paletteOrder = ["DarkVibrant", "DarkMuted", "Muted", "Vibrant", "LightVibrant", "LightMuted"];

function getContrastColor(hexcolor) {
	var r = parseInt(hexcolor.substr(1, 2), 16);
	var g = parseInt(hexcolor.substr(3, 2), 16);
	var b = parseInt(hexcolor.substr(5, 2), 16);
	var yiq = (r * 299 + g * 587 + b * 114) / 1000;
	return yiq >= 128 ? "black" : "white";
}

$(document).on("click", "#generate-palette", function () {
	let image = $(".image__uploaded").attr("src");
	$(".palette-color").remove();
	Vibrant.from(image)
		.getPalette()
		.then(function (palette) {
			for (i = 0; i < paletteOrder.length; i++) {
				let paletteSection = paletteOrder[i];
				let hex = palette[paletteSection].hex;
				let color = `<div class="palette-color" style="background-color: ${hex}"><span style="color: ${getContrastColor(hex)}">${hex}</span></div>`;
				$(".generated-palette").append(color);
			}
			$(".palette").css("display", "flex");
		})
		.then(() => {
			gsap.timeline().set($(".palette"), { display: "flex" }).to($(".palette"), { duration: 0.2, opacity: 1, "pointer-events": "auto" });
		});
});

$(document).on("click", "#close-palette", function () {
	gsap.timeline().set($(".palette"), { "pointer-events": "none" }).to($(".palette"), { duration: 0.2, opacity: 0 }).set($(".palette"), { display: "none" });
});

$(document).on("click", "#download-palette", function () {
	$(".palette").clone().addClass("cloned").appendTo("body");
	$(".palette.cloned").find(".palette__footer, .palette-color span, .generated-palette").addClass("visible");
	$(".palette.cloned").find("#download-wrapper").attr("id", "download-wrapper-cloned");
	html2canvas(document.querySelector("#download-wrapper-cloned"), { scale: 2 }).then((canvas) => {
		$(".palette.cloned").find(".palette__footer, .palette-color span, .generated-palette").removeClass("visible");
		document.body.appendChild(canvas);
		let palette = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
		let link = document.createElement("a");
		if (typeof link.download === "string") {
			link.href = palette;
			link.download = `Generated theme.png`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
		$("#close-palette").trigger("click");
		$(".palette.cloned, canvas").remove();
	});
});
