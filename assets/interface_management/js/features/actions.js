(function (IM, $) {
	IM.Actions = {
		addRow() {
			const G = IM.cfg.GRID;
			const rows = $(G).jqxGrid("getrows");
			const hasEmpty = rows.some(
				(r) => !r.peering && !r.location && !r.interface && !r.pop_site
			);
			if (hasEmpty) return;

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
			$(G).jqxGrid("addrow", null, newrow, "first");
			$(G).jqxGrid("begincelledit", 0, "peering");
		},

		refresh(keepFilters = true) {
			const G = IM.cfg.GRID;
			if (!keepFilters) {
				$(IM.cfg.searchBox).val("");
				$(G).jqxGrid("clearfilters");
				$("#card-rrd-aktif, #card-rrd-nonaktif").removeClass("active");
				IM.KPI._rrdFilterState = null;
			}

			const $btn = $("#btnRefresh");
			const prevHTML = $btn.html();
			$btn
				.prop("disabled", true)
				.html('<i class="bi bi-arrow-repeat"></i> Refreshing…');

			$(G).one("bindingcomplete", function () {
				$btn.prop("disabled", false).html(prevHTML);
			});
			$(G).jqxGrid("updatebounddata");
		},

		deleteSelected() {
			const G = IM.cfg.GRID;
			const selectedIndexes = $(G).jqxGrid("getselectedrowindexes") || [];
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
				.map((idx) => $(G).jqxGrid("getrowdata", idx)?.id)
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

			confirmPermanentDelete(idsToDelete.length).then((result) => {
				if (!result.isConfirmed) return;

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

				idsToDelete.forEach((id) => {
					IM.api
						.remove(id)
						.done((response) => {
							response.success ? successCount++ : failCount++;
						})
						.fail(() => {
							failCount++;
						})
						.always(() => {
							doneCount++;
							if (doneCount === idsToDelete.length) {
								Swal.close();
								$(G).jqxGrid("updatebounddata");
								showNotif({
									icon: "success",
									title: "Hapus Data",
									text: `${successCount} data berhasil dihapus, ${failCount} gagal.`,
									position: "center",
									toast: true,
									timer: 2200,
								});
							}
						});
				});
			});
		},

		openExportDialog() {
			const G = IM.cfg.GRID;
			const rowsDisplay = $(G).jqxGrid("getdisplayrows") || [];
			const count = rowsDisplay.length;
			if (!count) {
				showNotif({ icon: "warning", title: "Tidak ada data untuk diekspor." });
				return;
			}

			chooseExportFormat(count).then((res) => {
				if (!res.isConfirmed) return;
				confirmExport(count, res.value.type).then((r) => {
					if (!r.isConfirmed) return;
					IM.Actions._doExport(res.value.type);
				});
			});
		},

		_doExport(type) {
			const G = IM.cfg.GRID;
			const fileBase =
				"interface_management_" + new Date().toISOString().slice(0, 10);
			if (typeof XLSX === "undefined") {
				showNotif({
					icon: "error",
					title: "Export gagal",
					text: "Library XLSX belum ter-load.",
				});
				return;
			}

			const src = $(G).jqxGrid("getdisplayrows") || [];
			if (!src.length) {
				showNotif({ icon: "warning", title: "Tidak ada data untuk diekspor." });
				return;
			}

			const cols = IM.utils.getExportColumns();
			const headers = cols.map((c) => c.label);
			const rows = IM.utils.pickForExport(src, cols);

			showLoading();

			const ws = XLSX.utils.json_to_sheet(rows, {
				header: headers,
				skipHeader: false,
			});
			const capIdx = cols.findIndex(
				(c) => String(c.field).toLowerCase() === "capacity"
			);
			const capHeader = capIdx >= 0 ? headers[capIdx] : null;

			if (type === "xlsx") {
				if (capIdx >= 0 && ws["!ref"]) {
					const range = XLSX.utils.decode_range(ws["!ref"]);
					for (let R = 1; R <= range.e.r; R++) {
						const addr = XLSX.utils.encode_cell({ r: R, c: capIdx });
						const cell = ws[addr];
						if (!cell) continue;
						let v = cell.v;
						if (typeof v === "string") v = v.replace(/[^\d.-]/g, "");
						const num = Number(v);
						if (!isNaN(num)) {
							cell.v = num;
							cell.t = "n";
							cell.z = "#,##0";
						}
					}
				}

				const wb = XLSX.utils.book_new();
				XLSX.utils.book_append_sheet(wb, ws, "Data");
				ws["!cols"] = headers.map((h) => ({
					wch: Math.max(12, String(h).length + 2),
				}));
				XLSX.writeFile(wb, fileBase + ".xlsx");

				setTimeout(() => {
					Swal.close();
					showNotif({
						icon: "success",
						title: "Export XLSX berhasil diunduh.",
					});
				}, 250);
				return;
			}

			if (type === "csv") {
				let csvRows = rows;
				if (capHeader) {
					csvRows = rows.map((r) => {
						const o = { ...r };
						if (o[capHeader] != null && o[capHeader] !== "") {
							const raw = String(o[capHeader]).replace(/[^\d.-]/g, "");
							o[capHeader] = '="' + raw + '"';
						}
						return o;
					});
				}
				const wsCSV = XLSX.utils.json_to_sheet(csvRows, {
					header: headers,
					skipHeader: false,
				});
				const csv = XLSX.utils.sheet_to_csv(wsCSV, { FS: ";" });
				const blob = new Blob(["\uFEFF" + csv], {
					type: "text/csv;charset=utf-8",
				});
				const a = document.createElement("a");
				a.href = URL.createObjectURL(blob);
				a.download = fileBase + ".csv";
				document.body.appendChild(a);
				a.click();
				a.remove();
				URL.revokeObjectURL(a.href);

				setTimeout(() => {
					Swal.close();
					showNotif({ icon: "success", title: "Export CSV berhasil diunduh." });
				}, 250);
				return;
			}

			Swal.close();
			showNotif({ icon: "error", title: "Format tidak didukung." });
		},

		wireButtons() {
			$("#btnAdd").on("click", IM.Actions.addRow);
			$("#btnDelete").on("click", IM.Actions.deleteSelected);
			$("#btnRefresh").on("click", function (e) {
				if (e.altKey) IM.Actions.refresh(false);
				else IM.Actions.refresh(true);
			});
			$("#btnExport").off("click").on("click", IM.Actions.openExportDialog);
		},

		wireCellEdit() {
			const G = IM.cfg.GRID;
			$(G).on("cellendedit", function (event) {
				const { datafield, rowindex, value, oldvalue } = event.args;
				const rowdata = $(G).jqxGrid("getrowdata", rowindex);

				rowdata[datafield] = value;
				if (value === oldvalue) return;

				// ADD
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
							$(G).jqxGrid("begincelledit", rowindex, emptyFields[0].key);
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
					IM.api
						.add(rowdata)
						.done(function (response) {
							if (response.success) {
								showNotif({
									icon: "success",
									title: "Data berhasil ditambah!",
									text: "Data baru dapat dilihat di bagian bawah tabel.",
									position: "center",
									toast: true,
									timer: 2000,
								});
								$(G).jqxGrid("updatebounddata");
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
						})
						.fail(function (xhr, status, error) {
							showNotif({
								icon: "error",
								title: "Terjadi error!",
								html: `<div style="text-align:left"><b>${error}</b><hr><pre style="max-width:300px;white-space:pre-wrap;">${xhr.responseText}</pre></div>`,
								position: "center",
								showConfirmButton: true,
								confirmButtonText: "Tutup",
								timer: null,
							});
						});
					return;
				}

				// UPDATE
				IM.api
					.update(rowdata.id, rowdata)
					.done(function (response) {
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
					})
					.fail(function (xhr, status, error) {
						showNotif({
							icon: "error",
							title: "Terjadi error update!",
							html: `<div style="text-align:left"><b>${error}</b><hr><pre style="max-width:300px;white-space:pre-wrap;">${xhr.responseText}</pre></div>`,
						});
					});
			});
		},
	};
})(window.IM, jQuery);
