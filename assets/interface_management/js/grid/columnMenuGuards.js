(function (IM, $) {
	IM.ColMenu = (function () {
		let colMenuOpen = false;
		let blockColMenuClose = false;
		let lastMenuField = null;

		function dbg() {
			/* optional: console.log('[colmenu]', ...arguments); */
		}

		function applyColumnMenuMaxHeight($ul) {
			const $popup = $ul.closest(".jqx-popup, .jqx-menu-ul");
			requestAnimationFrame(() => {
				const top = $popup.offset()?.top || 0;
				const avail = Math.max(260, window.innerHeight - top - 12);
				$popup.css({
					maxHeight: avail + "px",
					overflowY: "auto",
					overflowX: "hidden",
				});
				$popup
					.find("ul.jqx-menu-ul > li")
					.css({ height: "auto", overflow: "visible" });
			});
		}

		function wireDropdownGuards($ul) {
			const $dds = $ul.find(".jqx-dropdownlist");
			$dds.each(function () {
				const $dd = $(this);
				$dd.off(".colmenu");
				$dd.on("open.colmenu mousedown.colmenu", function () {
					blockColMenuClose = true;
				});
				$dd.on("select.colmenu", function () {
					blockColMenuClose = true;
					setTimeout(() => {
						blockColMenuClose = false;
					}, 80);
				});
				$dd.on("close.colmenu", function () {
					setTimeout(() => {
						blockColMenuClose = false;
					}, 0);
				});
			});
		}

		function observeMenu($ul) {
			const obs = new MutationObserver(() => wireDropdownGuards($ul));
			obs.observe($ul[0], { childList: true, subtree: true });
			$ul.data("colmenuObs", obs);
		}

		function dropdownPopupVisible() {
			return (
				$(".jqx-listbox:visible, .jqx-listbox-container:visible").length > 0
			);
		}

		function opening(menu) {
			const $ul = $(menu);
			applyColumnMenuMaxHeight($ul);
		}

		function bindGridMenuHandlers() {
			const GRID = IM.cfg.GRID;

			// tahan close untuk SEMUA interaksi di panel custom
			$(document)
				.off(".colmenu-local")
				.on(
					"mousedown.colmenu-local click.colmenu-local",
					".cm-filter-wrap, .cm-filter-wrap *",
					function () {
						blockColMenuClose = true;
						setTimeout(() => {
							blockColMenuClose = false;
						}, 180);
					}
				);

			// tahan close untuk semua popup jqx (listbox/dropdown)
			$(document)
				.off(".colmenu-dd-global")
				.on(
					"mousedown.colmenu-dd-global click.colmenu-dd-global wheel.colmenu-dd-global",
					".jqx-listbox, .jqx-listbox-container, .jqx-listitem-element, .jqx-popup",
					function () {
						blockColMenuClose = true;
						setTimeout(() => {
							blockColMenuClose = false;
						}, 180);
					}
				);

			// cegah close ketika masih interaksi di popup
			$(GRID)
				.off("columnmenuclosing.im")
				.on("columnmenuclosing.im", function (e) {
					if (blockColMenuClose || dropdownPopupVisible()) {
						e.args.cancel = true;
					}
				});

			$(GRID)
				.off("columnmenuopened.im")
				.on("columnmenuopened.im", function (e) {
					colMenuOpen = true;
					lastMenuField = e.args.datafield;
					const $ul = $(e.args.menu);

					if (!$ul.data("jqxWidget")) {
						$ul.jqxMenu({
							autoCloseOnClick: false,
							autoCloseOnMouseLeave: false,
						});
					}
					applyColumnMenuMaxHeight($ul);
					requestAnimationFrame(() => {
						wireDropdownGuards($ul);
						observeMenu($ul);
					});
				});

			$(GRID)
				.off("columnmenuclosed.im")
				.on("columnmenuclosed.im", function (e) {
					const $ul = $(e.args?.menu);
					$ul?.data("colmenuObs")?.disconnect();
					colMenuOpen = false;
					blockColMenuClose = false;
				});

			// guard capture-phase (klik di popup jqx tidak dianggap klik luar)
			(function attachCaptureGuards() {
				const isInside = (el) =>
					el.closest &&
					el.closest(
						".jqx-popup, .jqx-menu, .jqx-listbox, .jqx-listbox-container, .jqx-dropdownlist"
					);

				const swallow = (ev) => {
					if (!colMenuOpen) return;
					const inside = isInside(ev.target);
					if (inside) {
						ev.stopPropagation();
						ev.stopImmediatePropagation?.();
					}
				};
				[
					"pointerdown",
					"mousedown",
					"mouseup",
					"click",
					"wheel",
					"touchstart",
					"touchend",
				].forEach((t) => document.addEventListener(t, swallow, true));
			})();
		}

		return { opening, bindGridMenuHandlers };
	})();
})(window.IM, jQuery);
