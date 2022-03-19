let prevColors, favColors;
const ANIM_DUR = 0.1;

if ("prevColors" in localStorage) {
	prevColors = localStorage.getItem("prevColors").split(",");
	for (i = 0; i < prevColors.length; i++) {
		let prevColor = `<div class="prev-color" style="background-color: #${prevColors[i]}"></div>`;
		$("#prev-colors .drawer__body .color-grid-2d").prepend(prevColor);
	}
} else {
	prevColors = [];
}

if ("favColors" in localStorage) {
	favColors = localStorage.getItem("favColors").split(",");
	for (i = 0; i < favColors.length; i++) {
		let prevColor = `<div class="fav-color" style="background-color: ${favColors[i]}"></div>`;
		$("#fav-colors .drawer__body .color-grid-2d").prepend(prevColor);
	}
} else {
	favColors = [];
}

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
		.to($(".image, .controls"), { duration: ANIM_DUR * 5, opacity: 1, "pointer-events": "auto" });
});

document.getElementById("pick-color").addEventListener("click", () => {
	const eyeDropper = new EyeDropper();
	eyeDropper
		.open()
		.then((result) => {
			result = result.sRGBHex.substring(1);
			if (!prevColors.includes(result)) {
				prevColors.push(result);
				localStorage.setItem("prevColors", prevColors);
				let prevColor = `<div class="prev-color" style="background-color: #${prevColors[prevColors.length - 1]}"></div>`;
				$("#prev-colors .drawer__body .color-grid-2d").prepend(prevColor);
			}

			let url = `https://www.thecolorapi.com/id?hex=${result}&format=json`;
			fetch(url)
				.then((response) => response.json())
				.then((data) => {
					$("#selected-color .drawer__body").children().remove();
					renderColorResult(data);
				})
				.then(() => {
					$("#selected-color").css("display", "block");
					$("#selected-color .drawer__head").trigger("click");
					tippy(".button--copy-color", {
						theme: "swwwatch",
						allowHTML: true,
					});
				});
		})
		.catch((e) => {
			console.error(e);
		});
});

$(document).on("click", ".button--fav", function () {
	let favColorHex = $(this).attr("data-saved-color");
	if (!favColors.includes(favColorHex)) {
		favColors.push(favColorHex);
		let favColor = `<div class="fav-color" style="background-color: ${favColorHex}"></div>`;
		$("#fav-colors .drawer__body .color-grid-2d").append(favColor);
		$(".button--fav span").text("Remove from favourites");
		$(".button--fav img").attr("src", "assets/img/star-fill.svg");
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

function renderColorResult(data) {
	let colorInfo = `
	<div class="color-grid">
		<div class="color-grid__color" style="background-color: hsl(${data.hsl.h}, ${data.hsl.s}%, ${data.hsl.l - 20}%)"></div>
		<div class="color-grid__color" style="background-color: hsl(${data.hsl.h}, ${data.hsl.s}%, ${data.hsl.l - 10}%)"></div>
		<div class="color-grid__color" style="background-color: ${data.hsl.value}"></div>
		<div class="color-grid__color" style="background-color: hsl(${data.hsl.h}, ${data.hsl.s}%, ${data.hsl.l + 10}%")></div>
		<div class="color-grid__color" style="background-color: hsl(${data.hsl.h}, ${data.hsl.s}%, ${data.hsl.l + 20}%")></div>
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
		.to(thisDrawer.find(".drawer__body"), { duration: ANIM_DUR, height: 475, padding: 36 })
		.to(thisDrawer.find(".drawer__body > div"), { duration: ANIM_DUR, opacity: 1 });
});

$(document).on("click", ".button--copy-color", function () {
	let copiedColor = $(this).attr("data-copy");
	navigator.clipboard.writeText(copiedColor);
});
