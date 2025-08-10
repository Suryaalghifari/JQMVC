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
		],

		url: base_url + "api/services_get", // API endpoint ambil data services
	};
	const dataAdapter = new $.jqx.dataAdapter(source, {
		// DI SINI!
		beforeLoadComplete: function (records) {
			records.forEach(function (row) {
				const isAvail = row.rrd_status === "avail";
				const hasPath =
					row.rrd_path && row.rrd_path !== "null" && row.rrd_path.trim() !== "";
				// Hasilkan string "true"/"false"
				row.zero_traffic = isAvail && hasPath ? "true" : "false";
			});

			console.log(
				"Isi zero_traffic sebelum grid:",
				records.map((r) => r.zero_traffic)
			);
			return records;
		},
	});

	$("#jqxgrid").jqxGrid({
		width: "100%",
		height: "100%",

		theme: "office",
		source: dataAdapter,
		pageable: true,
		pagesizeoptions: ["5", "10", "20", "50", "100", "99999"],
		pagesize: 20,
		sortable: true,
		filterable: true,
		showfiltermenuitems: true,
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

			// ====== kolom dengan menu operator lengkap (contains/starts with/equal + AND/OR)
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
			},
			{
				text: "Interface",
				datafield: "interface",
				width: 800,
				align: "center",
				cellsalign: "center",
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
		],
	});

	// ===== KPI dari TOTAL data (tidak terpengaruh filter) =====
	let allRecords = [];

	function isAktif(v) {
		const s = String(v || "").toLowerCase();
		return s === "avail" || (s.includes("avail") && !s.includes("unavail"));
	}
	function isNonAktif(v) {
		return String(v || "")
			.toLowerCase()
			.includes("unavail");
	}

	function updateRRDKPITotals() {
		const aktif = allRecords.filter((r) => isAktif(r.rrd_status)).length;
		const nonAktif = allRecords.filter((r) => isNonAktif(r.rrd_status)).length;
		$("#kpi-rrd-aktif").text(aktif);
		$("#kpi-rrd-nonaktif").text(nonAktif);
	}

	dataAdapter._options.loadComplete = function (records) {
		allRecords = Array.isArray(records) ? records : [];
		updateRRDKPITotals(); // angka di kartu = total
	};
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
	// helper: refresh data grid (tanpa reload halaman)
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
