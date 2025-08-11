<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Interface_management extends MX_Controller
{
    public function index()
    {
        // Cek apakah bisa load view
        $this->load->view('interface_management_view');
    }
}
