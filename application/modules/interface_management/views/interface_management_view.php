<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Interface Management</title>

  <!-- Favicon (biarin sesuai punyamu) -->
  <link rel="icon" type="image/png" href="<?= base_url('assets/vendor/css/images/logo.png') ?>">

  <!-- CSS jqx wajib -->
<link rel="stylesheet" href="<?= base_url('assets/vendor/css/jqx.base.css') ?>">
<link rel="stylesheet" href="<?= base_url('assets/vendor/css/jqx.office.css') ?>">
<link rel="stylesheet" href="<?= base_url('assets/interface_management/css/interface_management_custom.css') ?>">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">


<!-- base_url dari PHP -->
<script>var base_url = "<?= base_url() ?>";</script>

<!-- VENDOR JS -->
<script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>

<script src="<?= base_url('assets/vendor/jqwidgets/jqx-all.js') ?>"></script>
<script src="<?= base_url('assets/vendor/jqwidgets/jqxdata.export.js') ?>"></script>
<script src="<?= base_url('assets/vendor/jqwidgets/jqxgrid.export.js') ?>"></script>
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<script src="https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js"></script>


<!-- APP JS (modular) -->
<script src="<?= base_url('assets/interface_management/js/core/namespace.js') ?>"></script>
<script src="<?= base_url('assets/interface_management/js/core/config.js') ?>"></script>
<script src="<?= base_url('assets/interface_management/js/core/utils.js') ?>"></script>
<script src="<?= base_url('assets/interface_management/js/core/api.js') ?>"></script>

<script src="<?= base_url('assets/interface_management/js/grid/datasource.js') ?>"></script>
<script src="<?= base_url('assets/interface_management/js/grid/filters/locationPanel.js') ?>"></script>
<script src="<?= base_url('assets/interface_management/js/grid/columns.js') ?>"></script>
<script src="<?= base_url('assets/interface_management/js/grid/columnMenuGuards.js') ?>"></script>
<script src="<?= base_url('assets/interface_management/js/grid/grid.js') ?>"></script>

<script src="<?= base_url('assets/interface_management/js/features/kpi.js') ?>"></script>
<script src="<?= base_url('assets/interface_management/js/features/edit.js') ?>"></script>
<script src="<?= base_url('assets/interface_management/js/features/actions.js') ?>"></script>
<script src="<?= base_url('assets/interface_management/js/features/search.js') ?>"></script>
<script src="<?= base_url('assets/interface_management/js/features/directory.js') ?>"></script>


<script src="<?= base_url('assets/interface_management/js/notif/swalNotif.js') ?>"></script>
<script src="<?= base_url('assets/interface_management/js/main.js') ?>"></script>



</head>
<body style="background:#f6f8fb">
  <div class="page-wrap">

    <div class="cards">
      <div class="card kpi" id="card-rrd-aktif">
        <div class="kpi-title">RRD Aktif</div>
        <div class="kpi-value text-green" id="kpi-rrd-aktif">0</div>
        <div class="kpi-sub">Status = Available</div>
      </div>
      <div class="card kpi" id="card-rrd-nonaktif">
        <div class="kpi-title">RRD Non Aktif</div>
        <div class="kpi-value text-red" id="kpi-rrd-nonaktif">0</div>
        <div class="kpi-sub">Status = Non Available</div>
      </div>
      <div class="card kpi" id="card-mrtg-on">
        <div class="kpi-title">MRTG On Air</div>
        <div class="kpi-value text-green" id="kpi-mrtg-on">0</div>
        <div class="kpi-sub">Sedang menyala</div>
      </div>
      <div class="card kpi" id="card-mrtg-off">
        <div class="kpi-title">MRTG Off Air</div>
        <div class="kpi-value text-red" id="kpi-mrtg-off">0</div>
        <div class="kpi-sub">Sedang mati</div>
      </div>
      <div class="card kpi" id="card-zt-true">
        <div class="kpi-title">Zero Traffic (True)</div>
        <div class="kpi-value text-green" id="kpi-zt-true">0</div>
        <div class="kpi-sub">zero_traffic = true</div>
      </div>

      <div class="card kpi" id="card-zt-false">
        <div class="kpi-title">Zero Traffic (False)</div>
        <div class="kpi-value text-red" id="kpi-zt-false">0</div>
        <div class="kpi-sub">zero_traffic = false</div>
      </div>
    </div>

    <div class="grid-card">
      <div class="grid-header">
        <div>
          <h3>Interface Management</h3>
          <span class="muted">Data informasi</span>
        </div>
        <div class="grid-tools">
          <div class="search">
            <i class="bi bi-search"></i>
            <input id="globalSearch" type="text" placeholder="Cari data..." />
          </div>
          <button id="btnAdd" class="btn-primary"><i class="bi bi-plus-lg"></i> Tambah Data</button>
          <button id="btnDelete" class="btn-danger"><i class="bi bi-trash"></i> Hapus Data</button>
          <button id="btnRefresh" class="btn-secondary"><i class="bi bi-arrow-clockwise"></i> Refresh</button>
          <button id="btnExport" class="btn-excel"><i class="bi bi-file-earmark-spreadsheet"></i> Export</button>
          <button id="btnImport" class="btn-secondary"><i class="bi bi-upload"></i> Import</button>
          <input id="fileImport" type="file" accept=".xlsx,.csv" style="display:none">
          <button id="btnEdit" class="btn-secondary"><i class="bi bi-pencil-square"></i> Edit</button>
        </div>
      </div>

      <div id="jqxgrid"></div>
    </div>

  </div>
</body>
</html>
