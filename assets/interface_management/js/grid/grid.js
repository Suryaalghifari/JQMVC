(function (IM, $) {
	IM.Grid = {
		init() {
			const $g = $(IM.cfg.GRID);

			// safety: pastikan jqxGrid sudah loaded
			if (!($.fn && $.fn.jqxGrid)) {
				console.error("[IM] jqxGrid belum ter-load");
				return;
			}

			$g.jqxGrid({
				width: "100%",
				height: 600,
				theme: "office",
				source: IM.dataAdapter,
				pageable: true,
				pagesizeoptions: ["5", "10", "20", "50", "100", "99999"],
				pagesize: 20,
				sortable: true,
				filterable: true,
				columnsmenu: true,
				editmode: "dblclick",
				showfiltermenuitems: true,
				filtermode: "default",
				editable: true,
				columnsresize: true,
				selectionmode: "checkbox",
				showtoolbar: false,
				columns: IM.columns,
				columnmenuopening: IM.ColMenu.opening,
			});

			if (IM.ColMenu && IM.ColMenu.bindGridMenuHandlers) {
				IM.ColMenu.bindGridMenuHandlers();
			}

			if (IM.KPI && IM.KPI.update) {
				$g.on(
					"bindingcomplete filter sort pagechanged pagesizechanged",
					IM.KPI.update
				);
			}

			$g.on("pagesizechanged", function (event) {
				const newPageSize = event.args.pagesize;
				const totalRows = $g.jqxGrid("getdatainformation").rowscount;
				if (newPageSize === "All" || newPageSize === 0 || newPageSize === "0") {
					$g.jqxGrid({ pagesize: totalRows });
				}
			});

			if (IM.Actions && IM.Actions.wireCellEdit) {
				IM.Actions.wireCellEdit();
			}
			if (IM.Edit && IM.Edit.initBulk) {
				IM.Edit.initBulk();
			}
		},
	};
})(window.IM, jQuery);
