(function (IM, $) {
	IM.Import = IM.Import || {
		headerMap: {
			id: ["ID", "Id", "id"],
			peering: ["Peering", "peering"],
			location: ["Location", "location"],
			interface: ["Interface", "interface"],
			pop_site: ["POP", "pop_site", "POP Site", "Pop"],
			rrd_path: ["RRD Path", "rrd_path"],
			rrd_alias: ["RRD Alias", "rrd_alias"],
			rrd_status: ["RRD Status", "rrd_status"],
			Capacity: ["Capacity", "capacity"],
			service: ["Service", "service"],
		},
	};

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
			const selected = $(G).jqxGrid("getselectedrowindexes") || [];
			if (!selected.length) {
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

			const ids = selected
				.map((i) => $(G).jqxGrid("getrowdata", i)?.id)
				.filter(Boolean);
			if (!ids.length) {
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

			confirmPermanentDelete(ids.length).then((res) => {
				if (!res.isConfirmed) return;

				let ok = 0,
					fail = 0,
					done = 0;
				showLoading("Menghapus data…");

				ids.forEach((id) => {
					IM.api
						.remove(id)
						.done((r) => (r.success ? ok++ : fail++))
						.fail(() => fail++)
						.always(() => {
							done++;
							if (done === ids.length) {
								Swal.close();
								$(G).jqxGrid("updatebounddata");
								showNotif({
									icon: "success",
									title: "Hapus Data",
									text: `${ok} data berhasil dihapus, ${fail} gagal.`,
									toast: true,
									timer: 2200,
									position: "center",
								});
							}
						});
				});
			});
		},

		openImport() {
			const $f = $("#fileImport");
			if (!$f.length) {
				showNotif({
					icon: "error",
					title: "Input file tidak ditemukan",
					text: "#fileImport belum ada di view.",
				});
				return;
			}
			$f.trigger("click");
		},

		async handleImportFile(file) {
			if (!file) return;
			if (typeof XLSX === "undefined") {
				showNotif({
					icon: "error",
					title: "Import gagal",
					text: "Library XLSX belum ter-load.",
				});
				return;
			}

			showLoading("Membaca file…");
			const buf = await file.arrayBuffer();
			const wb = XLSX.read(buf, { type: "array" });
			const ws = wb.Sheets[wb.SheetNames[0]];
			const raw = XLSX.utils.sheet_to_json(ws, { defval: "" });

			const map = IM.Import.headerMap;
			const rowsMapped = raw.map((r) => {
				const o = {};
				Object.keys(map).forEach((field) => {
					const alias = map[field].find((h) =>
						Object.prototype.hasOwnProperty.call(r, h)
					);
					o[field] = alias ? r[alias] : "";
				});
				return o;
			});

			const valids = [],
				errors = [];
			rowsMapped.forEach((r, idx) => {
				const err = [];
				if (!String(r.peering).trim()) err.push("peering wajib");
				if (!String(r.location).trim()) err.push("location wajib");
				if (!String(r.interface).trim()) err.push("interface wajib");
				if (!String(r.pop_site).trim()) err.push("pop wajib");

				if (r.Capacity !== "" && r.Capacity != null) {
					const rawCap = String(r.Capacity).replace(/[^\d.-]/g, "");
					if (rawCap !== "" && isNaN(Number(rawCap)))
						err.push("Capacity tidak valid");
					else r.Capacity = rawCap === "" ? "" : Number(rawCap);
				}

				if (err.length) errors.push({ row: idx + 2, errors: err });
				else valids.push(r);
			});

			Swal.close();

			const go = await showImportPreview(valids, errors, { compact: true });
			if (!go.isConfirmed || !valids.length) return;

			const payloadRows = valids.map((r) => ({
				id: r.id || null,
				peering: r.peering,
				location: r.location,
				interface: r.interface,
				pop: r.pop_site,
				rrd_path: r.rrd_path || null,
				rrd_alias: r.rrd_alias || null,
				rrd_status: r.rrd_status || null,
				Capacity: r.Capacity ?? null,
				service: r.service || null,
			}));

			showImportWorking(payloadRows.length);

			const CHUNK = 500;
			let inserted = 0,
				updated = 0,
				skipped = 0,
				done = 0;

			for (let i = 0; i < payloadRows.length; i += CHUNK) {
				const part = payloadRows.slice(i, i + CHUNK);
				try {
					const resp = await IM.api.importBulk(part);
					inserted += resp.inserted || 0;
					updated += resp.updated || 0;
					skipped += resp.skipped || 0;
					done += part.length;
					updateImportProgress(done, payloadRows.length);
				} catch (e) {
					console.error(e);
				}
			}

			Swal.close();
			showImportDoneToast({ inserted, updated, skipped });
			IM.Actions.refresh(false);
		},

		// export file
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
				confirmExport(count, res.value.type).then((c) => {
					if (!c.isConfirmed) return;
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
			$("#btnRefresh").on("click", (e) =>
				e.altKey ? IM.Actions.refresh(false) : IM.Actions.refresh(true)
			);
			$("#btnExport").off("click").on("click", IM.Actions.openExportDialog);
			$("#btnImport").off("click").on("click", IM.Actions.openImport);
			$("#fileImport")
				.off("change")
				.on("change", function (e) {
					IM.Actions.handleImportFile(e.target.files?.[0]);
					this.value = "";
				});
		},

		wireCellEdit() {
			const G = IM.cfg.GRID;
			$(G).on("cellendedit", function (event) {
				const { datafield, rowindex, value, oldvalue } = event.args;
				const rowdata = $(G).jqxGrid("getrowdata", rowindex);
				rowdata[datafield] = value;
				if (value === oldvalue) return;

				if (!rowdata.id || rowdata.id === "") {
					const req = [
						{ key: "peering", label: "Peering" },
						{ key: "location", label: "Location" },
						{ key: "interface", label: "Interface" },
						{ key: "pop_site", label: "POP" },
					];
					const empty = req.filter((f) => !rowdata[f.key]);
					if (empty.length) {
						setTimeout(
							() => $(G).jqxGrid("begincelledit", rowindex, empty[0].key),
							10
						);
						const fieldsText = empty.map((f) => f.label).join(", ");
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
						.done((r) => {
							if (r.success) {
								showNotif({
									icon: "success",
									title: "Data berhasil ditambah!",
									toast: true,
									timer: 2000,
									position: "center",
								});
								$(G).jqxGrid("updatebounddata");
							} else {
								showNotif({
									icon: "error",
									title: "Gagal tambah data",
									text: r.message || "Unknown error",
								});
							}
						})
						.fail((xhr, _s, err) => {
							showNotif({
								icon: "error",
								title: "Terjadi error!",
								html: `<div style="text-align:left"><b>${err}</b><hr><pre style="max-width:300px;white-space:pre-wrap;">${xhr.responseText}</pre></div>`,
								position: "center",
								showConfirmButton: true,
								confirmButtonText: "Tutup",
								timer: null,
							});
						});
					return;
				}

				IM.api
					.update(rowdata.id, rowdata)
					.done((r) => {
						if (r.success) {
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
								text: r.message || "Unknown error",
							});
						}
					})
					.fail((xhr, _s, err) => {
						showNotif({
							icon: "error",
							title: "Terjadi error update!",
							html: `<div style="text-align:left"><b>${err}</b><hr><pre style="max-width:300px;white-space:pre-wrap;">${xhr.responseText}</pre></div>`,
						});
					});
			});
		},
	};
})(window.IM, jQuery);
