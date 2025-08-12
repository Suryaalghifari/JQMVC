<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * @property Output $output
 * @property CI_Input $input
 * @property Interface_management_model $Interface_management_model
 */
class Interface_management_api extends MX_Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->load->model('Interface_management_model'); 
    }

    // GET: Ambil semua data
    public function services_get()
    {
        $data = $this->Interface_management_model->get_all();

        foreach ($data as &$row) {
            $row['pop_site'] = isset($row['pop']) ? $row['pop'] : null;
            unset($row['pop']);
        }
        unset($row);

        $this->output
            ->set_content_type('application/json')
            ->set_output(json_encode($data));
    }

    // POST: Tambah data baru
    public function services_add()
    {
        $data = $this->input->post();

        // Jika pakai pop_site
        if (isset($data['pop_site'])) {
            $data['pop'] = $data['pop_site'];
            unset($data['pop_site']);
        }

        // Validasi WAJIB isi
        $wajib = ['peering', 'location', 'interface', 'pop'];
        $errors = [];
        foreach ($wajib as $field) {
            if (empty($data[$field])) {
                $errors[] = ucfirst($field) . ' wajib diisi';
            }
        }

        if (!empty($errors)) {
            echo json_encode([
                'success' => false,
                'message' => implode(', ', $errors)
            ]);
            return;
        }

        $id = $this->Interface_management_model->insert($data);
        if ($id) {
            echo json_encode(['success' => true, 'id' => $id]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Gagal insert data']);
        }
    }


    // PUT: Update data by ID
    public function services_update($id = null)
    {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$id) {
            echo json_encode(['success' => false, 'message' => 'ID wajib ada']);
            return;
        }

        if (!$data || !is_array($data)) {
            echo json_encode(['success' => false, 'message' => 'Data kosong, tidak ada yang diupdate']);
            return;
        }

        if (isset($data['pop_site'])) {
            $data['pop'] = $data['pop_site'];
            unset($data['pop_site']);
        }

        $updated = $this->Interface_management_model->update($id, $data);
        if ($updated) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Gagal update data']);
        }
    }

    // DELETE: Hapus data by ID
    public function services_delete($id = null)
    {
        if (!$id) {
            echo json_encode(['success' => false, 'message' => 'ID wajib ada']);
            return;
        }
        $deleted = $this->Interface_management_model->delete($id);
        if ($deleted) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Gagal hapus data']);
        }
    }

    // GET by ID: Untuk directory
    public function services_directory($id = null)
    {
        if (!$id) {
            echo json_encode(['success' => false, 'message' => 'ID wajib ada']);
            return;
        }
        $data = $this->Interface_management_model->get_by_id($id);
        if ($data && !empty($data['rrd_path'])) {
            echo json_encode([
                'success' => true,
                'rrd_path' => $data['rrd_path'],
                'rrd_alias' => $data['rrd_alias'],
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Directory tidak ditemukan']);
        }
    }
    public function services_import_bulk()
    {
        $payload = json_decode($this->input->raw_input_stream, true);
        $rows = $payload['rows'] ?? [];

        $clean = [];
        foreach ($rows as $r) {
            $id        = isset($r['id']) ? trim((string)$r['id']) : '';
            $peering   = trim($r['peering']   ?? '');
            $location  = trim($r['location']  ?? '');
            $interface = trim($r['interface'] ?? '');
            $pop       = trim($r['pop']       ?? ($r['pop_site'] ?? ''));

            if ($peering === '' || $location === '' || $interface === '' || $pop === '') {
                $r['_valid'] = false;
                $r['_error'] = 'peering, location, interface, dan pop wajib';
                $clean[] = $r;
                continue;
            }

            $data = [
                'peering'    => $peering,
                'location'   => $location,
                'interface'  => $interface,
                'pop'        => $pop,

                // kolom lain
                'rrd_path'   => $r['rrd_path']   ?? null,
                'rrd_alias'  => $r['rrd_alias']  ?? null,
                'rrd_status' => $r['rrd_status'] ?? null,
                'service'    => $r['service']    ?? null,
            ];

            // Capacity -> float
            if (isset($r['Capacity']) && $r['Capacity'] !== '') {
                $raw = preg_replace('/[^\d\.\-]/', '', (string)$r['Capacity']);
                $data['Capacity'] = $raw === '' ? null : (float)$raw;
            } else {
                $data['Capacity'] = null;
            }

            $data['_valid'] = true;
            if ($id !== '' && ctype_digit($id)) {
                $data['_id'] = (int)$id; // prefer update by ID jika ada
            }
            $clean[] = $data;
        }

        $result = $this->Interface_management_model->bulk_import_with_pop($clean);

        return $this->output->set_content_type('application/json')
            ->set_output(json_encode($result));
    }
}
