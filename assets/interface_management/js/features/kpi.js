(function (IM, $) {
	IM.KPI = {
		update() {
			const rows = $(IM.cfg.GRID).jqxGrid("getboundrows") || [];
			const rrdAktif = rows.filter((r) =>
				IM.utils.isRRDAktif(r.rrd_status)
			).length;
			const rrdNon = rows.filter((r) =>
				IM.utils.isRRDNonAktif(r.rrd_status)
			).length;
			const mrtgOn = rows.filter(IM.utils.isMRTGOn).length;
			const mrtgOff = rows.length - mrtgOn;

			const isTrue = (v) => v === true || v === "true" || v === 1 || v === "1";
			const ztTrue = rows.filter((r) => isTrue(r.zero_traffic)).length;
			const ztFalse = rows.length - ztTrue;

			$("#kpi-rrd-aktif").text(rrdAktif);
			$("#kpi-rrd-nonaktif").text(rrdNon);
			$("#kpi-mrtg-on").text(mrtgOn);
			$("#kpi-mrtg-off").text(mrtgOff);
			$("#kpi-zt-true").text(ztTrue);
			$("#kpi-zt-false").text(ztFalse);
		},

		// alias untuk kompatibilitas jika kode lama memanggil updateKPITotals()
		updateTotals() {
			IM.KPI.update();
		},

		_mrtgFilterState: null,
		_rrdFilterState: null,
		_ztFilterState: null,

		_applyMRTGFilter(mode) {
			const G = IM.cfg.GRID;
			$(G).jqxGrid("removefilter", "mrtg_status", false);
			if (mode) {
				const fg = new $.jqx.filter();
				fg.addfilter(1, fg.createfilter("stringfilter", mode, "equal"));
				$(G).jqxGrid("addfilter", "mrtg_status", fg, false);
			}
			$(G).jqxGrid("applyfilters");
			$("#card-mrtg-on, #card-mrtg-off").removeClass("active");
			if (mode === "on") $("#card-mrtg-on").addClass("active");
			if (mode === "off") $("#card-mrtg-off").addClass("active");
			IM.KPI._mrtgFilterState = mode;
		},

		_applyRRDFilter(mode) {
			const G = IM.cfg.GRID;
			$(G).jqxGrid("removefilter", "rrd_status", false);
			if (mode) {
				const fg = new $.jqx.filter();
				const v = mode === "aktif" ? "avail" : "unavail";
				fg.addfilter(1, fg.createfilter("stringfilter", v, "equal"));
				$(G).jqxGrid("addfilter", "rrd_status", fg, false);
			}
			$(G).jqxGrid("applyfilters");
			$("#card-rrd-aktif, #card-rrd-nonaktif").removeClass("active");
			if (mode === "aktif") $("#card-rrd-aktif").addClass("active");
			if (mode === "nonaktif") $("#card-rrd-nonaktif").addClass("active");
			IM.KPI._rrdFilterState = mode;
		},
		_applyZTFilter(mode) {
			const G = IM.cfg.GRID;
			$(G).jqxGrid("removefilter", "zero_traffic", false);
			if (mode) {
				const fg = new $.jqx.filter();
				// filter ke string "true" / "false" (sesuai datasource)
				fg.addfilter(1, fg.createfilter("stringfilter", mode, "equal"));
				$(G).jqxGrid("addfilter", "zero_traffic", fg, false);
			}
			$(G).jqxGrid("applyfilters");

			$("#card-zt-true, #card-zt-false").removeClass("active");
			if (mode === "true") $("#card-zt-true").addClass("active");
			if (mode === "false") $("#card-zt-false").addClass("active");
			IM.KPI._ztFilterState = mode;
		},

		wireCards() {
			$("#card-mrtg-on").on("click", () =>
				IM.KPI._applyMRTGFilter(IM.KPI._mrtgFilterState === "on" ? null : "on")
			);
			$("#card-mrtg-off").on("click", () =>
				IM.KPI._applyMRTGFilter(
					IM.KPI._mrtgFilterState === "off" ? null : "off"
				)
			);
			$("#card-rrd-aktif").on("click", () =>
				IM.KPI._applyRRDFilter(
					IM.KPI._rrdFilterState === "aktif" ? null : "aktif"
				)
			);
			$("#card-rrd-nonaktif").on("click", () =>
				IM.KPI._applyRRDFilter(
					IM.KPI._rrdFilterState === "nonaktif" ? null : "nonaktif"
				)
			);
			$("#card-zt-true").on("click", () =>
				IM.KPI._applyZTFilter(IM.KPI._ztFilterState === "true" ? null : "true")
			);
			$("#card-zt-false").on("click", () =>
				IM.KPI._applyZTFilter(
					IM.KPI._ztFilterState === "false" ? null : "false"
				)
			);
		},
	};
})(window.IM, jQuery);
