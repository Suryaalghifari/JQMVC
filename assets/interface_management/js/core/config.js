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

	if (window.console) console.log("[IM] baseUrl =", IM.cfg.baseUrl);
})((window.IM = window.IM || {})); // <-- perhatikan bagian INI
