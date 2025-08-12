(function (IM) {
	var fromHead =
		(typeof window !== "undefined" && (window.BASE_URL || window.base_url)) ||
		"/";
	if (!fromHead.endsWith("/")) fromHead += "/";

	IM.cfg = {
		baseUrl: fromHead,
		GRID: "#jqxgrid",
		searchBox: "#globalSearch",
		cards: {
			rrdAktif: "#card-rrd-aktif",
			rrdNon: "#card-rrd-nonaktif",
			mrtgOn: "#card-mrtg-on",
			mrtgOff: "#card-mrtg-off",
		},
	};
})((window.IM = window.IM || {}));
