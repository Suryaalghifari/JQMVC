(function (IM, $) {
	IM.ColMenu = (function () {
		let colMenuOpen = false;
		let blockColMenuClose = false;
		let lastMenuField = null;
		let $curMenu = null;

		const DEBUG = true;
		const log = (...a) => DEBUG && console.log("[ColMenu]", ...a);

		function armBlock(ms = 500, tag = "") {
			blockColMenuClose = true;
			log("BLOCK ON", tag);
			setTimeout(() => {
				blockColMenuClose = false;
				log("BLOCK OFF", tag);
			}, ms);
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

		function dropdownPopupVisible() {
			return (
				$(
					".jqx-listbox:visible, .jqx-listbox-container:visible, .jqx-popup:visible"
				).length > 0
			);
		}

		function isInsideAllowed(target) {
			return !!(
				target.closest &&
				target.closest(
					".jqx-popup, .jqx-menu, .jqx-menu-wrapper, .jqx-menu-ul, " +
						".jqx-dropdownlist, .jqx-listbox, .jqx-listbox-container, .cm-filter-wrap"
				)
			);
		}

		(function attachCaptureSwallow() {
			const swallow = (ev) => {
				if (!colMenuOpen) return;
				if (isInsideAllowed(ev.target)) {
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

		function wireDropdownGuards($ul) {
			$ul
				.find(".jqx-dropdownlist")
				.off(".colmenu")
				.on(
					"open.colmenu pointerdown.colmenu mousedown.colmenu focusin.colmenu",
					() => armBlock(550, "dd")
				)
				.on("select.colmenu close.colmenu", () => armBlock(160, "dd-select"));

			$ul
				.find(".jqx-listbox, .jqx-listbox-container")
				.off(".colmenu")
				.on(
					"pointerdown.colmenu mousedown.colmenu click.colmenu wheel.colmenu",
					() => armBlock(550, "lb")
				);
		}

		function observeMenu($ul) {
			const obs = new MutationObserver(() => wireDropdownGuards($ul));
			obs.observe($ul[0], { childList: true, subtree: true });
			$ul.data("colmenuObs", obs);
		}

		function opening(menuEl, datafield) {
			const $ul = $(menuEl);
			lastMenuField = datafield || lastMenuField;
			log("columnmenuopening for", datafield);

			try {
				$ul.jqxMenu({ autoCloseOnClick: false, autoCloseOnMouseLeave: false });

				$ul
					.closest(".jqx-menu, .jqx-popup")
					.jqxMenu?.({ autoCloseOnClick: false, autoCloseOnMouseLeave: false });
			} catch (e) {
				/* ignore */
			}

			applyColumnMenuMaxHeight($ul);
			wireDropdownGuards($ul);
		}

		function bindGridMenuHandlers() {
			const GRID = IM.cfg.GRID;

			$(document)
				.off(".colmenu-local")
				.on(
					"pointerdown.colmenu-local mousedown.colmenu-local click.colmenu-local keydown.colmenu-local focusin.colmenu-local input.colmenu-local",
					".cm-filter-wrap, .cm-filter-wrap *",
					() => armBlock(550, "local")
				);

			$(document)
				.off(".colmenu-dd")
				.on(
					"pointerdown.colmenu-dd mousedown.colmenu-dd click.colmenu-dd wheel.colmenu-dd",
					".jqx-listbox, .jqx-listbox-container, .jqx-listitem-element, .jqx-popup",
					() => armBlock(550, "dd-global")
				);

			$(GRID)
				.off("columnmenuclosing.im")
				.on("columnmenuclosing.im", function (e) {
					const cancel = blockColMenuClose || dropdownPopupVisible();
					if (cancel) {
						e.args.cancel = true;
						log("columnmenuclosing -> CANCEL");
					} else {
						log("columnmenuclosing -> allow");
					}
				});

			$(GRID)
				.off("columnmenuopened.im")
				.on("columnmenuopened.im", function (e) {
					colMenuOpen = true;
					lastMenuField = e.args.datafield;
					const $ul = $(e.args.menu);
					$curMenu = $ul;
					log("columnmenuopened", lastMenuField);

					try {
						$ul.jqxMenu({
							autoCloseOnClick: false,
							autoCloseOnMouseLeave: false,
						});
					} catch (e) {}
					applyColumnMenuMaxHeight($ul);
					requestAnimationFrame(() => {
						wireDropdownGuards($ul);
						observeMenu($ul);
					});
				});

			$(GRID)
				.off("columnmenuclosed.im")
				.on("columnmenuclosed.im", function () {
					$curMenu?.data("colmenuObs")?.disconnect();
					colMenuOpen = false;
					blockColMenuClose = false;
					$curMenu = null;
					log("columnmenuclosed");
				});
		}

		return { opening, bindGridMenuHandlers };
	})();
})(window.IM, jQuery);
