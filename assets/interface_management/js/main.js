(function (IM, $) {
	$(function () {
		IM.Grid.init();
		IM.Edit && IM.Edit.bindRowDblClick && IM.Edit.bindRowDblClick();
		IM.KPI && IM.KPI.wireCards && IM.KPI.wireCards();
		IM.Actions && IM.Actions.wireButtons && IM.Actions.wireButtons();
		IM.Directory && IM.Directory.wire && IM.Directory.wire();
		IM.Search && IM.Search.init && IM.Search.init();
	});
})(window.IM, jQuery);
