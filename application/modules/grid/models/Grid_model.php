<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Grid_model extends CI_Model
{
    // Ambil semua data
    public function get_all()
    {
        return $this->db->get('telkom_ref_service')->result_array();
    }

    // Insert data baru
    public function insert($data)
    {
        unset($data['id']);

        // Pastikan Capacity numerik (bisa null jika tidak ada)
        $data['Capacity'] = isset($data['Capacity']) && is_numeric($data['Capacity']) ? floatval($data['Capacity']) : null;

        $allowed = [
            'peering',
            'location',
            'interface',
            'pop',
            'rrd_path',
            'rrd_alias',
            'rrd_status',
            'Capacity',
            'service'
        ];

        $insertData = array_intersect_key($data, array_flip($allowed));
        $this->db->insert('telkom_ref_service', $insertData);
        return $this->db->insert_id();
    }

    // Update data
    public function update($id, $data)
    {
        unset($data['id']);

        $data['Capacity'] = isset($data['Capacity']) && is_numeric($data['Capacity']) ? floatval($data['Capacity']) : null;

        $allowed = [
            'peering',
            'location',
            'interface',
            'pop',
            'rrd_path',
            'rrd_alias',
            'rrd_status',
            'Capacity',
            'service'
        ];

        $updateData = array_intersect_key($data, array_flip($allowed));
        $this->db->where('id', $id);
        return $this->db->update('telkom_ref_service', $updateData);
    }

    // Hapus data
    public function delete($id)
    {
        $this->db->where('id', $id);
        return $this->db->delete('telkom_ref_service');
    }

    public function get_by_id($id) // get data directory by id
    {
        return $this->db->get_where('telkom_ref_service', ['id' => $id])->row_array();
    }

}
