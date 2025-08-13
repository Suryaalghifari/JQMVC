(function (IM, $) {
	IM.Edit = {
		openForSelected() {
			const G = IM.cfg.GRID;
			const sel = $(G).jqxGrid("getselectedrowindexes") || [];
			if (!sel.length)
				return showNotif({
					icon: "info",
					title: "Pilih dulu 1 baris data.",
					size: "xs",
				});
			const row = $(G).jqxGrid("getrowdata", sel[0]);
			if (!row)
				return showNotif({
					icon: "error",
					title: "Baris tidak ditemukan.",
					size: "xs",
				});
			IM.Edit._open(row);
		},

		bindRowDblClick() {
			const G = IM.cfg.GRID;
			$(G)
				.off("rowdoubleclick.IMEdit")
				.on("rowdoubleclick.IMEdit", (e) => {
					const row = $(G).jqxGrid("getrowdata", e.args.rowindex);
					if (row) IM.Edit._open(row);
				});
		},

		async _open(row) {
			const res = await showEditRowForm(row, { size: "sm" });
			if (!res.isConfirmed) return;

			const before = {
				peering: row.peering || "",
				location: row.location || "",
				interface: row.interface || "",
				pop_site: row.pop_site || "",
				Capacity: row.Capacity ?? "",
				service: row.service || "",
				rrd_status: row.rrd_status || "",
				rrd_path: row.rrd_path || "",
				rrd_alias: row.rrd_alias || "",
			};

			const after = res.value;

			const ask = await confirmEdit(before, after, "xs");
			if (!ask.isConfirmed) return;

			const payload = {
				peering: after.peering,
				location: after.location,
				interface: after.interface,
				pop: after.pop_site,
				rrd_path: after.rrd_path,
				rrd_alias: after.rrd_alias,
				rrd_status: after.rrd_status,
				Capacity: after.Capacity,
				service: after.service,
			};

			showLoading("Menyimpan…", "xs");
			try {
				const out = await IM.api.update(row.id, payload);
				Swal.close();
				if (out && out.success) {
					showNotif({
						icon: "success",
						title: "Berhasil",
						text: "Baris diperbarui.",
						toast: true,
						position: "center",
						timer: 1800,
						showConfirmButton: false,
						size: "xs",
					});
					$(IM.cfg.GRID).jqxGrid("updatebounddata");
				} else {
					showNotif({
						icon: "error",
						title: "Gagal menyimpan",
						text: (out && out.message) || "Unknown error",
						size: "xs",
					});
				}
			} catch (err) {
				Swal.close();
				showNotif({
					icon: "error",
					title: "Error",
					text: String(err),
					size: "xs",
				});
			}
		},
	};
})(window.IM, jQuery);
