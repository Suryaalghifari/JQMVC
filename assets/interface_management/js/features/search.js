(function (IM, $) {
	IM.Search = {
		init() {
			let globalSearchTimer;
			$(IM.cfg.searchBox).on("input", function () {
				clearTimeout(globalSearchTimer);
				const q = this.value.trim().toLowerCase();

				globalSearchTimer = setTimeout(function () {
					const G = IM.cfg.GRID;
					$(G).jqxGrid("removefilter", "_search", false);

					if (q) {
						const fg = new $.jqx.filter();
						const f = fg.createfilter("stringfilter", q, "contains");
						fg.addfilter(1, f);
						$(G).jqxGrid("addfilter", "_search", fg, false);
					}

					$(G).jqxGrid("applyfilters");

					setTimeout(function () {
						const rows = $(G).jqxGrid("getdisplayrows");
						if (rows && rows.length) {
							const idx = $(G).jqxGrid("getrowboundindexbyid", rows[0].uid);
							$(G).jqxGrid("ensurerowvisible", idx);
						}
					}, 50);
				}, 250);
			});
		},
	};
})(window.IM, jQuery);
