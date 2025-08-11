$(function () {
	// data
	const source = {
		datatype: "json",
		datafields: [
			{ name: "id", type: "string" },
			{ name: "peering", type: "string" },
			{ name: "location", type: "string" },
			{ name: "interface", type: "string" },
			{ name: "pop_site", type: "string" },
			{ name: "rrd_path", type: "string" },
			{ name: "rrd_alias", type: "string" },
			{ name: "rrd_status", type: "string" },
			{ name: "Capacity", type: "number" },
			{ name: "service", type: "string" },
			{ name: "zero_traffic", type: "string" },
			{ name: "_search", type: "string" },
			{ name: "mrtg_status", type: "string" },
		],

		url: base_url + "api/services_get", // API endpoint ambil data services
	};
	const dataAdapter = new $.jqx.dataAdapter(source, {
		beforeLoadComplete: function (records) {
			records.forEach(function (row) {
				const status = String(row.rrd_status || "")
					.toLowerCase()
					.trim();
				const pathStr =
					row.rrd_path == null ? "" : String(row.rrd_path).trim().toLowerCase();
				const hasPath =
					pathStr !== "" &&
					pathStr !== "null" &&
					pathStr !== "undefined" &&
					pathStr !== "-";

				row.zero_traffic = status === "avail" && hasPath ? "true" : "false";
				row.mrtg_status = status === "avail" && hasPath ? "on" : "off";

				const parts = [
					row.id,
					row.peering,
					row.location,
					row.interface,
					row.pop_site,
					row.rrd_path,
					row.rrd_alias,
					row.rrd_status,
					row.Capacity,
					row.service,
				];
				row._search = parts
					.map((v) => (v == null ? "" : String(v)))
					.join(" ")
					.toLowerCase();
			});
			return records;
		},

		loadComplete: function (records) {
			allRecords = Array.isArray(records) ? records : [];
			updateKPITotals();
		},
	});

	const GRID = "#jqxgrid";

	$(GRID).jqxGrid({
		width: "100%",
		height: 600,
		theme: "office",
		source: dataAdapter,
		pageable: true,
		pagesizeoptions: ["5", "10", "20", "50", "100", "99999"],
		pagesize: 20,
		sortable: true,
		filterable: true,
		columnsmenu: true,

		//filtermode: "excel",
		//showfilterrow: true,
		showfiltermenuitems: true,
		filtermode: "default",
		editable: true,
		columnsresize: true,
		selectionmode: "checkbox",
		showtoolbar: false,

		columns: [
			{
				text: "No",
				width: 50,
				editable: false,
				align: "center",
				textalign: "center",
				filterable: false, // jangan tampilkan menu filter di kolom No
				cellsrenderer: function (row) {
					return `<div style="text-align:center; width:100%;">${row + 1}</div>`;
				},
			},

			{
				text: "Peering",
				datafield: "peering",
				width: 200,
				align: "center",
				cellsalign: "center",
			},

			{
				text: "Location",
				datafield: "location",
				width: 180,
				align: "center",
				cellsalign: "center",
				filtertype: "custom",
				createfilterpanel: function (datafield, panel) {
					// >>> biar item LI yang menampung panel nggak ngunci tinggi
					$(panel).closest("li").css({ height: "auto", overflow: "visible" });

					// >>> scroll TUNGGAL di area panel (di bawah "Remove Sort")
					$(panel).css({
						display: "block",
						maxHeight: "none",
						overflow: "visible",
					});

					// --- lanjut isi panel seperti biasa ---
					const $wrap = $('<div class="cm-filter-wrap"></div>').appendTo(panel);

					const rows = $("#jqxgrid").jqxGrid("getboundrows") || [];
					const seen = {},
						values = [];
					for (let i = 0; i < rows.length; i++) {
						const v = rows[i][datafield];
						if (v != null && v !== "" && !seen[v]) {
							seen[v] = true;
							values.push(v);
						}
					}
					values.sort();

					// holder list (tinggi kecil saja; panel yg scroll)
					const $lbHolder = $('<div class="lb-holder"></div>').appendTo($wrap);
					const $list = $("<div/>").appendTo($lbHolder).jqxListBox({
						source: values,
						checkboxes: true,
						filterable: true,
						searchMode: "containsignorecase",
						width: "100%",
						height: 100,
					});

					$(
						'<div style="margin:2px 0 2px;font-weight:600">Show rows where:</div>'
					).appendTo($wrap);

					// opsi operator
					const OPS = [
						{ label: "empty", value: "null" },
						{ label: "not empty", value: "not_null" },
						{ label: "contains", value: "contains" },
						{
							label: "contains (match case)",
							value: "contains_case_sensitive",
						},
						{ label: "does not contain", value: "does_not_contain" },
						{
							label: "does not contain (match case)",
							value: "does_not_contain_case_sensitive",
						},
						{ label: "equals", value: "equal" },
						{ label: "not equal", value: "not_equal" },
						{ label: "starts with", value: "starts_with" },
						{
							label: "starts with (match case)",
							value: "starts_with_case_sensitive",
						},
						{ label: "ends with", value: "ends_with" },
						{
							label: "ends with (match case)",
							value: "ends_with_case_sensitive",
						},
					];

					function makeRow(parent) {
						const $op = $("<div></div>").appendTo(parent).jqxDropDownList({
							source: OPS,
							displayMember: "label",
							valueMember: "value",
							selectedIndex: 2,
							width: "100%",
							height: 28,
						});
						const $inp = $('<input type="text">')
							.appendTo(parent)
							.jqxInput({ width: "100%", height: 28 });
						const toggle = (v) =>
							$inp
								.closest(".jqx-input, input")
								.toggle(!(v === "null" || v === "not_null"));
						$op.on("change", (e) =>
							toggle(e.args && e.args.item ? e.args.item.value : $op.val())
						);
						toggle($op.val());
						return { op: $op, inp: $inp };
					}

					const row1 = makeRow($wrap);
					const $join = $('<div style="margin:6px 0"></div>')
						.appendTo($wrap)
						.jqxDropDownList({
							source: ["And", "Or"],
							selectedIndex: 0,
							width: "100%",
							height: 26,
						});
					const row2 = makeRow($wrap);

					const $bar = $('<div class="btnbar"></div>').appendTo($wrap);
					const $btnFilter = $("<button>Filter</button>")
						.appendTo($bar)
						.jqxButton();
					const $btnClear = $("<button>Clear</button>")
						.appendTo($bar)
						.jqxButton();

					function resizeListArea() {
						const $dropdown = $(panel).closest(
							".jqx-menu-dropdown, .jqx-menu-content, .jqx-menu"
						);
						const wrapMax = $dropdown.innerHeight();

						let othersH = 0;
						$wrap.children().each(function () {
							if (this !== $lbHolder[0]) othersH += $(this).outerHeight(true);
						});

						const h = Math.max(120, wrapMax - othersH - 6);
						$lbHolder.height(h);
						$list.jqxListBox({ height: h });
					}

					// apply filter
					$btnFilter.on("click", function () {
						const fg = new $.jqx.filter();
						const OR = 1,
							AND = 0;

						const items = $list.jqxListBox("getCheckedItems") || [];
						for (let i = 0; i < items.length; i++) {
							fg.addfilter(
								OR,
								fg.createfilter("stringfilter", items[i].label, "equal")
							);
						}

						const op1 = row1.op.val();
						if (op1 === "null" || op1 === "not_null") {
							fg.addfilter(AND, fg.createfilter("stringfilter", "", op1));
						} else {
							const v1 = row1.inp.val().trim();
							if (v1)
								fg.addfilter(AND, fg.createfilter("stringfilter", v1, op1));
						}

						const join = $join.val() === "And" ? AND : OR;
						const op2 = row2.op.val();
						if (op2 === "null" || op2 === "not_null") {
							fg.addfilter(join, fg.createfilter("stringfilter", "", op2));
						} else {
							const v2 = row2.inp.val().trim();
							if (v2)
								fg.addfilter(join, fg.createfilter("stringfilter", v2, op2));
						}

						if (fg.getfilterscount() === 0) {
							$(GRID).jqxGrid("removefilter", datafield, true);
							return;
						}
						$(GRID).jqxGrid("addfilter", datafield, fg);
						$(GRID).jqxGrid("applyfilters");
					});

					// clear filter
					$btnClear.on("click", function () {
						$(GRID).jqxGrid("removefilter", datafield, true);
					});
					const $li = $(panel).closest("li");
					if ($li.length) {
						$li[0].style.removeProperty("height");
						$li[0].style.setProperty("height", "auto", "important");
						$li.css({ overflow: "visible" });
					}
				},
			},

			{
				text: "Interface",
				datafield: "interface",
				width: 800,
				align: "center",
				cellsalign: "center",
				filtertype: "checkedlist",
			},
			{
				text: "POP",
				datafield: "pop_site",
				width: 150,
				align: "center",
				cellsalign: "center",
			},
			{
				text: "RRD Path",
				datafield: "rrd_path",
				width: 400,
				align: "center",
				cellsalign: "center",
			},
			{
				text: "RRD Alias",
				datafield: "rrd_alias",
				width: 350,
				align: "center",
				cellsalign: "center",
			},

			// ====== kolom yang memang enak pakai multi-select (checkedlist)
			{
				text: "RRD Status",
				datafield: "rrd_status",
				width: 125,
				align: "center",
				cellsalign: "center",
				filtertype: "checkedlist",
			},
			{
				text: "Capacity",
				datafield: "Capacity",
				width: 150,
				align: "center",
				cellsalign: "center",
				filtertype: "number",
			},
			{
				text: "Service",
				datafield: "service",
				width: 80,
				align: "center",
				cellsalign: "center",
				filtertype: "checkedlist",
			},

			{
				text: "Directory",
				editable: false,
				width: 100,
				align: "center",
				cellsrenderer: function (row, column, value) {
					const rowData = $("#jqxgrid").jqxGrid("getrowdata", row);
					return `<button class="btn-directory" data-id="${rowData.id}" style="display:block; margin:0 auto;">📂</button>`;
				},
				filterable: false,
			},

			{
				text: "Zero Traffic",
				datafield: "zero_traffic",
				width: 120,
				align: "center",
				cellsalign: "center",
				filtertype: "checkedlist",
				editable: false,
			},
			{ datafield: "_search", hidden: true, filterable: true },
			{ datafield: "mrtg_status", hidden: true, filterable: true },
		],
		columnmenuopening: function (menu /* <ul> */) {
			const $ul = $(menu);
			const $menuBox = $ul.closest(".jqx-menu");

			requestAnimationFrame(() => {
				const top = $menuBox.offset()?.top || 0;
				const avail = Math.max(260, window.innerHeight - top - 12);

				$ul.css({
					maxHeight: avail + "px",
					overflowY: "auto",
					overflowX: "hidden",
				});

				$ul.children("li").css({ height: "auto", overflow: "visible" });
			});
		},
	});

	let colMenuOpen = false;

	$("#jqxgrid").on("columnmenuopened", function (e) {
		colMenuOpen = true;

		const $ul = $(e.args.menu);
		const $menuBox = $ul.closest(".jqx-menu");

		try {
			$ul.jqxMenu({ autoCloseOnClick: false, autoCloseOnMouseLeave: false });
		} catch {}

		const top = $menuBox.offset()?.top || 0;
		const avail = Math.max(260, window.innerHeight - top - 12);
		$ul.css({
			maxHeight: avail + "px",
			overflowY: "auto",
			overflowX: "hidden",
		});
		$ul.children("li").css({ height: "auto", overflow: "visible" });
	});

	$("#jqxgrid").on("columnmenuclosed", function () {
		colMenuOpen = false;
	});

	$(document).on(
		"mousedown.jqxcolmenu click.jqxcolmenu wheel.jqxcolmenu",
		function (ev) {
			if (!colMenuOpen) return;
			if (
				$(ev.target).closest(".jqx-popup, .jqx-listbox, .jqx-dropdownlist")
					.length
			) {
				ev.stopPropagation();
			}
		}
	);

	// Global Search: filter
	let globalSearchTimer;
	$("#globalSearch").on("input", function () {
		clearTimeout(globalSearchTimer);
		const q = this.value.trim().toLowerCase();

		globalSearchTimer = setTimeout(function () {
			$("#jqxgrid").jqxGrid("removefilter", "_search", false);

			if (q) {
				const fg = new $.jqx.filter();
				const f = fg.createfilter("stringfilter", q, "contains");
				fg.addfilter(1, f);
				$("#jqxgrid").jqxGrid("addfilter", "_search", fg, false);
			}

			$("#jqxgrid").jqxGrid("applyfilters");

			setTimeout(function () {
				const rows = $("#jqxgrid").jqxGrid("getdisplayrows");
				if (rows && rows.length) {
					const idx = $("#jqxgrid").jqxGrid(
						"getrowboundindexbyid",
						rows[0].uid
					);
					$("#jqxgrid").jqxGrid("ensurerowvisible", idx);
				}
			}, 50);
		}, 250);
	});

	function hasPath(v) {
		const p = (v == null ? "" : String(v)).trim().toLowerCase();
		return p && p !== "null" && p !== "undefined" && p !== "-";
	}
	function isRRDAktif(v) {
		const s = String(v || "").toLowerCase();
		return s.includes("avail") && !s.includes("unavail");
	}
	function isRRDNonAktif(v) {
		return String(v || "")
			.toLowerCase()
			.includes("unavail");
	}
	function isMRTGOn(row) {
		return (
			String(row.rrd_status || "").toLowerCase() === "avail" &&
			hasPath(row.rrd_path)
		);
	}

	function updateKPI() {
		const rows = $("#jqxgrid").jqxGrid("getboundrows") || [];

		const rrdAktif = rows.filter((r) => isRRDAktif(r.rrd_status)).length;
		const rrdNon = rows.filter((r) => isRRDNonAktif(r.rrd_status)).length;
		const mrtgOn = rows.filter(isMRTGOn).length;
		const mrtgOff = rows.length - mrtgOn;

		$("#kpi-rrd-aktif").text(rrdAktif);
		$("#kpi-rrd-nonaktif").text(rrdNon);
		$("#kpi-mrtg-on").text(mrtgOn);
		$("#kpi-mrtg-off").text(mrtgOff);
	}

	$("#jqxgrid").on("bindingcomplete", updateKPI);
	$("#jqxgrid").on("filter sort pagechanged pagesizechanged", updateKPI);

	let mrtgFilterState = null; // null | 'on' | 'off'

	function applyMRTGFilter(mode) {
		$("#jqxgrid").jqxGrid("removefilter", "mrtg_status", false);

		if (mode) {
			const fg = new $.jqx.filter();
			fg.addfilter(1, fg.createfilter("stringfilter", mode, "equal"));
			$("#jqxgrid").jqxGrid("addfilter", "mrtg_status", fg, false);
		}
		$("#jqxgrid").jqxGrid("applyfilters");

		$("#card-mrtg-on, #card-mrtg-off").removeClass("active");
		if (mode === "on") $("#card-mrtg-on").addClass("active");
		if (mode === "off") $("#card-mrtg-off").addClass("active");
		mrtgFilterState = mode;
	}

	$("#card-mrtg-on").on("click", () =>
		applyMRTGFilter(mrtgFilterState === "on" ? null : "on")
	);
	$("#card-mrtg-off").on("click", () =>
		applyMRTGFilter(mrtgFilterState === "off" ? null : "off")
	);
	let rrdFilterState = null; // null | 'aktif' | 'nonaktif'

	function applyRRDFilter(mode) {
		$("#jqxgrid").jqxGrid("removefilter", "rrd_status", false);

		if (mode) {
			const fg = new $.jqx.filter();
			const v = mode === "aktif" ? "avail" : "unavail";
			fg.addfilter(1, fg.createfilter("stringfilter", v, "equal")); // cocok untuk checkedlist
			$("#jqxgrid").jqxGrid("addfilter", "rrd_status", fg, false);
		}
		$("#jqxgrid").jqxGrid("applyfilters");

		$("#card-rrd-aktif, #card-rrd-nonaktif").removeClass("active");
		if (mode === "aktif") $("#card-rrd-aktif").addClass("active");
		if (mode === "nonaktif") $("#card-rrd-nonaktif").addClass("active");
		rrdFilterState = mode;
	}

	// binding klik (toggle)
	$("#card-rrd-aktif").on("click", () =>
		applyRRDFilter(rrdFilterState === "aktif" ? null : "aktif")
	);
	$("#card-rrd-nonaktif").on("click", () =>
		applyRRDFilter(rrdFilterState === "nonaktif" ? null : "nonaktif")
	);

	// Handler Tambah Row
	function handleAddRow() {
		const rows = $("#jqxgrid").jqxGrid("getrows");
		const hasEmpty = rows.some(
			(r) => !r.peering && !r.location && !r.interface && !r.pop_site
		);
		if (hasEmpty) {
			return;
		}

		const newrow = {
			id: "",
			peering: "",
			location: "",
			interface: "",
			pop_site: "",
			rrd_path: "",
			rrd_alias: "",
			rrd_status: "",
			Capacity: "",
			service: "",
		};

		$("#jqxgrid").jqxGrid("addrow", null, newrow, "first");
		$("#jqxgrid").jqxGrid("begincelledit", 0, "peering");
	}
	function refreshGrid(keepFilters = true) {
		if (!keepFilters) {
			$("#globalSearch").val("");
			$("#jqxgrid").jqxGrid("clearfilters");
			$("#card-rrd-aktif, #card-rrd-nonaktif").removeClass("active");
			rrdFilterState = null;
		}

		const $btn = $("#btnRefresh");
		const prevHTML = $btn.html();
		$btn
			.prop("disabled", true)
			.html('<i class="bi bi-arrow-repeat"></i> Refreshing…');

		$("#jqxgrid").one("bindingcomplete", function () {
			$btn.prop("disabled", false).html(prevHTML);
		});

		$("#jqxgrid").jqxGrid("updatebounddata");
	}

	$("#btnRefresh").on("click", function () {
		refreshGrid(true);
	});

	$("#btnRefresh").on("click", function (e) {
		if (e.altKey) refreshGrid(false);
	});

	function handleDeleteRows() {
		const selectedIndexes = $("#jqxgrid").jqxGrid("getselectedrowindexes");
		if (!selectedIndexes.length) {
			showNotif({
				icon: "warning",
				title: "Pilih data yang mau dihapus (centang di kiri)!",
				position: "center",
				showConfirmButton: true,
				confirmButtonText: "Tutup",
				timer: null,
			});
			return;
		}
		const idsToDelete = selectedIndexes
			.map((idx) => $("#jqxgrid").jqxGrid("getrowdata", idx)?.id)
			.filter((id) => !!id);

		if (!idsToDelete.length) {
			showNotif({
				icon: "warning",
				title: "Tidak ada data valid untuk dihapus!",
				position: "center",
				showConfirmButton: true,
				confirmButtonText: "Tutup",
				timer: null,
			});
			return;
		}

		Swal.fire({
			title: "Yakin hapus?",
			text: `Yakin hapus ${idsToDelete.length} data ini?`,
			icon: "question",
			showCancelButton: true,
			confirmButtonText: "Ya, hapus!",
			cancelButtonText: "Batal",
			position: "center",
		}).then((result) => {
			if (result.isConfirmed) {
				let successCount = 0,
					failCount = 0,
					doneCount = 0;

				Swal.fire({
					title: "Menghapus...",
					text: "Sedang menghapus data, mohon tunggu.",
					allowOutsideClick: false,
					allowEscapeKey: false,
					didOpen: () => {
						Swal.showLoading();
					},
				});

				idsToDelete.forEach((id, idx) => {
					$.ajax({
						url: base_url + "api/services_delete/" + id,
						type: "DELETE",
						dataType: "json",
						success: (response) => {
							if (response.success) successCount++;
							else failCount++;
							doneCount++;
							if (doneCount === idsToDelete.length) {
								Swal.close(); // Tutup loading!
								$("#jqxgrid").jqxGrid("updatebounddata");
								showNotif({
									icon: "success",
									title: "Hapus Data",
									text: `${successCount} data berhasil dihapus, ${failCount} gagal.`,
									position: "center",
									toast: true,
									timer: 2200,
								});
							}
						},
						error: () => {
							failCount++;
							doneCount++;
							if (doneCount === idsToDelete.length) {
								Swal.close(); // Tutup loading!
								$("#jqxgrid").jqxGrid("updatebounddata");
								showNotif({
									icon: "error",
									title: "Error",
									text: `${successCount} data berhasil dihapus, ${failCount} gagal.`,
									position: "top-end",
									toast: true,
									timer: 2200,
								});
							}
						},
					});
				});
			}
		});
	}

	// directory map handler by product ID
	$(document).on("click", ".btn-directory", function (e) {
		e.preventDefault();
		e.stopPropagation();
		const id = $(this).data("id");
		showDirectoryPopup(id);
	});
	$("#btnAdd").on("click", function () {
		handleAddRow();
	});

	$("#btnDelete").on("click", function () {
		handleDeleteRows();
	});

	$("#jqxgrid").on("pagesizechanged", function (event) {
		const args = event.args;
		const newPageSize = args.pagesize;
		const totalRows = $("#jqxgrid").jqxGrid("getdatainformation").rowscount;
		if (newPageSize === "All" || newPageSize === 0 || newPageSize === "0") {
			$("#jqxgrid").jqxGrid({ pagesize: totalRows });
		}
	});

	$("#jqxgrid").on("cellendedit", function (event) {
		const { datafield, rowindex, value, oldvalue } = event.args;
		const rowdata = $("#jqxgrid").jqxGrid("getrowdata", rowindex);

		rowdata[datafield] = value;
		if (value === oldvalue) {
			return;
		}

		// add data baru
		if (!rowdata.id || rowdata.id === "") {
			const requiredFields = [
				{ key: "peering", label: "Peering" },
				{ key: "location", label: "Location" },
				{ key: "interface", label: "Interface" },
				{ key: "pop_site", label: "POP" },
			];
			const emptyFields = requiredFields.filter((f) => !rowdata[f.key]);
			if (emptyFields.length > 0) {
				setTimeout(() => {
					$("#jqxgrid").jqxGrid("begincelledit", rowindex, emptyFields[0].key);
				}, 10);
				const fieldsText = emptyFields.map((f) => f.label).join(", ");
				showNotif({
					icon: "error",
					title: "Gagal tambah data",
					text: "Field berikut wajib diisi: " + fieldsText,
					position: "center",
					showConfirmButton: true,
					confirmButtonText: "Tutup",
					timer: null,
				});
				return;
			}
			$.ajax({
				url: base_url + "api/services_add", // API endpoint to add new product
				type: "POST",
				data: rowdata,
				dataType: "json",
				success: function (response) {
					if (response.success) {
						showNotif({
							icon: "success",
							title: "Data berhasil ditambah!",
							text: "Data baru dapat dilihat di bagian bawah tabel.",
							position: "center",
							toast: true,
							timer: 2000,
						});
						$("#jqxgrid").jqxGrid("updatebounddata");
					} else {
						showNotif({
							icon: "error",
							title: "Gagal tambah data",
							text: response.message || "Unknown error",
							position: "center",
							showConfirmButton: true,
							confirmButtonText: "Tutup",
							timer: null,
						});
					}
				},
				error: function (xhr, status, error) {
					showNotif({
						icon: "error",
						title: "Terjadi error!",
						html: `<div style="text-align:left"><b>${error}</b><hr><pre style="max-width:300px;white-space:pre-wrap;">${xhr.responseText}</pre></div>`,
						position: "center",
						showConfirmButton: true,
						confirmButtonText: "Tutup",
						timer: null,
					});
				},
			});
			return;
		}

		//  update data
		if (rowdata.id) {
			$.ajax({
				url: base_url + "api/services_update/" + rowdata.id,
				type: "PUT",
				data: JSON.stringify(rowdata),
				dataType: "json",
				success: function (response) {
					if (response.success) {
						showNotif({
							icon: "success",
							title: "Berhasil!",
							text: "Data berhasil diupdate!",
							toast: true,
							timer: 3000,
							position: "center",
						});
					} else {
						showNotif({
							icon: "error",
							title: "Gagal update data!",
							text: response.message || "Unknown error",
						});
					}
				},
				error: function (xhr, status, error) {
					showNotif({
						icon: "error",
						title: "Terjadi error update!",
						html: `<div style="text-align:left">
                        <b>${error}</b>
                        <hr>
                        <pre style="max-width:300px;white-space:pre-wrap;">${xhr.responseText}</pre>
                       </div>`,
					});
				},
			});
		}
	});
	window.showDirectoryPopup = function (id) {
		$.ajax({
			url: base_url + "api/services_directory/" + id,
			type: "GET",
			dataType: "json",
			success: function (response) {
				if (response.success && response.rrd_path) {
					showNotif({
						icon: "info",
						title: "Path Directory",
						html: `
                        <ul style="text-align:center; list-style:none; padding-left:0;">
                            <li><strong>RRD Path:</strong><br/><code>${response.rrd_path}</code></li>
                        </ul>
                    `,
						width: 400,
						position: "center",
						showConfirmButton: true,
						confirmButtonText: "Tutup",
						timer: null,
					});
				} else {
					showNotif({
						icon: "warning",
						title: "Tidak ada directory/aksi untuk produk ini.",
						position: "center",
						width: 350,
						showConfirmButton: true,
						confirmButtonText: "Tutup",
						timer: null,
					});
				}
			},
			error: function () {
				showNotif({
					icon: "error",
					title: "Gagal ambil directory dari server.",
					position: "center",
					width: 350,
					showConfirmButton: true,
					confirmButtonText: "Tutup",
					timer: null,
				});
			},
		});
	};
});
