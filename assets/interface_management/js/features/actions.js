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

			if (IM.Edit && IM.Edit.isBulkEditing && IM.Edit.isBulkEditing()) {
				showNotif({
					icon: "warning",
					title: "Sedang mode edit banyak baris",
					text: "Selesaikan Simpan/Batal terlebih dahulu sebelum menambah data baru.",
					position: "center",
					showConfirmButton: true,
					confirmButtonText: "OK",
					timer: null,
				});
				return;
			}

			const rows = $(G).jqxGrid("getrows");
			const hasEmpty = rows.some(
				(r) => !r.peering && !r.location && !r.interface && !r.pop_site
			);
			if (hasEmpty) return;

			const newrow = {
				id: "",
				_isNew: true,
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
			const sure = await confirmImport(valids.length);
			if (!sure.isConfirmed) return;

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
			$("#btnAdd")
				.off("click.im-actions")
				.on("click.im-actions", IM.Actions.addRow);

			$("#btnDelete")
				.off("click.im-actions")
				.on("click.im-actions", IM.Actions.deleteSelected);

			$("#btnRefresh")
				.off("click.im-actions")
				.on("click.im-actions", (e) =>
					e.altKey ? IM.Actions.refresh(false) : IM.Actions.refresh(true)
				);

			$("#btnExport")
				.off("click.im-actions")
				.on("click.im-actions", IM.Actions.openExportDialog);

			$("#btnImport")
				.off("click.im-actions")
				.on("click.im-actions", IM.Actions.openImport);

			$("#fileImport")
				.off("change.im-actions")
				.on("change.im-actions", function (e) {
					IM.Actions.handleImportFile(e.target.files?.[0]);
					this.value = "";
				});

			$("#btnEdit")
				.off("click.im-actions")
				.on("click.im-actions", IM.Edit.openForSelected);
		},

		wireCellEdit() {
			const G = IM.cfg.GRID;

			$(G).off("cellendedit.im-actions");

			function validateCell(field, value) {
				const required = ["peering", "location", "interface", "pop_site"];
				if (required.includes(field)) {
					if (!String(value ?? "").trim()) return `${field} wajib diisi`;
				}
				if (field === "Capacity") {
					if (value !== "" && value !== null && value !== undefined) {
						const num = Number(String(value).replace(/[^\d.-]/g, ""));
						if (Number.isNaN(num)) return "Capacity harus angka";
					}
				}
				return null;
			}

			$(G).on("cellendedit.im-actions", function (event) {
				const { datafield, rowindex, value, oldvalue } = event.args;
				const rowdata = $(G).jqxGrid("getrowdata", rowindex);

				if (IM.Edit && IM.Edit.isBulkEditing && IM.Edit.isBulkEditing()) return;

				if (value === oldvalue) return;

				const isNumericId =
					rowdata.id != null && /^\d+$/.test(String(rowdata.id));
				const isNew = rowdata._isNew === true || !isNumericId;

				const nextData = { ...rowdata, [datafield]: value };

				if (isNew) {
					const req = [
						{ key: "peering", label: "Peering" },
						{ key: "location", label: "Location" },
						{ key: "interface", label: "Interface" },
						{ key: "pop_site", label: "POP" },
					];
					const miss = req.filter((f) => !String(nextData[f.key] ?? "").trim());
					if (miss.length) {
						setTimeout(
							() => $(G).jqxGrid("begincelledit", rowindex, miss[0].key),
							10
						);
						showNotif({
							icon: "error",
							title: "Gagal tambah data",
							text: "Field wajib: Peering, Location, Interface, POP.",
							position: "center",
							showConfirmButton: true,
							confirmButtonText: "Tutup",
							timer: null,
						});

						$(G).jqxGrid("setcellvalue", rowindex, datafield, oldvalue);
						return;
					}

					const vErr = validateCell(datafield, value);
					if (vErr) {
						showNotif({ icon: "error", title: "Validasi gagal", text: vErr });
						$(G).jqxGrid("setcellvalue", rowindex, datafield, oldvalue);
						return;
					}

					const fieldLabelMap = {
						peering: "Peering",
						location: "Location",
						interface: "Interface",
						pop_site: "POP",
						rrd_path: "RRD Path",
						rrd_alias: "RRD Alias",
						rrd_status: "RRD Status",
						Capacity: "Capacity",
						service: "Service",
					};
					setTimeout(async () => {
						const ask = await window.confirmSingleEdit?.({
							field: fieldLabelMap[datafield] || datafield,
							oldValue: oldvalue,
							newValue: value,
							row: rowdata,
						});
						if (!ask || !ask.isConfirmed) {
							$(G).jqxGrid("setcellvalue", rowindex, datafield, oldvalue);
							return;
						}

						IM.api
							.add({
								peering: nextData.peering,
								location: nextData.location,
								interface: nextData.interface,
								pop_site: nextData.pop_site,
								rrd_path: nextData.rrd_path || null,
								rrd_alias: nextData.rrd_alias || null,
								rrd_status: nextData.rrd_status || null,
								Capacity: nextData.Capacity ?? null,
								service: nextData.service || null,
							})
							.done((r) => {
								if (r && r.success) {
									showNotif({
										icon: "success",
										title: "Data berhasil ditambah!",
										toast: true,
										timer: 1800,
										position: "center",
									});
									$(G).jqxGrid("updatebounddata");
								} else {
									showNotif({
										icon: "error",
										title: "Gagal tambah data",
										text: (r && r.message) || "Unknown error",
									});
									$(G).jqxGrid("setcellvalue", rowindex, datafield, oldvalue);
								}
							})
							.fail((xhr, _s, err) => {
								showNotif({
									icon: "error",
									title: "Terjadi error!",
									html: `<pre>${xhr.responseText || err}</pre>`,
								});
								$(G).jqxGrid("setcellvalue", rowindex, datafield, oldvalue);
							});
					}, 0);

					return;
				}

				const vErr = validateCell(datafield, value);
				if (vErr) {
					showNotif({ icon: "error", title: "Validasi gagal", text: vErr });
					$(G).jqxGrid("setcellvalue", rowindex, datafield, oldvalue);
					return;
				}

				const labelMap = {
					peering: "Peering",
					location: "Location",
					interface: "Interface",
					pop_site: "POP",
					rrd_path: "RRD Path",
					rrd_alias: "RRD Alias",
					rrd_status: "RRD Status",
					Capacity: "Capacity",
					service: "Service",
				};

				setTimeout(async () => {
					const ask = await window.confirmSingleEdit?.({
						field: labelMap[datafield] || datafield,
						oldValue: oldvalue,
						newValue: value,
						row: rowdata,
					});
					if (!ask || !ask.isConfirmed) {
						$(G).jqxGrid("setcellvalue", rowindex, datafield, oldvalue);
						return;
					}

					const payload = { ...rowdata, [datafield]: value };
					if ("pop_site" in payload) {
						payload.pop = payload.pop_site;
						delete payload.pop_site;
					}

					IM.api
						.update(rowdata.id, payload)
						.done((r) => {
							if (r && r.success) {
								showNotif({
									icon: "success",
									title: "Perubahan disimpan",
									toast: true,
									timer: 1600,
									position: "center",
								});
							} else {
								showNotif({
									icon: "error",
									title: "Gagal update data!",
									text: (r && r.message) || "Unknown error",
								});
								$(G).jqxGrid("setcellvalue", rowindex, datafield, oldvalue);
							}
						})
						.fail((xhr, _s, err) => {
							showNotif({
								icon: "error",
								title: "Terjadi error update!",
								html: `<pre>${xhr.responseText || err}</pre>`,
							});
							$(G).jqxGrid("setcellvalue", rowindex, datafield, oldvalue);
						});
				}, 0);
			});
		},
	};
})(window.IM, jQuery);
